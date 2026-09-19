/**
 * Test de scroll automatique sur la page d'accueil
 * Verifie que la page ne defile pas toute seule au chargement
 * Usage: npm run test:scroll
 */

import { chromium } from 'playwright';

const VIEWPORTS = [
  { width: 390, height: 844, name: '390px' },
  { width: 1366, height: 768, name: '1366px' },
];

const BASE_URL = 'http://localhost:3000';
const MAX_SCROLL_Y = 2;
const WAIT_TIME = 4000;

async function testScroll() {
  console.log('=== Test de Scroll sur la Page d\'Accueil ===\n');

  const browser = await chromium.launch();
  let allPass = true;

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n--- ${viewport.name} ---`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      // Test 1: Chargement initial de /
      console.log('Test 1: Chargement initial...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(WAIT_TIME);

      let scrollY = await page.evaluate(() => window.scrollY);
      if (scrollY > MAX_SCROLL_Y) {
        console.log(`  ✗ ECHEC: scrollY = ${scrollY}px (max: ${MAX_SCROLL_Y}px)`);
        allPass = false;
      } else {
        console.log(`  ✓ OK: scrollY = ${scrollY}px`);
      }

      // Test 2: Reload de la page
      console.log('Test 2: Rechargement...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(WAIT_TIME);

      scrollY = await page.evaluate(() => window.scrollY);
      if (scrollY > MAX_SCROLL_Y) {
        console.log(`  ✗ ECHEC: scrollY = ${scrollY}px (max: ${MAX_SCROLL_Y}px)`);
        allPass = false;
      } else {
        console.log(`  ✓ OK: scrollY = ${scrollY}px`);
      }

      // Test 3: Navigation vers /#actualites (scroll legitime)
      console.log('Test 3: Navigation vers /#actualites...');
      await page.goto(`${BASE_URL}/#actualites`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(WAIT_TIME);

      const hasActualites = await page.evaluate(() => {
        const el = document.getElementById('actualites');
        return el !== null;
      });

      if (hasActualites) {
        scrollY = await page.evaluate(() => window.scrollY);
        // Pour /#actualites, le scroll est legitime, on verifie juste qu'il n'y a pas d'erreur
        console.log(`  ✓ OK: Section actualites atteinte (scrollY = ${scrollY}px)`);
      } else {
        console.log(`  ! Section #actualites non trouvee`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Resume ===');
  if (allPass) {
    console.log('✓ Tous les tests de scroll sont passes');
    process.exit(0);
  } else {
    console.log('✗ Certains tests ont echoue');
    process.exit(1);
  }
}

testScroll().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
