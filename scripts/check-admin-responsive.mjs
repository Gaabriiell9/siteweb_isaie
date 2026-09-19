/**
 * Script de verification responsive pour l'administration
 * Usage: npm run test:admin-responsive
 *
 * Prerequis: E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD dans .env.local
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Largeurs de test avec hauteurs realistes
const VIEWPORTS = [
  { width: 320, height: 568, name: '320', mobile: true },   // iPhone SE
  { width: 360, height: 640, name: '360', mobile: true },   // Android small
  { width: 390, height: 844, name: '390', mobile: true },   // iPhone 14
  { width: 430, height: 932, name: '430', mobile: true },   // iPhone 14 Pro Max
  { width: 600, height: 960, name: '600', mobile: true },   // Small tablet
  { width: 768, height: 1024, name: '768', mobile: true },  // iPad
  { width: 820, height: 1180, name: '820', mobile: true },  // iPad Air
  { width: 1024, height: 768, name: '1024', mobile: false }, // Desktop small
  { width: 1366, height: 768, name: '1366', mobile: false }, // Desktop
];

// Rubriques a tester (depuis nav.js)
const ADMIN_ROUTES = [
  { path: 'eglise/direct', name: 'En direct' },
  { path: 'eglise/priere', name: 'Montagne de priere' },
  { path: 'eglise/cellules', name: 'Cellule Bethel' },
  { path: 'eglise/videos', name: 'Videos' },
  { path: 'eglise/annonces', name: 'Annonces' },
  { path: 'formation/formation', name: 'Formation' },
  { path: 'parametres/reglages', name: 'Reglages' },
];

// Sous-onglets de Formation a tester
const FORMATION_SUBTABS = [
  'inscriptions',
  'eleves',
  'stats',
  'carte',
  'ressources',
  'cours',
  'messages',
  'formules',
  'paiements',
];

// Verifier les identifiants
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

if (!email || !password) {
  console.log('NON TESTE : identifiants absents');
  console.log('Ajoutez E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD dans .env.local');
  process.exit(0);
}

// S'assurer que le dossier screenshots existe
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function login(page) {
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Remplir le formulaire de connexion
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if (await emailInput.count() > 0) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  }
}

async function checkPage(page, viewport, routeName) {
  const violations = {
    horizontalOverflow: [],
    smallTouchTargets: [],
    smallInputFonts: [],
    truncatedText: [],
    fixedElementsTooLarge: [],
    contentHeightIssue: false,
  };

  // 1. Defilement horizontal
  const scrollCheck = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const hasOverflow = docWidth > winWidth;

    const overflowingElements = [];
    if (hasOverflow) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.right > winWidth + 5) {
          const selector = el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : '') +
            (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : '');
          overflowingElements.push({ selector, width: Math.round(rect.width), right: Math.round(rect.right) });
        }
      }
    }

    return { hasOverflow, docWidth, winWidth, overflowingElements: overflowingElements.slice(0, 5) };
  });

  if (scrollCheck.hasOverflow) {
    violations.horizontalOverflow = scrollCheck.overflowingElements;
  }

  // 2. Cibles tactiles trop petites (sous 1024px)
  if (viewport.mobile) {
    const touchTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex="0"]');
      const small = [];

      for (const el of interactive) {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.top < 0 || rect.bottom > window.innerHeight + 500) continue;

        if (rect.width < 44 || rect.height < 44) {
          const selector = el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : '') +
            (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : '');
          small.push({
            selector,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: el.textContent?.slice(0, 20) || ''
          });
        }
      }

      return small.slice(0, 10);
    });

    violations.smallTouchTargets = touchTargets;
  }

  // 3. Champs de saisie avec police < 16px (sous 640px)
  if (viewport.width < 640) {
    const smallFonts = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      const small = [];

      for (const el of inputs) {
        const style = getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 16) {
          const selector = el.tagName.toLowerCase() +
            (el.name ? `[name="${el.name}"]` : '') +
            (el.id ? `#${el.id}` : '');
          small.push({ selector, fontSize: Math.round(fontSize) });
        }
      }

      return small.slice(0, 10);
    });

    violations.smallInputFonts = smallFonts;
  }

  // 4. Texte tronque
  const truncated = await page.evaluate(() => {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, td, th, label');
    const issues = [];

    for (const el of textElements) {
      const style = getComputedStyle(el);
      if (style.overflow === 'hidden' || style.textOverflow === 'ellipsis') continue;
      if (el.scrollWidth > el.clientWidth + 2) {
        const selector = el.tagName.toLowerCase() +
          (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 1).join('.') : '');
        issues.push({
          selector,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          text: el.textContent?.slice(0, 30) || ''
        });
      }
    }

    return issues.slice(0, 5);
  });

  violations.truncatedText = truncated;

  // 5. Elements fixes trop grands
  const fixedElements = await page.evaluate(() => {
    const fixed = document.querySelectorAll('*');
    const issues = [];
    const winHeight = window.innerHeight;

    for (const el of fixed) {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        const rect = el.getBoundingClientRect();
        if (rect.height > winHeight * 0.25) {
          const selector = el.tagName.toLowerCase() +
            (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : '');
          issues.push({ selector, height: Math.round(rect.height), percentOfScreen: Math.round(rect.height / winHeight * 100) });
        }
      }
    }

    return issues;
  });

  violations.fixedElementsTooLarge = fixedElements;

  // 6. Hauteur du contenu utile (sur 390x844)
  if (viewport.width === 390 && viewport.height === 844) {
    const contentHeight = await page.evaluate(() => {
      const header = document.querySelector('.admin-header, header');
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const contentArea = window.innerHeight - headerHeight;
      const mainContent = document.querySelector('.admin-content, main, [role="main"]');
      const mainHeight = mainContent ? mainContent.getBoundingClientRect().height : 0;

      return {
        headerHeight,
        contentArea,
        mainHeight,
        percentUsed: Math.round(contentArea / window.innerHeight * 100)
      };
    });

    if (contentHeight.percentUsed < 70) {
      violations.contentHeightIssue = contentHeight;
    }
  }

  return violations;
}

async function main() {
  console.log('=== Test Admin Responsive ===\n');

  const browser = await chromium.launch();
  const results = {};
  let totalOverflow = 0;
  let totalSmallTargets = 0;
  let totalSmallFonts = 0;

  try {
    // Contexte de connexion initial
    const loginContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const loginPage = await loginContext.newPage();

    console.log('Connexion a l\'admin...');
    await login(loginPage);

    // Sauvegarder les cookies/storage pour les reutiliser
    const storageState = await loginContext.storageState();
    await loginContext.close();

    // Tester chaque route a chaque viewport
    for (const route of ADMIN_ROUTES) {
      results[route.name] = {};

      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.mobile,
          isMobile: viewport.mobile,
          storageState,
        });
        const page = await context.newPage();

        try {
          await page.goto(`${BASE_URL}/admin#${route.path}`, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(1500);

          const violations = await checkPage(page, viewport, route.name);
          results[route.name][viewport.name] = violations;

          // Compter les violations
          totalOverflow += violations.horizontalOverflow.length > 0 ? 1 : 0;
          totalSmallTargets += violations.smallTouchTargets.length;
          totalSmallFonts += violations.smallInputFonts.length;

          // Capture d'ecran
          const screenshotName = `admin-${route.path.replace('/', '-')}-${viewport.name}.png`;
          await page.screenshot({
            path: path.join(screenshotsDir, screenshotName),
            fullPage: true
          });

        } catch (e) {
          console.log(`  Erreur ${route.name} @ ${viewport.name}: ${e.message}`);
          results[route.name][viewport.name] = { error: e.message };
        }

        await context.close();
      }

      console.log(`${route.name}: teste`);
    }

    // Tester les sous-onglets de Formation
    console.log('\nTest des sous-onglets Formation...');
    for (const subtab of FORMATION_SUBTABS) {
      results[`Formation/${subtab}`] = {};

      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.mobile,
          isMobile: viewport.mobile,
          storageState,
        });
        const page = await context.newPage();

        try {
          await page.goto(`${BASE_URL}/admin#formation/formation`, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(1000);

          // Cliquer sur le sous-onglet
          const subtabBtn = page.locator(`button:has-text("${subtab}"), [data-subtab="${subtab}"]`).first();
          if (await subtabBtn.count() > 0) {
            await subtabBtn.click();
            await page.waitForTimeout(1000);
          }

          const violations = await checkPage(page, viewport, `Formation/${subtab}`);
          results[`Formation/${subtab}`][viewport.name] = violations;

          totalOverflow += violations.horizontalOverflow.length > 0 ? 1 : 0;
          totalSmallTargets += violations.smallTouchTargets.length;
          totalSmallFonts += violations.smallInputFonts.length;

          const screenshotName = `admin-formation-${subtab}-${viewport.name}.png`;
          await page.screenshot({
            path: path.join(screenshotsDir, screenshotName),
            fullPage: true
          });

        } catch (e) {
          results[`Formation/${subtab}`][viewport.name] = { error: e.message };
        }

        await context.close();
      }

      console.log(`Formation/${subtab}: teste`);
    }

  } finally {
    await browser.close();
  }

  // Afficher le tableau des resultats
  console.log('\n=== RESULTATS ===\n');

  const routes = Object.keys(results);
  const widths = VIEWPORTS.map(v => v.name);

  // En-tete
  console.log('Rubrique'.padEnd(25) + widths.map(w => w.padStart(8)).join(''));
  console.log('-'.repeat(25 + widths.length * 8));

  for (const route of routes) {
    let line = route.padEnd(25);
    for (const width of widths) {
      const v = results[route][width];
      if (!v || v.error) {
        line += 'ERR'.padStart(8);
      } else {
        const issues = v.horizontalOverflow.length + v.smallTouchTargets.length + v.smallInputFonts.length;
        line += (issues > 0 ? `${issues}` : 'OK').padStart(8);
      }
    }
    console.log(line);
  }

  // Details des violations
  console.log('\n=== DETAILS DES VIOLATIONS ===\n');

  for (const route of routes) {
    for (const width of widths) {
      const v = results[route][width];
      if (!v || v.error) continue;

      const hasIssues = v.horizontalOverflow.length > 0 ||
                        v.smallTouchTargets.length > 0 ||
                        v.smallInputFonts.length > 0 ||
                        v.truncatedText.length > 0 ||
                        v.fixedElementsTooLarge.length > 0 ||
                        v.contentHeightIssue;

      if (hasIssues) {
        console.log(`\n${route} @ ${width}px:`);

        if (v.horizontalOverflow.length > 0) {
          console.log('  Depassement horizontal:');
          for (const el of v.horizontalOverflow) {
            console.log(`    - ${el.selector} (largeur: ${el.width}px, droite: ${el.right}px)`);
          }
        }

        if (v.smallTouchTargets.length > 0) {
          console.log('  Cibles tactiles < 44px:');
          for (const el of v.smallTouchTargets) {
            console.log(`    - ${el.selector} (${el.width}x${el.height}px) "${el.text}"`);
          }
        }

        if (v.smallInputFonts.length > 0) {
          console.log('  Champs < 16px:');
          for (const el of v.smallInputFonts) {
            console.log(`    - ${el.selector} (${el.fontSize}px)`);
          }
        }

        if (v.truncatedText.length > 0) {
          console.log('  Texte tronque:');
          for (const el of v.truncatedText) {
            console.log(`    - ${el.selector}: "${el.text}"`);
          }
        }

        if (v.fixedElementsTooLarge.length > 0) {
          console.log('  Elements fixes > 25%:');
          for (const el of v.fixedElementsTooLarge) {
            console.log(`    - ${el.selector} (${el.percentOfScreen}% de l'ecran)`);
          }
        }

        if (v.contentHeightIssue) {
          console.log(`  Contenu utile insuffisant: ${v.contentHeightIssue.percentUsed}% (< 70%)`);
        }
      }
    }
  }

  // Resume
  console.log('\n=== RESUME ===');
  console.log(`Depassements horizontaux: ${totalOverflow}`);
  console.log(`Cibles tactiles < 44px: ${totalSmallTargets}`);
  console.log(`Champs < 16px: ${totalSmallFonts}`);

  const hasFailures = totalOverflow > 0 || totalSmallTargets > 0;

  if (hasFailures) {
    console.log('\n\x1b[31m✗ Test echoue\x1b[0m');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✓ Test reussi\x1b[0m');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
