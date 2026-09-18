#!/usr/bin/env node
/**
 * Smoke test script pour le frontend ISAIE/ETC
 * Verifie que les requetes Supabase de base fonctionnent
 *
 * Usage: node scripts/smoke-test.mjs
 *
 * Necessite les variables d'environnement:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERREUR: Variables d\'environnement REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY requises');
  console.error('Conseil: source .env ou export les variables avant d\'executer ce script');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tests = [
  {
    name: 'services (cultes)',
    query: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, titre, date_service')
        .eq('visible', true)
        .eq('type', 'culte')
        .limit(3);
      return { data, error };
    }
  },
  {
    name: 'announcements',
    query: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, titre, pinned, date_publi')
        .eq('visible', true)
        .order('pinned', { ascending: false })
        .limit(3);
      return { data, error };
    }
  },
  {
    name: 'videos',
    query: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, titre, youtube_url')
        .eq('visible', true)
        .limit(3);
      return { data, error };
    }
  },
  {
    name: 'messages_priere',
    query: async () => {
      const { data, error } = await supabase
        .from('messages_priere')
        .select('id, famille, jour_semaine')
        .eq('visible', true)
        .limit(3);
      return { data, error };
    }
  },
  {
    name: 'formules_paiement',
    query: async () => {
      const { data, error } = await supabase
        .from('formules_paiement')
        .select('id, nom, type, prix_total_cents')
        .eq('actif', true)
        .order('ordre_affichage');
      return { data, error };
    }
  },
  {
    name: 'modules_formation',
    query: async () => {
      const { data, error } = await supabase
        .from('modules_formation')
        .select('id, numero, titre')
        .order('numero')
        .limit(3);
      return { data, error };
    }
  },
  {
    name: 'cell_groups',
    query: async () => {
      const { data, error } = await supabase
        .from('cell_groups')
        .select('id, nom, jour_semaine')
        .eq('visible', true)
        .limit(3);
      return { data, error };
    }
  },
  {
    name: 'site_settings',
    query: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('cle, valeur')
        .limit(5);
      return { data, error };
    }
  }
];

async function runTests() {
  console.log('=== SMOKE TEST SUPABASE ===\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Anon key: ${SUPABASE_ANON_KEY.slice(0, 20)}...`);
  console.log('');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const { data, error } = await test.query();

      if (error) {
        console.log(`[FAIL] ${test.name}`);
        console.log(`       Erreur: ${error.message}`);
        console.log(`       Code: ${error.code}`);
        failed++;
      } else {
        const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
        console.log(`[OK]   ${test.name} (${count} resultat${count > 1 ? 's' : ''})`);
        passed++;
      }
    } catch (err) {
      console.log(`[FAIL] ${test.name}`);
      console.log(`       Exception: ${err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`=== RESULTATS: ${passed} passes, ${failed} echecs ===`);

  if (failed > 0) {
    console.log('');
    console.log('Verifiez:');
    console.log('  1. Les tables existent dans Supabase');
    console.log('  2. Les politiques RLS sont configurees');
    console.log('  3. Les colonnes correspondent au schema v2');
    process.exit(1);
  }

  console.log('');
  console.log('Tous les tests ont reussi!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
