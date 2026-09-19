/**
 * Construit une semaine de 7 jours a partir d'aujourd'hui
 * avec les cultes et cellules pour chaque jour
 */

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Obtient la date actuelle dans un fuseau horaire donne
 * @param {string} tz - Fuseau horaire (ex: 'Europe/Paris')
 * @returns {{ year: number, month: number, day: number, weekday: number }}
 */
function getTodayInTimezone(tz) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find(p => p.type === type)?.value;

  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    weekday: weekdayMap[get('weekday')] || 0,
  };
}

/**
 * Ajoute N jours a une date (year, month, day)
 * @param {{ year: number, month: number, day: number }} date
 * @param {number} n
 * @returns {{ year: number, month: number, day: number, weekday: number }}
 */
function addDays(date, n) {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + n));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
  };
}

/**
 * Formate une date en YYYY-MM-DD
 */
function formatDateISO(date) {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

/**
 * Construit une semaine de 7 jours
 * @param {Object} options
 * @param {Array} options.services - Liste des services
 * @param {Array} options.cellules - Liste des cellules
 * @param {Date} [options.aujourdhui] - Date de reference (pour tests)
 * @param {string} [options.fuseau] - Fuseau horaire
 * @returns {Array<{ nom: string, date: string, estAujourdhui: boolean, cultes: Array, cellules: Array }>}
 */
export function buildWeek({ services = [], cellules = [], aujourdhui = null, fuseau = 'Europe/Paris' }) {
  const today = aujourdhui
    ? {
        year: aujourdhui.getUTCFullYear(),
        month: aujourdhui.getUTCMonth() + 1,
        day: aujourdhui.getUTCDate(),
        weekday: aujourdhui.getUTCDay(),
      }
    : getTodayInTimezone(fuseau);

  const todayISO = formatDateISO(today);
  const week = [];

  for (let i = 0; i < 7; i++) {
    const dateObj = i === 0 ? today : addDays(today, i);
    const dateISO = formatDateISO(dateObj);
    const jourNom = JOURS_FR[dateObj.weekday];

    const cultesJour = (services || [])
      .filter(s => s.date_service === dateISO)
      .map(s => ({
        heure: s.heure_debut?.slice(0, 5) || '10:00',
        titre: s.titre,
        id: s.id,
        lien_live: s.lien_live,
      }))
      .sort((a, b) => a.heure.localeCompare(b.heure));

    const cellulesJour = (cellules || [])
      .filter(c => c.jour_semaine === jourNom)
      .map(c => ({
        nom: c.nom,
        heure: c.heure_debut?.slice(0, 5) || '19:00',
        lieu: c.lieu || '',
        id: c.id,
      }))
      .sort((a, b) => a.heure.localeCompare(b.heure));

    week.push({
      nom: jourNom,
      date: dateISO,
      dateFormatee: `${dateObj.day} ${['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'][dateObj.month - 1]}`,
      estAujourdhui: dateISO === todayISO,
      cultes: cultesJour,
      cellules: cellulesJour,
    });
  }

  return week;
}
