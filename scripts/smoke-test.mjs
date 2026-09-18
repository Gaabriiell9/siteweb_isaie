#!/usr/bin/env node
/**
 * Smoke test script pour le frontend ISAIE/ETC
 * Verifie que les requetes Supabase de base fonctionnent avec la cle anon
 *
 * Usage: npm run test:smoke
 * Ou: node --env-file=.env.local scripts/smoke-test.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERREUR: Variables REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY requises');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let passed = 0;
let failed = 0;

function ok(name, detail = '') {
  console.log(`[OK]   ${name}${detail ? ' - ' + detail : ''}`);
  passed++;
}

function fail(name, reason) {
  console.log(`[FAIL] ${name} - ${reason}`);
  failed++;
}

// ============================================================================
// TESTS DE LECTURE AUTORISEE (tables publiques)
// ============================================================================

async function testReadAllowed() {
  console.log('\n--- LECTURE AUTORISEE (anon) ---');

  // videos
  {
    const { data, error } = await supabase
      .from('videos')
      .select('id, titre, youtube_url, date_publi, is_live')
      .limit(1);
    if (error) fail('videos', error.message);
    else ok('videos', `colonnes: id, titre, youtube_url, date_publi, is_live`);
  }

  // services
  {
    const { data, error } = await supabase
      .from('services')
      .select('id, type, titre, date_service, heure_debut, heure_fin, lien_live')
      .limit(1);
    if (error) fail('services', error.message);
    else ok('services', `colonnes: id, type, titre, date_service, heure_debut, heure_fin, lien_live`);
  }

  // cell_groups
  {
    const { data, error } = await supabase
      .from('cell_groups')
      .select('id, nom, lieu, jour_semaine, heure_debut, heure_fin, responsable_nom')
      .limit(1);
    if (error) fail('cell_groups', error.message);
    else ok('cell_groups', `colonnes: id, nom, lieu, jour_semaine, heure_debut, heure_fin, responsable_nom`);
  }

  // messages_priere
  {
    const { data, error } = await supabase
      .from('messages_priere')
      .select('id, famille, jour_semaine, semaine, titre, contenu, verset')
      .limit(1);
    if (error) fail('messages_priere', error.message);
    else ok('messages_priere', `colonnes: id, famille, jour_semaine, semaine, titre, contenu, verset`);
  }

  // announcements
  {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, titre, contenu, pinned, date_publi, date_fin, visible')
      .limit(1);
    if (error) fail('announcements', error.message);
    else ok('announcements', `colonnes: id, titre, contenu, pinned, date_publi, date_fin, visible`);
  }

  // site_settings
  {
    const { data, error } = await supabase
      .from('site_settings')
      .select('cle, valeur')
      .limit(1);
    if (error) fail('site_settings', error.message);
    else ok('site_settings', `colonnes: cle, valeur`);
  }

  // formules_paiement (2 lignes attendues: integral et echelonne)
  {
    const { data, error } = await supabase
      .from('formules_paiement')
      .select('id, nom, type, prix_total_cents, montant_echeance_cents, nombre_echeances')
      .eq('actif', true)
      .order('ordre_affichage');
    if (error) {
      fail('formules_paiement', error.message);
    } else if (!data || data.length < 2) {
      fail('formules_paiement', `attendu >= 2 lignes, recu ${data?.length || 0}`);
    } else {
      const types = data.map(f => f.type);
      if (!types.includes('integral') || !types.includes('echelonne')) {
        fail('formules_paiement', `types attendus: integral, echelonne; recus: ${types.join(', ')}`);
      } else {
        ok('formules_paiement', `${data.length} formules, colonnes prix_total_cents, montant_echeance_cents OK`);
      }
    }
  }

  // modules_formation (au moins 1 ligne)
  {
    const { data, error } = await supabase
      .from('modules_formation')
      .select('id, numero, titre, description')
      .order('numero')
      .limit(5);
    if (error) {
      fail('modules_formation', error.message);
    } else if (!data || data.length < 1) {
      fail('modules_formation', `attendu >= 1 ligne, recu ${data?.length || 0}`);
    } else {
      ok('modules_formation', `${data.length} modules`);
    }
  }
}

// ============================================================================
// TESTS DE LECTURE REFUSEE (tables protegees)
// ============================================================================

async function testReadDenied() {
  console.log('\n--- LECTURE REFUSEE (anon) ---');

  const protectedTables = [
    'eleves',
    'paiements',
    'messages',
    'donations',
    'admins',
    'progression_eleve',
    'evaluations',
    'ressources_module',
    'sessions_live'
  ];

  for (const table of protectedTables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      ok(table, `acces refuse (${error.code})`);
    } else if (!data || data.length === 0) {
      ok(table, `0 ligne (RLS bloque)`);
    } else {
      fail(table, `ATTENTION: ${data.length} ligne(s) accessibles en anon!`);
    }
  }
}

// ============================================================================
// TESTS D'INSERTION REFUSEE
// ============================================================================

async function testInsertDenied() {
  console.log('\n--- INSERTION REFUSEE (anon) ---');

  // donations
  {
    const { error } = await supabase.from('donations').insert([{
      montant_cents: 1000,
      methode: 'test',
      statut: 'pending'
    }]);
    if (error) {
      ok('donations INSERT', `refuse (${error.code})`);
    } else {
      fail('donations INSERT', 'ATTENTION: insertion reussie en anon!');
    }
  }

  // videos
  {
    const { error } = await supabase.from('videos').insert([{
      titre: 'Test smoke',
      youtube_url: 'https://youtube.com/test',
      visible: false
    }]);
    if (error) {
      ok('videos INSERT', `refuse (${error.code})`);
    } else {
      fail('videos INSERT', 'ATTENTION: insertion reussie en anon!');
    }
  }

  // announcements
  {
    const { error } = await supabase.from('announcements').insert([{
      titre: 'Test smoke',
      contenu: 'Test',
      visible: false
    }]);
    if (error) {
      ok('announcements INSERT', `refuse (${error.code})`);
    } else {
      fail('announcements INSERT', 'ATTENTION: insertion reussie en anon!');
    }
  }
}

// ============================================================================
// TEST RPC REFUSE
// ============================================================================

async function testRpcDenied() {
  console.log('\n--- RPC REFUSE (anon) ---');

  const { data, error } = await supabase.rpc('get_eleves_email_confirmed');
  if (error) {
    ok('rpc get_eleves_email_confirmed', `refuse (${error.code})`);
  } else {
    fail('rpc get_eleves_email_confirmed', 'ATTENTION: appel reussi en anon!');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== SMOKE TEST SUPABASE ===');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Anon key: ${SUPABASE_ANON_KEY.slice(0, 20)}...`);

  await testReadAllowed();
  await testReadDenied();
  await testInsertDenied();
  await testRpcDenied();

  console.log('\n===========================================');
  console.log(`RESULTATS: ${passed} OK, ${failed} ECHEC`);
  console.log('===========================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
