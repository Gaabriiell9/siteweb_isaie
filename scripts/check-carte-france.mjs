#!/usr/bin/env node
/**
 * Test: Carte de France sur l'accueil
 * Vérifie le placement et l'absence de chevauchement avec le texte du hero
 *
 * Usage: node scripts/check-carte-france.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CAPTURE_DIR = '/tmp/carte-france-captures';

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

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

function rectsOverlap(r1, r2) {
  if (!r1 || !r2) return false;
  return !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
}

async function checkViewport(browser, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Capture d'écran
    const capturePath = path.join(CAPTURE_DIR, `${viewport.name}.png`);
    await page.screenshot({ path: capturePath, fullPage: false });
    console.log(`   Capture: ${capturePath}`);

    // Vérifier qu'il n'y a pas de défilement horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      fail(`${viewport.name}: Défilement horizontal`, 'scrollWidth > clientWidth');
    } else {
      ok(`${viewport.name}: Pas de défilement horizontal`);
    }

    // Récupérer les rectangles des éléments
    const rects = await page.evaluate(() => {
      const carte = document.querySelector('.carte-france--hero');
      const carteVisible = carte && window.getComputedStyle(carte).display !== 'none';
      const content = document.querySelector('.hero-pasteur-content');
      const btns = document.querySelector('.hero-pasteur-btns');
      const nom = document.querySelector('.hero-pasteur-nom');
      const bandeau = document.querySelector('.carte-france-bandeau');
      const bandeauVisible = bandeau && window.getComputedStyle(bandeau).display !== 'none';

      return {
        carte: carteVisible ? carte.getBoundingClientRect() : null,
        carteVisible,
        content: content ? content.getBoundingClientRect() : null,
        btns: btns ? btns.getBoundingClientRect() : null,
        nom: nom ? nom.getBoundingClientRect() : null,
        bandeau: bandeauVisible ? bandeau.getBoundingClientRect() : null,
        bandeauVisible,
      };
    });

    // Sur mobile (< 900px), la carte hero doit être masquée et le bandeau visible
    if (viewport.width < 900) {
      if (rects.carteVisible) {
        fail(`${viewport.name}: Carte hero visible`, 'devrait être masquée sur mobile');
      } else {
        ok(`${viewport.name}: Carte hero masquée`);
      }

      if (rects.bandeauVisible) {
        ok(`${viewport.name}: Bandeau mobile visible`);
      } else {
        fail(`${viewport.name}: Bandeau mobile masqué`, 'devrait être visible sur mobile');
      }
    } else {
      // Sur grand écran, vérifier l'absence de chevauchement
      if (!rects.carteVisible) {
        ok(`${viewport.name}: Carte masquée (espace insuffisant)`);
      } else {
        // Vérifier chevauchement avec le contenu texte
        if (rects.content && rectsOverlap(rects.carte, rects.content)) {
          fail(`${viewport.name}: Chevauchement carte/content`,
            `carte: ${JSON.stringify(rects.carte)}, content: ${JSON.stringify(rects.content)}`);
        } else {
          ok(`${viewport.name}: Pas de chevauchement carte/content`);
        }

        // Vérifier chevauchement avec les boutons
        if (rects.btns && rectsOverlap(rects.carte, rects.btns)) {
          fail(`${viewport.name}: Chevauchement carte/boutons`,
            `carte: ${JSON.stringify(rects.carte)}, btns: ${JSON.stringify(rects.btns)}`);
        } else {
          ok(`${viewport.name}: Pas de chevauchement carte/boutons`);
        }

        // Vérifier chevauchement avec le nom
        if (rects.nom && rectsOverlap(rects.carte, rects.nom)) {
          fail(`${viewport.name}: Chevauchement carte/nom`,
            `carte: ${JSON.stringify(rects.carte)}, nom: ${JSON.stringify(rects.nom)}`);
        } else {
          ok(`${viewport.name}: Pas de chevauchement carte/nom`);
        }
      }

      // Le bandeau mobile est visible quand la carte hero est masquée (acceptable)
      if (rects.bandeauVisible && rects.carteVisible) {
        fail(`${viewport.name}: Bandeau et carte visibles`, 'un seul devrait être visible');
      } else if (rects.bandeauVisible) {
        ok(`${viewport.name}: Bandeau mobile visible (carte masquée)`);
      } else {
        ok(`${viewport.name}: Bandeau mobile masqué (carte visible)`);
      }
    }

  } catch (err) {
    fail(`${viewport.name}: Erreur`, err.message);
  }

  await context.close();
}

async function main() {
  console.log('=== TEST CARTE FRANCE ===\n');

  // Créer le dossier de captures
  if (!fs.existsSync(CAPTURE_DIR)) {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    console.log(`\n--- ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
    await checkViewport(browser, viewport);
  }

  await browser.close();

  console.log('\n===========================================');
  console.log(`RESULTATS: ${passed} OK, ${failed} ECHEC`);
  console.log(`Captures dans: ${CAPTURE_DIR}`);
  console.log('===========================================');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
