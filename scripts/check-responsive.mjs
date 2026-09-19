/**
 * Test responsive de la page d'accueil
 * Verifie : pas de defilement horizontal, tailles de police, hauteurs de section
 * Usage: npm run test:responsive (serveur dev doit tourner sur localhost:3000)
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCREENSHOTS_DIR = join(ROOT, 'screenshots');

const VIEWPORTS = [
  { width: 320, height: 640, name: '320' },
  { width: 360, height: 640, name: '360' },
  { width: 390, height: 844, name: '390' },
  { width: 768, height: 1024, name: '768' },
  { width: 1024, height: 768, name: '1024' },
  { width: 1366, height: 768, name: '1366' },
  { width: 1920, height: 1080, name: '1920' },
];

const URL = 'http://localhost:3000';

async function checkViewport(page, viewport) {
  const { width, height, name } = viewport;
  console.log(`\n=== ${name}px (${width}x${height}) ===`);

  await page.setViewportSize({ width, height });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const results = { width: name, issues: [] };

  // 1. Verifier le defilement horizontal
  const scrollCheck = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const viewWidth = window.innerWidth;
    const hasOverflow = docWidth > viewWidth;

    const overflowingElements = [];
    if (hasOverflow) {
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > viewWidth + 5) {
          overflowingElements.push({
            tag: el.tagName,
            class: el.className?.slice?.(0, 50) || '',
            right: Math.round(rect.right),
          });
        }
      });
    }

    return {
      docWidth,
      viewWidth,
      hasOverflow,
      overflowingElements: overflowingElements.slice(0, 10),
    };
  });

  if (scrollCheck.hasOverflow) {
    console.log(`  ✗ DEPASSEMENT HORIZONTAL: ${scrollCheck.docWidth}px > ${scrollCheck.viewWidth}px`);
    scrollCheck.overflowingElements.forEach(el => {
      console.log(`    - ${el.tag}.${el.class} (right: ${el.right}px)`);
    });
    results.issues.push('horizontal-overflow');
  } else {
    console.log(`  ✓ Pas de depassement horizontal`);
  }

  // 2. A 390px : elements avec font-size > 30px
  if (width === 390) {
    const largeFonts = await page.evaluate(() => {
      const elements = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize > 30 && el.textContent?.trim()) {
          elements.push({
            tag: el.tagName,
            class: el.className?.slice?.(0, 40) || '',
            fontSize: Math.round(fontSize),
            text: el.textContent?.slice(0, 30),
          });
        }
      });
      return elements.slice(0, 15);
    });

    if (largeFonts.length > 0) {
      console.log(`  Police > 30px:`);
      largeFonts.forEach(el => {
        console.log(`    - ${el.tag}.${el.class}: ${el.fontSize}px "${el.text}..."`);
      });
    }

    // Elements dont la hauteur depasse 70% de la fenetre
    const tallElements = await page.evaluate((viewportHeight) => {
      const threshold = viewportHeight * 0.7;
      const elements = [];
      document.querySelectorAll('section, .hero, .annonces-section, .semaine-section, .activites-section, .predication-section, .message-section, .pasteurs-section, .rejoindre-section').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.height > threshold) {
          elements.push({
            tag: el.tagName,
            class: el.className?.slice?.(0, 40) || '',
            height: Math.round(rect.height),
            percent: Math.round((rect.height / viewportHeight) * 100),
          });
        }
      });
      return elements;
    }, height);

    if (tallElements.length > 0) {
      console.log(`  Hauteur > 70% viewport (${Math.round(height * 0.7)}px):`);
      tallElements.forEach(el => {
        console.log(`    - ${el.class}: ${el.height}px (${el.percent}%)`);
      });
    }
  }

  // 3. Mesurer la hauteur de chaque section
  const sectionHeights = await page.evaluate(() => {
    const sections = [];
    document.querySelectorAll('section, .hero').forEach(el => {
      const rect = el.getBoundingClientRect();
      const className = el.className?.split(' ')[0] || el.tagName;
      sections.push({
        name: className,
        height: Math.round(rect.height),
      });
    });
    return sections;
  });

  console.log(`  Hauteurs des sections:`);
  sectionHeights.forEach(s => {
    console.log(`    - ${s.name}: ${s.height}px`);
  });

  // 4. Capture d'ecran
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  const screenshotPath = join(SCREENSHOTS_DIR, `home-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  Screenshot: screenshots/home-${name}.png`);

  return results;
}

async function main() {
  console.log('=== Test Responsive de la Page d\'Accueil ===');
  console.log(`URL: ${URL}\n`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.error('Erreur: Impossible de lancer Chromium. Le serveur de dev tourne-t-il?');
    console.error(e.message);
    process.exit(1);
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  let hasOverflow = false;
  const allResults = [];

  for (const viewport of VIEWPORTS) {
    try {
      const result = await checkViewport(page, viewport);
      allResults.push(result);
      if (result.issues.includes('horizontal-overflow')) {
        hasOverflow = true;
      }
    } catch (e) {
      console.error(`  Erreur a ${viewport.width}px:`, e.message);
    }
  }

  await browser.close();

  console.log('\n=== Resume ===');
  if (hasOverflow) {
    console.log('✗ ECHEC: Depassement horizontal detecte');
    process.exit(1);
  } else {
    console.log('✓ Aucun depassement horizontal');
    process.exit(0);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
