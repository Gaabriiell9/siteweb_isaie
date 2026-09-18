/**
 * Utilitaires de calcul de dates et statuts pour les services
 * Les heures sont interpretees dans le fuseau horaire de l'eglise
 */

const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Convertit une date/heure locale dans un fuseau en timestamp UTC
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {string} timeStr - Heure au format HH:MM
 * @param {string} tz - Fuseau horaire
 * @returns {Date}
 */
export function parseLocalDateTime(dateStr, timeStr, tz = DEFAULT_TIMEZONE) {
  if (!dateStr) return new Date(NaN);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').split(':').map(Number);

  // Creer une date "candidate" en UTC
  const utcCandidate = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Obtenir l'heure dans le fuseau cible pour cette date UTC
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(utcCandidate));
  const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0');

  const tzYear = get('year');
  const tzMonth = get('month');
  const tzDay = get('day');
  const tzHour = get('hour') === 24 ? 0 : get('hour');
  const tzMinute = get('minute');

  // Calculer la difference entre ce qu'on veut et ce qu'on a
  const wantedMinutes = day * 24 * 60 + hour * 60 + minute;
  const gotMinutes = tzDay * 24 * 60 + tzHour * 60 + tzMinute;

  let diffMinutes = wantedMinutes - gotMinutes;

  // Si le jour est different d'un mois, ajuster
  if (tzMonth !== month || tzYear !== year) {
    if (tzDay > 20 && day < 10) {
      diffMinutes += 30 * 24 * 60;
    } else if (tzDay < 10 && day > 20) {
      diffMinutes -= 30 * 24 * 60;
    }
  }

  return new Date(utcCandidate + diffMinutes * 60 * 1000);
}

/**
 * Formate une date dans un fuseau horaire
 * @param {Date} date
 * @param {string} tz
 * @param {Object} options - Options Intl.DateTimeFormat
 * @returns {string}
 */
export function formatInTimezone(date, tz = DEFAULT_TIMEZONE, options = {}) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: tz, ...options }).format(date);
}

/**
 * Calcule le statut d'un service par rapport a l'heure actuelle
 * @param {Object} event - { date_service, heure_debut, heure_fin }
 * @param {string} tz - Fuseau horaire
 * @returns {'a_venir' | 'en_cours' | 'termine'}
 */
export function getServiceStatut(event, tz = DEFAULT_TIMEZONE) {
  if (!event?.date_service) return 'termine';

  const now = new Date();
  const dateStr = event.date_service;
  const heureDeb = event.heure_debut || '10:00';
  const heureFin = event.heure_fin || '11:30';

  const [hDeb, mDeb] = heureDeb.split(':').map(Number);
  const [hFin, mFin] = heureFin.split(':').map(Number);
  const debutMinutes = hDeb * 60 + mDeb;
  const finMinutes = hFin * 60 + mFin;

  const debut = parseLocalDateTime(dateStr, heureDeb, tz);

  let fin;
  if (finMinutes <= debutMinutes) {
    // La fin est le lendemain
    const [year, month, day] = dateStr.split('-').map(Number);
    const nextDay = new Date(year, month - 1, day + 1);
    const nextDateStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    fin = parseLocalDateTime(nextDateStr, heureFin, tz);
  } else {
    fin = parseLocalDateTime(dateStr, heureFin, tz);
  }

  if (now < debut) return 'a_venir';
  if (now >= debut && now < fin) return 'en_cours';
  return 'termine';
}

/**
 * Alias pour compatibilite avec l'ancien code
 */
export function getEventEtat(event, options = {}) {
  const tz = options.timezone || DEFAULT_TIMEZONE;
  return getServiceStatut(event, tz);
}

/**
 * Calcule le temps restant avant un evenement
 * @param {Date} targetDate
 * @returns {{days: number, hours: number, minutes: number, seconds: number, total: number}}
 */
export function getCountdown(targetDate) {
  const now = new Date();
  const total = targetDate.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Obtient le timestamp de debut d'un service
 * @param {Object} event - { date_service, heure_debut }
 * @param {string} tz - Fuseau horaire
 * @returns {Date}
 */
export function getServiceStartTime(event, tz = DEFAULT_TIMEZONE) {
  if (!event?.date_service) return new Date(NaN);
  return parseLocalDateTime(event.date_service, event.heure_debut || '10:00', tz);
}
