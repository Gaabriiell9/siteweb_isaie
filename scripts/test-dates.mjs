#!/usr/bin/env node
/**
 * Tests unitaires pour le calcul des statuts de service
 * Usage: npm run test:dates
 */

/**
 * Convertit une date/heure locale dans un fuseau en timestamp UTC
 * Approche: on utilise toLocaleString pour trouver l'offset du fuseau
 */
function parseLocalDateTime(dateStr, timeStr, tz) {
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

  // Ajuster en tenant compte du mois/annee
  let diffMinutes = wantedMinutes - gotMinutes;

  // Si le jour est different d'un mois, ajuster
  if (tzMonth !== month || tzYear !== year) {
    // Cas de changement de mois, simplifier
    if (tzDay > 20 && day < 10) {
      diffMinutes += 30 * 24 * 60; // Ajouter environ un mois
    } else if (tzDay < 10 && day > 20) {
      diffMinutes -= 30 * 24 * 60;
    }
  }

  return new Date(utcCandidate + diffMinutes * 60 * 1000);
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

test(
  'a 22:59 Cayenne = a_venir',
  getServiceStatut(service2, tz2, parseLocalDateTime('2026-09-19', '22:59', tz2)),
  'a_venir'
);

test(
  'a 23:30 Cayenne = en_cours',
  getServiceStatut(service2, tz2, parseLocalDateTime('2026-09-19', '23:30', tz2)),
  'en_cours'
);

test(
  'a 00:30 le 20 Cayenne = en_cours',
  getServiceStatut(service2, tz2, parseLocalDateTime('2026-09-20', '00:30', tz2)),
  'en_cours'
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

console.log('\n===========================================');
console.log(`RESULTATS: ${passed} OK, ${failed} ECHEC`);
console.log('===========================================');

process.exit(failed > 0 ? 1 : 0);
