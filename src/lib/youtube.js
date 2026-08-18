// ─── YouTube URL utilities ────────────────────────────────────────

/**
 * Extrait l'ID d'une vidéo YouTube depuis différents formats d'URL
 * Supporte:
 *   - https://www.youtube.com/watch?v=vHOv3sJWkUs
 *   - https://youtu.be/vHOv3sJWkUs
 *   - https://www.youtube.com/embed/vHOv3sJWkUs
 *   - https://www.youtube.com/live/vHOv3sJWkUs
 *
 * @param {string} url - URL YouTube
 * @returns {string|null} - ID de la vidéo ou null
 */
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;

  // Format: youtube.com/watch?v=ID
  let match = url.match(/youtube\.com\/watch\?v=([^&\s]+)/);
  if (match) return match[1];

  // Format: youtu.be/ID
  match = url.match(/youtu\.be\/([^?&\s]+)/);
  if (match) return match[1];

  // Format: youtube.com/embed/ID
  match = url.match(/youtube\.com\/embed\/([^?&\s]+)/);
  if (match) return match[1];

  // Format: youtube.com/live/ID
  match = url.match(/youtube\.com\/live\/([^?&\s]+)/);
  if (match) return match[1];

  return null;
}

/**
 * Convertit une URL YouTube en URL embed pour iframe
 * Retourne null si l'URL n'est pas un lien YouTube valide
 *
 * @param {string} url - URL YouTube (watch, youtu.be, embed, live)
 * @returns {string|null} - URL embed (https://www.youtube.com/embed/ID) ou null
 *
 * @example
 * getYoutubeEmbedUrl('https://www.youtube.com/watch?v=vHOv3sJWkUs')
 * // => 'https://www.youtube.com/embed/vHOv3sJWkUs'
 */
export function getYoutubeEmbedUrl(url) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
}

/**
 * Vérifie si une URL est une URL YouTube valide
 * @param {string} url
 * @returns {boolean}
 */
export function isYoutubeUrl(url) {
  return extractYoutubeId(url) !== null;
}
