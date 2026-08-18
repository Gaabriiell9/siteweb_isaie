// ─── Video URL utilities ──────────────────────────────────────────

/**
 * Extrait l'ID d'une vidéo YouTube depuis différents formats d'URL
 * Supporte: watch?v=, /live/, /embed/, youtu.be/
 */
export function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([^?&\s]+)/);
  return m ? m[1] : null;
}

/**
 * Convertit une URL YouTube en URL embed pour iframe
 * Retourne null si ce n'est pas une URL YouTube valide
 */
export function getYoutubeEmbedUrl(url, options = {}) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    ...options,
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Vérifie si une URL est une URL YouTube
 */
export function isYoutubeUrl(url) {
  if (!url) return false;
  return /youtube\.com|youtu\.be/i.test(url);
}

/**
 * Vérifie si une URL est une URL Zoom
 */
export function isZoomUrl(url) {
  if (!url) return false;
  return /zoom\.us/i.test(url);
}

/**
 * Retourne le type de plateforme vidéo
 */
export function getVideoPlatform(url) {
  if (!url) return null;
  if (isYoutubeUrl(url)) return 'youtube';
  if (isZoomUrl(url)) return 'zoom';
  return 'other';
}
