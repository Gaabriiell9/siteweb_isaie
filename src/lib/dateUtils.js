/**
 * Utilitaires de calcul de dates et statuts pour les services
 * Les heures sont interpretees dans le fuseau horaire de l'eglise
 */

const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Obtient les composants de date/heure dans un fuseau donne
 * @param {Date} date
 * @param {string} tz
 * @returns {{year: number, month: number, day: number, hour: number, minute: number}}
 */
function getPartsInTimezone(date, tz) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === 24 ? 0 : get('hour'),
    minute: get('minute'),
  };
}

/**
 * Convertit une date/heure locale dans un fuseau en timestamp UTC
 * Approche: recherche binaire de l'instant UTC qui correspond a l'heure locale desiree
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {string} timeStr - Heure au format HH:MM
 * @param {string} tz - Fuseau horaire
 * @returns {Date}
 */
export function parseLocalDateTime(dateStr, timeStr, tz = DEFAULT_TIMEZONE) {
  if (!dateStr) return new Date(NaN);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').split(':').map(Number);

  // Estimation initiale: supposer que le fuseau est a +0
  // Puis ajuster en comparant ce qu'on obtient vs ce qu'on veut
  let estimate = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Obtenir l'heure dans le fuseau cible pour cette estimation
  let parts = getPartsInTimezone(new Date(estimate), tz);

  // Calculer la difference en minutes
  const targetMinutes = hour * 60 + minute;
  let gotMinutes = parts.hour * 60 + parts.minute;

  // Ajuster pour le jour
  if (parts.day !== day || parts.month !== month || parts.year !== year) {
    // Le jour est different, on doit ajuster de +/- 24h
    if (parts.day < day || parts.month < month || parts.year < year) {
      gotMinutes -= 24 * 60;
    } else {
      gotMinutes += 24 * 60;
    }
  }

  const diffMinutes = targetMinutes - gotMinutes;
  estimate += diffMinutes * 60 * 1000;

  // Verification finale
  parts = getPartsInTimezone(new Date(estimate), tz);
  if (parts.hour !== hour || parts.minute !== minute) {
    // Cas rare (changement d'heure DST), on refait un ajustement
    gotMinutes = parts.hour * 60 + parts.minute;
    const diff2 = targetMinutes - gotMinutes;
    estimate += diff2 * 60 * 1000;
  }

  return new Date(estimate);
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
 * @param {Date} [nowOverride] - Pour les tests, permet de simuler l'heure actuelle
 * @returns {'a_venir' | 'en_cours' | 'termine'}
 */
export function getServiceStatut(event, tz = DEFAULT_TIMEZONE, nowOverride = null) {
  if (!event?.date_service) return 'termine';

  const now = nowOverride || new Date();
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
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDateStr = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')}`;
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
