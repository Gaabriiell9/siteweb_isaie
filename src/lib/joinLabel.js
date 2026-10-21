/**
 * Retourne un libellé de bouton adapté selon la plateforme de réunion.
 * @param {string} url - Lien de réunion
 * @param {string} fallback - Texte par défaut si plateforme non reconnue
 * @returns {string|null}
 */
export function getJoinLabel(url, fallback = 'Rejoindre') {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('zoom')) return 'Rejoindre sur Zoom';
    if (hostname.includes('whatsapp') || hostname.includes('wa.me')) return 'Rejoindre sur WhatsApp';
    if (hostname.includes('meet.google')) return 'Rejoindre sur Google Meet';
    if (hostname.includes('teams')) return 'Rejoindre sur Teams';
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname === 'fb.com') return 'Rejoindre sur Facebook';
    return fallback;
  } catch {
    return fallback;
  }
}
