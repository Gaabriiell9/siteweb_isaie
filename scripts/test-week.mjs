/**
 * Tests pour la fonction buildWeek
 * Usage: npm run test:week
 */

import { buildWeek } from '../src/lib/week.js';

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${PASS} ${name}`);
    passed++;
  } catch (e) {
    console.log(`${FAIL} ${name}`);
    console.log(`   ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('\n=== Tests buildWeek ===\n');

// Test 1: Semaine vide (pas de services ni cellules)
test('Semaine vide retourne 7 jours sans evenements', () => {
  const week = buildWeek({
    services: [],
    cellules: [],
    aujourdhui: new Date('2026-09-21T12:00:00Z'),
    fuseau: 'Europe/Paris',
  });

  assert(week.length === 7, `Attendu 7 jours, recu ${week.length}`);
  assert(week[0].estAujourdhui === true, 'Le premier jour doit etre aujourdhui');
  assert(week[0].cultes.length === 0, 'Pas de cultes attendus');
  assert(week[0].cellules.length === 0, 'Pas de cellules attendues');
  assert(week[1].estAujourdhui === false, 'Le deuxieme jour ne doit pas etre aujourdhui');
});

// Test 2: Culte un samedi
test('Culte un samedi apparait au bon jour', () => {
  const week = buildWeek({
    services: [
      { id: '1', date_service: '2026-09-26', heure_debut: '10:00', titre: 'Culte du samedi' },
    ],
    cellules: [],
    aujourdhui: new Date('2026-09-21T12:00:00Z'),
    fuseau: 'Europe/Paris',
  });

  const samedi = week.find(j => j.date === '2026-09-26');
  assert(samedi, 'Le samedi 26 doit exister dans la semaine');
  assert(samedi.nom === 'Samedi', `Attendu Samedi, recu ${samedi.nom}`);
  assert(samedi.cultes.length === 1, 'Un culte attendu');
  assert(samedi.cultes[0].titre === 'Culte du samedi', 'Titre du culte incorrect');
});

// Test 3: Cellule un mardi
test('Cellule un mardi apparait au bon jour', () => {
  const week = buildWeek({
    services: [],
    cellules: [
      { id: 'c1', nom: 'Cellule Nord', jour_semaine: 'Mardi', heure_debut: '19:30', lieu: 'Maison Paul' },
    ],
    aujourdhui: new Date('2026-09-21T12:00:00Z'),
    fuseau: 'Europe/Paris',
  });

  const mardi = week.find(j => j.nom === 'Mardi');
  assert(mardi, 'Le mardi doit exister');
  assert(mardi.cellules.length === 1, 'Une cellule attendue');
  assert(mardi.cellules[0].nom === 'Cellule Nord', 'Nom de cellule incorrect');
  assert(mardi.cellules[0].lieu === 'Maison Paul', 'Lieu incorrect');
});

// Test 4: Jour courant marque
test('Jour courant est marque estAujourdhui', () => {
  const week = buildWeek({
    services: [],
    cellules: [],
    aujourdhui: new Date('2026-09-23T08:00:00Z'),
    fuseau: 'Europe/Paris',
  });

  const aujourdhui = week.find(j => j.estAujourdhui);
  assert(aujourdhui, 'Un jour doit etre marque comme aujourdhui');
  assert(aujourdhui.date === '2026-09-23', `Attendu 2026-09-23, recu ${aujourdhui.date}`);
  assert(aujourdhui.nom === 'Mercredi', `Attendu Mercredi, recu ${aujourdhui.nom}`);
});

// Test 5: Fuseau America/Cayenne change le "aujourd'hui" vers 01h00 Paris
test('Fuseau America/Cayenne decale le jour courant', () => {
  // A 01h00 Paris le 22 sept, il est 20h00 le 21 sept en Guyane (-3h vs Paris qui est +2h UTC en ete)
  // Paris = UTC+2, Cayenne = UTC-3, donc 5h de decalage
  // Si Paris = 01h00 le 22, Cayenne = 20h00 le 21

  const week = buildWeek({
    services: [],
    cellules: [],
    aujourdhui: new Date('2026-09-21T23:00:00Z'), // 01h00 Paris le 22, 20h00 Cayenne le 21
    fuseau: 'America/Cayenne',
  });

  const aujourdhui = week.find(j => j.estAujourdhui);
  assert(aujourdhui, 'Un jour doit etre marque comme aujourdhui');
  // En Cayenne a 20h00 UTC-3, on est encore le 21
  assert(aujourdhui.date === '2026-09-21', `Attendu 2026-09-21 en Cayenne, recu ${aujourdhui.date}`);
  assert(aujourdhui.nom === 'Lundi', `Attendu Lundi, recu ${aujourdhui.nom}`);
});

// Test 6: Plusieurs cultes tries par heure
test('Plusieurs cultes sont tries par heure', () => {
  const week = buildWeek({
    services: [
      { id: '1', date_service: '2026-09-21', heure_debut: '18:00', titre: 'Culte du soir' },
      { id: '2', date_service: '2026-09-21', heure_debut: '10:00', titre: 'Culte du matin' },
    ],
    cellules: [],
    aujourdhui: new Date('2026-09-21T12:00:00Z'),
    fuseau: 'Europe/Paris',
  });

  assert(week[0].cultes.length === 2, 'Deux cultes attendus');
  assert(week[0].cultes[0].heure === '10:00', 'Premier culte a 10h');
  assert(week[0].cultes[1].heure === '18:00', 'Deuxieme culte a 18h');
});

console.log(`\n=== Resultats: ${passed} passes, ${failed} echoues ===\n`);

process.exit(failed > 0 ? 1 : 0);
