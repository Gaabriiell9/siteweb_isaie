#!/usr/bin/env node
/**
 * Tests unitaires pour le calcul des statuts de service
 * Usage: npm run test:dates
 */

/**
 * Obtient les composants de date/heure dans un fuseau donne
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
 */
function parseLocalDateTime(dateStr, timeStr, tz) {
  if (!dateStr) return new Date(NaN);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').split(':').map(Number);

  let estimate = Date.UTC(year, month - 1, day, hour, minute, 0);
  let parts = getPartsInTimezone(new Date(estimate), tz);

  const targetMinutes = hour * 60 + minute;
  let gotMinutes = parts.hour * 60 + parts.minute;

  if (parts.day !== day || parts.month !== month || parts.year !== year) {
    if (parts.day < day || parts.month < month || parts.year < year) {
      gotMinutes -= 24 * 60;
    } else {
      gotMinutes += 24 * 60;
    }
  }

  const diffMinutes = targetMinutes - gotMinutes;
  estimate += diffMinutes * 60 * 1000;

  parts = getPartsInTimezone(new Date(estimate), tz);
  if (parts.hour !== hour || parts.minute !== minute) {
    gotMinutes = parts.hour * 60 + parts.minute;
    const diff2 = targetMinutes - gotMinutes;
    estimate += diff2 * 60 * 1000;
  }

  return new Date(estimate);
}

function getServiceStatut(event, tz, nowOverride) {
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

let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  if (actual === expected) {
    console.log(`[OK]   ${name}`);
    passed++;
  } else {
    console.log(`[FAIL] ${name}`);
    console.log(`       Attendu: ${expected}, Recu: ${actual}`);
    failed++;
  }
}

console.log('=== TESTS CALCUL STATUT SERVICE ===\n');

console.log('--- Service 2026-09-19 01:00-02:00 (Europe/Paris) ---');

const service1 = { date_service: '2026-09-19', heure_debut: '01:00', heure_fin: '02:00' };
const tz1 = 'Europe/Paris';

test(
  'a 00:59 = a_venir',
  getServiceStatut(service1, tz1, parseLocalDateTime('2026-09-19', '00:59', tz1)),
  'a_venir'
);

test(
  'a 01:00 = en_cours',
  getServiceStatut(service1, tz1, parseLocalDateTime('2026-09-19', '01:00', tz1)),
  'en_cours'
);

test(
  'a 01:15 = en_cours',
  getServiceStatut(service1, tz1, parseLocalDateTime('2026-09-19', '01:15', tz1)),
  'en_cours'
);

test(
  'a 02:00 = termine',
  getServiceStatut(service1, tz1, parseLocalDateTime('2026-09-19', '02:00', tz1)),
  'termine'
);

console.log('\n--- Service 2026-09-19 23:00-01:00 (traversee minuit, Europe/Paris) ---');

const service2 = { date_service: '2026-09-19', heure_debut: '23:00', heure_fin: '01:00' };

test(
  'a 22:59 le 19 = a_venir',
  getServiceStatut(service2, tz1, parseLocalDateTime('2026-09-19', '22:59', tz1)),
  'a_venir'
);

test(
  'a 23:00 le 19 = en_cours',
  getServiceStatut(service2, tz1, parseLocalDateTime('2026-09-19', '23:00', tz1)),
  'en_cours'
);

test(
  'a 00:30 le 20 = en_cours',
  getServiceStatut(service2, tz1, parseLocalDateTime('2026-09-20', '00:30', tz1)),
  'en_cours'
);

test(
  'a 01:00 le 20 = termine',
  getServiceStatut(service2, tz1, parseLocalDateTime('2026-09-20', '01:00', tz1)),
  'termine'
);

console.log('\n--- Service 2026-09-19 23:00-01:00 (America/Cayenne, UTC-3) ---');

const tz2 = 'America/Cayenne';
const service2Cayenne = { date_service: '2026-09-19', heure_debut: '23:00', heure_fin: '01:00' };

test(
  'a 22:59 Cayenne = a_venir',
  getServiceStatut(service2Cayenne, tz2, parseLocalDateTime('2026-09-19', '22:59', tz2)),
  'a_venir'
);

test(
  'a 23:30 Cayenne = en_cours',
  getServiceStatut(service2Cayenne, tz2, parseLocalDateTime('2026-09-19', '23:30', tz2)),
  'en_cours'
);

test(
  'a 00:30 le 20 Cayenne = en_cours',
  getServiceStatut(service2Cayenne, tz2, parseLocalDateTime('2026-09-20', '00:30', tz2)),
  'en_cours'
);

test(
  'a 01:00 le 20 Cayenne = termine',
  getServiceStatut(service2Cayenne, tz2, parseLocalDateTime('2026-09-20', '01:00', tz2)),
  'termine'
);

console.log('\n--- Service standard 10:00-11:30 (Europe/Paris) ---');

const service3 = { date_service: '2026-09-20', heure_debut: '10:00', heure_fin: '11:30' };

test(
  'a 09:59 = a_venir',
  getServiceStatut(service3, tz1, parseLocalDateTime('2026-09-20', '09:59', tz1)),
  'a_venir'
);

test(
  'a 10:00 = en_cours',
  getServiceStatut(service3, tz1, parseLocalDateTime('2026-09-20', '10:00', tz1)),
  'en_cours'
);

test(
  'a 11:29 = en_cours',
  getServiceStatut(service3, tz1, parseLocalDateTime('2026-09-20', '11:29', tz1)),
  'en_cours'
);

test(
  'a 11:30 = termine',
  getServiceStatut(service3, tz1, parseLocalDateTime('2026-09-20', '11:30', tz1)),
  'termine'
);

console.log('\n--- Verification conversion fuseau (debug) ---');

const parisTime = parseLocalDateTime('2026-09-19', '01:15', 'Europe/Paris');
const cayenneTime = parseLocalDateTime('2026-09-19', '01:15', 'America/Cayenne');
console.log(`01:15 Paris  = ${parisTime.toISOString()} (UTC)`);
console.log(`01:15 Cayenne = ${cayenneTime.toISOString()} (UTC)`);
console.log(`Difference = ${(cayenneTime - parisTime) / (1000 * 60 * 60)} heures (attendu: ~5h car Paris UTC+2, Cayenne UTC-3)`);

console.log('\n===========================================');
console.log(`RESULTATS: ${passed} OK, ${failed} ECHEC`);
console.log('===========================================');

process.exit(failed > 0 ? 1 : 0);
