/**
 * Audit de contraste WCAG sur toutes les pages
 * Usage: npm run test:contraste-pages
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

const VIEWPORTS = [
  { width: 390, height: 844, name: '390' },
  { width: 1366, height: 768, name: '1366' },
];

const PUBLIC_ROUTES = [
  '/',
  '/cultes',
  '/montagne-priere',
  '/predication',
  '/cellule',
  '/formation',
  '/formation/inscription',
  '/dons',
  '/pasteur',
  '/eleve/login',
  '/admin',
  '/page-inexistante-404',
];

// Conversion hex vers RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

// Parse rgba/rgb string
function parseColor(colorStr) {
  if (!colorStr || colorStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const rgbaMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    };
  }

  if (colorStr.startsWith('#')) {
    const rgb = hexToRgb(colorStr);
    return { ...rgb, a: 1 };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

// Composite deux couleurs (fg sur bg)
function compositeColors(fg, bg) {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 255, g: 255, b: 255, a: 0 };
  return {
    r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
    g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
    b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
    a
  };
}

// Luminance relative WCAG
function getLuminance(color) {
  const [r, g, b] = [color.r, color.g, color.b].map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Ratio de contraste
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Gravite selon WCAG
function getSeverity(ratio, fontSize, fontWeight) {
  const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
  const minRatio = isLargeText ? 3 : 4.5;

  if (ratio < 1.5) return 'CRITIQUE';
  if (ratio < minRatio) return 'ECHEC';
  return 'OK';
}

async function auditPage(page, route, viewport, results) {
  const routeName = route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, '');

  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
  } catch (e) {
    console.log(`  ! Erreur de chargement: ${e.message}`);
    return;
  }

  // Collecter tous les elements avec du texte visible
  const elements = await page.evaluate(() => {
    const items = [];
    const seen = new Set();

    function isVisible(el) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity) === 0) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      if (rect.bottom < 0 || rect.top > window.innerHeight * 3) return false;
      return true;
    }

    function getEffectiveBackground(el) {
      let bg = { r: 250, g: 247, b: 241, a: 1 }; // Defaut creme
      const ancestors = [];
      let current = el;

      while (current && current !== document.body) {
        ancestors.unshift(current);
        current = current.parentElement;
      }
      ancestors.unshift(document.body);

      for (const ancestor of ancestors) {
        const style = getComputedStyle(ancestor);

        // Detecter les fonds sombres par classe ou style
        const classList = ancestor.className || '';
        const hasImage = style.backgroundImage && style.backgroundImage !== 'none';

        // Si gradient ou image avec classe de section sombre, utiliser vert-nuit
        if (hasImage && (
          classList.includes('hero') ||
          classList.includes('navbar') ||
          classList.includes('semaine') ||
          classList.includes('predication-section') ||
          classList.includes('rejoindre') ||
          classList.includes('vert-nuit') ||
          classList.includes('mp-today')
        )) {
          return { r: 18, g: 45, b: 41, a: 1 }; // vert-nuit #122D29
        }

        if (hasImage && classList.includes('vert')) {
          return { r: 30, g: 77, b: 70, a: 1 }; // vert #1E4D46
        }

        const bgColor = style.backgroundColor;
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
          const match = bgColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
          if (match) {
            const newBg = {
              r: parseInt(match[1]),
              g: parseInt(match[2]),
              b: parseInt(match[3]),
              a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
            // Composite
            const a = newBg.a + bg.a * (1 - newBg.a);
            if (a > 0) {
              bg = {
                r: Math.round((newBg.r * newBg.a + bg.r * bg.a * (1 - newBg.a)) / a),
                g: Math.round((newBg.g * newBg.a + bg.g * bg.a * (1 - newBg.a)) / a),
                b: Math.round((newBg.b * newBg.a + bg.b * bg.a * (1 - newBg.a)) / a),
                a
              };
            }
          }
        }
      }
      return bg;
    }

    function getCumulativeOpacity(el) {
      let opacity = 1;
      let current = el;
      while (current && current !== document.body) {
        const style = getComputedStyle(current);
        opacity *= parseFloat(style.opacity) || 1;
        current = current.parentElement;
      }
      return opacity;
    }

    function processElement(el) {
      if (!isVisible(el)) return;

      const text = el.innerText?.trim();
      if (!text || text.length === 0) return;

      // Eviter les doublons
      const key = `${el.tagName}-${text.slice(0, 50)}`;
      if (seen.has(key)) return;
      seen.add(key);

      const style = getComputedStyle(el);
      const textColor = style.color;
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight) || 400;
      const rect = el.getBoundingClientRect();

      const bgColor = getEffectiveBackground(el);
      const opacity = getCumulativeOpacity(el);

      // Construire selecteur CSS
      let selector = el.tagName.toLowerCase();
      if (el.id) selector += `#${el.id}`;
      if (el.className && typeof el.className === 'string') {
        selector += '.' + el.className.split(' ').filter(c => c).slice(0, 2).join('.');
      }

      items.push({
        selector,
        text: text.slice(0, 40),
        textColor,
        bgColor: `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`,
        bgColorObj: bgColor,
        fontSize,
        fontWeight,
        opacity,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      });
    }

    // Parcourir tous les elements textuels
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, div, em, strong, small');
    textElements.forEach(processElement);

    return items;
  });

  const issues = [];

  for (const el of elements) {
    const textColor = parseColor(el.textColor);
    textColor.a *= el.opacity;

    const bgColor = el.bgColorObj;

    // Composite text sur bg
    const effectiveText = compositeColors(textColor, bgColor);
    const ratio = getContrastRatio(effectiveText, bgColor);
    const severity = getSeverity(ratio, el.fontSize, el.fontWeight);

    if (severity !== 'OK') {
      issues.push({
        route,
        width: viewport.name,
        state: 'normal',
        selector: el.selector,
        text: el.text,
        textColor: el.textColor,
        bgColor: el.bgColor,
        ratio: ratio.toFixed(2),
        severity,
        rect: el.rect
      });
    }

    results.push({
      route,
      width: viewport.name,
      state: 'normal',
      selector: el.selector,
      text: el.text,
      textColor: el.textColor,
      bgColor: el.bgColor,
      ratio: ratio.toFixed(2),
      severity
    });
  }

  // Capture avec cadres rouges sur les elements fautifs
  if (issues.length > 0) {
    for (const issue of issues) {
      if (issue.rect) {
        await page.evaluate((rect) => {
          const div = document.createElement('div');
          div.className = 'audit-issue-marker';
          div.style.cssText = `position:fixed;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;border:2px solid red;pointer-events:none;z-index:99999;`;
          document.body.appendChild(div);
        }, issue.rect);
      }
    }

    await page.screenshot({ path: `screenshots/contraste-${routeName}-${viewport.name}.png`, fullPage: false });

    await page.evaluate(() => {
      document.querySelectorAll('.audit-issue-marker').forEach(el => el.remove());
    });
  }

  return issues;
}

async function main() {
  console.log('=== Audit de Contraste WCAG ===\n');

  const browser = await chromium.launch();
  const allResults = [];
  const allIssues = [];

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n=== Viewport ${viewport.name}px ===`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      for (const route of PUBLIC_ROUTES) {
        console.log(`\nRoute: ${route}`);
        const issues = await auditPage(page, route, viewport, allResults);
        if (issues && issues.length > 0) {
          allIssues.push(...issues);
          console.log(`  ${issues.length} probleme(s) detecte(s)`);
        } else {
          console.log(`  OK`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  // Afficher le tableau des problemes
  console.log('\n\n=== Problemes de Contraste ===\n');

  if (allIssues.length === 0) {
    console.log('Aucun probleme de contraste detecte.');
  } else {
    console.log('Route\t\t\tLargeur\tEtat\tSelecteur\t\t\tTexte\t\t\t\tRatio\tGravite');
    console.log('-'.repeat(140));

    for (const issue of allIssues) {
      const routeCol = issue.route.padEnd(20);
      const widthCol = issue.width.padEnd(6);
      const stateCol = issue.state.padEnd(8);
      const selectorCol = issue.selector.slice(0, 25).padEnd(25);
      const textCol = issue.text.slice(0, 30).padEnd(30);
      const ratioCol = issue.ratio.padEnd(6);

      const color = issue.severity === 'CRITIQUE' ? '\x1b[31m' : '\x1b[33m';
      console.log(`${color}${routeCol}\t${widthCol}\t${stateCol}\t${selectorCol}\t${textCol}\t${ratioCol}\t${issue.severity}\x1b[0m`);
    }
  }

  const critiques = allIssues.filter(i => i.severity === 'CRITIQUE').length;
  const echecs = allIssues.filter(i => i.severity === 'ECHEC').length;

  console.log('\n=== Resume ===');
  console.log(`CRITIQUE: ${critiques}`);
  console.log(`ECHEC: ${echecs}`);

  if (critiques > 0 || echecs > 0) {
    console.log('\n\x1b[31m✗ Audit echoue\x1b[0m');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✓ Tous les contrastes sont conformes\x1b[0m');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
