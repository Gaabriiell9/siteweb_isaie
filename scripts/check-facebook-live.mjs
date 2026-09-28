#!/usr/bin/env node
/**
 * Test: Boutons Facebook Live sur la page Cultes
 * Intercepte les requêtes REST et vérifie l'affichage des boutons
 *
 * Usage: node scripts/check-facebook-live.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const MOCK_SERVICES = {
  both: {
    id: 'test-both',
    type: 'culte',
    titre: 'Culte YouTube + Facebook',
    date_service: todayStr,
    heure_debut: '00:00',
    heure_fin: '23:59',
    lien_live: 'https://www.youtube.com/watch?v=test123',
    facebook_live_url: 'https://www.facebook.com/testlive',
    visible: true
  },
  fbOnly: {
    id: 'test-fb-only',
    type: 'culte',
    titre: 'Culte Facebook uniquement',
    date_service: todayStr,
    heure_debut: '00:00',
    heure_fin: '23:59',
    lien_live: null,
    facebook_live_url: 'https://www.facebook.com/testlive',
    visible: true
  },
  ytOnly: {
    id: 'test-yt-only',
    type: 'culte',
    titre: 'Culte YouTube uniquement',
    date_service: todayStr,
    heure_debut: '00:00',
    heure_fin: '23:59',
    lien_live: 'https://www.youtube.com/watch?v=test123',
    facebook_live_url: null,
    visible: true
  },
  future: {
    id: 'test-future',
    type: 'culte',
    titre: 'Culte futur',
    date_service: futureDate,
    heure_debut: '10:00',
    heure_fin: '11:30',
    lien_live: 'https://www.youtube.com/watch?v=test123',
    facebook_live_url: 'https://www.facebook.com/testlive',
    visible: true
  }
};

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

async function testScenario(browser, name, mockService, checks) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route('**/rest/v1/services**', async (route) => {
    const url = route.request().url();
    if (url.includes('select=') && url.includes('type')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockService])
      });
    } else if (url.includes('limit=1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockService)
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockService])
      });
    }
  });

  await page.route('**/rest/v1/announcements**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/cell_groups**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/videos**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/messages_priere**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/site_settings**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  try {
    await page.goto(`${BASE_URL}/cultes`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    for (const check of checks) {
      try {
        await check.fn(page);
        ok(`${name}: ${check.name}`);
      } catch (err) {
        fail(`${name}: ${check.name}`, err.message);
      }
    }
  } catch (err) {
    fail(name, `Page load failed: ${err.message}`);
  }

  await context.close();
}

async function main() {
  console.log('=== TEST FACEBOOK LIVE ===\n');

  const browser = await chromium.launch({ headless: true });

  // Test 1: Culte en cours avec YouTube + Facebook
  await testScenario(browser, 'YouTube + Facebook', MOCK_SERVICES.both, [
    {
      name: 'Lecteur YouTube visible',
      fn: async (page) => {
        const iframe = await page.$('.live-player iframe');
        if (!iframe) throw new Error('iframe YouTube non trouvé');
      }
    },
    {
      name: 'Bouton Facebook secondaire visible',
      fn: async (page) => {
        const fbBtn = await page.$('a.live-fb-btn');
        if (!fbBtn) throw new Error('Bouton Facebook secondaire non trouvé');
        const text = await fbBtn.textContent();
        if (!text.includes('Facebook')) throw new Error(`Texte incorrect: ${text}`);
      }
    }
  ]);

  // Test 2: Culte en cours avec Facebook uniquement
  await testScenario(browser, 'Facebook uniquement', MOCK_SERVICES.fbOnly, [
    {
      name: 'Pas de lecteur YouTube',
      fn: async (page) => {
        const iframe = await page.$('.live-player iframe');
        if (iframe) throw new Error('iframe YouTube ne devrait pas être présent');
      }
    },
    {
      name: 'Bouton Facebook principal visible',
      fn: async (page) => {
        const fbBtn = await page.$('a.live-external-btn--fb');
        if (!fbBtn) throw new Error('Bouton Facebook principal non trouvé');
        const text = await fbBtn.textContent();
        if (!text.includes('Facebook')) throw new Error(`Texte incorrect: ${text}`);
      }
    }
  ]);

  // Test 3: Culte en cours avec YouTube uniquement
  await testScenario(browser, 'YouTube uniquement', MOCK_SERVICES.ytOnly, [
    {
      name: 'Lecteur YouTube visible',
      fn: async (page) => {
        const iframe = await page.$('.live-player iframe');
        if (!iframe) throw new Error('iframe YouTube non trouvé');
      }
    },
    {
      name: 'Pas de bouton Facebook',
      fn: async (page) => {
        const fbBtn = await page.$('a.live-fb-btn, a.live-external-btn--fb');
        if (fbBtn) throw new Error('Bouton Facebook ne devrait pas être présent');
      }
    }
  ]);

  // Test 4: Culte futur (plus de 15 min)
  await testScenario(browser, 'Culte futur', MOCK_SERVICES.future, [
    {
      name: 'Pas de section live',
      fn: async (page) => {
        const liveSection = await page.$('.live-section');
        if (liveSection) throw new Error('Section live ne devrait pas être visible pour un culte futur');
      }
    },
    {
      name: 'Pas de bouton Facebook live',
      fn: async (page) => {
        const fbBtn = await page.$('a.live-fb-btn, a.live-external-btn--fb');
        if (fbBtn) throw new Error('Bouton Facebook ne devrait pas être présent');
      }
    }
  ]);

  await browser.close();

  console.log('\n===========================================');
  console.log(`RESULTATS: ${passed} OK, ${failed} ECHEC`);
  console.log('===========================================');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
