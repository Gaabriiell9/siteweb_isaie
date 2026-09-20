/**
 * Utilitaires de traitement d'images cote client
 * - Compression et redimensionnement avant envoi
 * - Validation des formats
 */

const FORMATS_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const FORMATS_HEIC = ['image/heic', 'image/heif'];
const TAILLE_MAX_AVANT_COMPRESSION = 15 * 1024 * 1024; // 15 Mo
const TAILLE_CIBLE = 800 * 1024; // 800 Ko

/**
 * Valide le format d'un fichier image
 * @param {File} file
 * @returns {{ valide: boolean, erreur?: string }}
 */
export function validerFormatImage(file) {
  if (!file || !file.type) {
    return { valide: false, erreur: 'Fichier invalide.' };
  }

  if (file.size > TAILLE_MAX_AVANT_COMPRESSION) {
    return { valide: false, erreur: 'Image trop lourde (15 Mo maximum avant compression).' };
  }

  const type = file.type.toLowerCase();

  if (FORMATS_ACCEPTES.includes(type)) {
    return { valide: true };
  }

  if (FORMATS_HEIC.includes(type)) {
    if (typeof createImageBitmap === 'function') {
      return { valide: true, heic: true };
    }
    return {
      valide: false,
      erreur: 'Format HEIC non supporte par ce navigateur. Convertis l\'image en JPEG ou PNG.'
    };
  }

  return {
    valide: false,
    erreur: 'Format non accepte : utilise une image JPEG, PNG ou WebP.'
  };
}

/**
 * Compresse et redimensionne une image
 * @param {File} file - Fichier image a compresser
 * @param {Object} options
 * @param {number} options.maxSide - Taille maximale du plus grand cote (defaut: 1600)
 * @param {number} options.qualite - Qualite de compression 0-1 (defaut: 0.82)
 * @returns {Promise<{ blob: Blob, extension: string }>}
 */
export async function compresserImage(file, { maxSide = 1600, qualite = 0.82 } = {}) {
  const type = file.type.toLowerCase();

  // Les SVG ne sont pas recompresses
  if (type === 'image/svg+xml') {
    return { blob: file, extension: 'svg' };
  }

  // Creer un bitmap en respectant l'orientation EXIF
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'flipY' in ImageBitmapOptions ? 'from-image' : undefined,
  }).catch(() => createImageBitmap(file));

  let { width, height } = bitmap;

  // Redimensionner si necessaire
  if (width > maxSide || height > maxSide) {
    const ratio = Math.min(maxSide / width, maxSide / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Dessiner sur un canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // Essayer WebP d'abord
  let blob = await canvasToBlob(canvas, 'image/webp', qualite);
  let extension = 'webp';

  // Si WebP non supporte ou trop gros, essayer JPEG
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', qualite);
    extension = 'jpg';
  }

  // Si encore trop gros, reduire la qualite progressivement
  let q = qualite;
  while (blob && blob.size > TAILLE_CIBLE && q > 0.5) {
    q -= 0.1;
    blob = await canvasToBlob(canvas, `image/${extension === 'webp' ? 'webp' : 'jpeg'}`, q);
  }

  return { blob, extension };
}

/**
 * Convertit un canvas en Blob
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      quality
    );
  });
}

/**
 * Genere un nom de fichier ASCII pour le stockage
 * @param {string} prefix - Prefixe du chemin (ex: 'site/annonces')
 * @param {string} extension - Extension du fichier
 * @returns {string}
 */
export function genererNomFichier(prefix, extension) {
  const uuid = crypto.randomUUID();
  return `${prefix}/${uuid}.${extension}`;
}

/**
 * Traduit une erreur Supabase Storage en message utilisateur
 * @param {Error|Object} error
 * @returns {string}
 */
export function traduireErreurUpload(error) {
  if (!error) return 'Erreur inconnue.';

  const message = error.message || error.error || String(error);
  const status = error.status || error.statusCode;

  // Erreur d'autorisation
  if (status === 403 || error.code === '42501' || message.includes('permission')) {
    return 'Tu n\'as pas le droit d\'envoyer des images (compte non autorise).';
  }

  // Fichier trop gros
  if (status === 413 || message.includes('too large') || message.includes('size')) {
    return 'Image trop lourde (5 Mo maximum).';
  }

  // Format invalide
  if (status === 400 && (message.includes('mime') || message.includes('invalid') || message.includes('type'))) {
    return 'Format d\'image non accepte.';
  }

  // Erreur reseau
  if (message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch')) {
    return 'Connexion perdue, reessaie.';
  }

  // Erreur generique
  return `Envoi impossible : ${message}`;
}

/**
 * Verifie si une URL appartient au bucket etc-files
 * @param {string} url
 * @returns {boolean}
 */
export function estUrlEtcFiles(url) {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/etc-files/');
}

/**
 * Extrait le chemin du fichier depuis une URL publique Supabase
 * @param {string} url
 * @returns {string|null}
 */
export function extraireCheminDepuisUrl(url) {
  if (!estUrlEtcFiles(url)) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/etc-files\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}
