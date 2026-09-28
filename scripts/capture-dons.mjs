#!/usr/bin/env node
/**
 * Capture de la page Dons pour verification visuelle
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CAPTURE_DIR = '/tmp/dons-captures';

async function main() {
  console.log('=== CAPTURE PAGE DONS ===\n');

  const browser = await chromium.launch({ headless: true });

  // Desktop 1440x900
  console.log('Desktop 1440x900...');
  const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await ctxDesktop.newPage();
  await pageDesktop.goto(`${BASE_URL}/dons`, { waitUntil: 'networkidle', timeout: 15000 });
  await pageDesktop.waitForTimeout(500);
  await pageDesktop.screenshot({ path: `${CAPTURE_DIR}/dons-desktop-1440x900.png`, fullPage: true });
  console.log(`  Capture: ${CAPTURE_DIR}/dons-desktop-1440x900.png`);

  // Verifier elements
  const inputDesktop = await pageDesktop.$('.dons-input');
  const btnDesktop = await pageDesktop.$('.dons-submit');
  const introDesktop = await pageDesktop.$('.dons-intro');

  console.log('  - Champ montant:', inputDesktop ? 'OK' : 'MANQUANT');
  console.log('  - Bouton:', btnDesktop ? 'OK' : 'MANQUANT');
  console.log('  - Intro:', introDesktop ? 'OK' : 'MANQUANT');

  // Verifier texte intro avec accents
  const introText = await introDesktop?.textContent();
  const hasAccents = introText?.includes('ministère') && introText?.includes('Église') && introText?.includes('Célébration');
  console.log('  - Accents dans intro:', hasAccents ? 'OK' : 'MANQUANTS');

  // Verifier absence de presets
  const presets = await pageDesktop.$$('.dons-preset');
  console.log('  - Boutons montants suggeres:', presets.length === 0 ? 'RETIRES (OK)' : `PRESENTS (${presets.length})`);

  // Verifier absence champs nom/email/message
  const inputs = await pageDesktop.$$('.dons-input');
  console.log('  - Nombre de champs input:', inputs.length === 1 ? '1 (OK)' : inputs.length);

  // Verifier symbole euro
  const currency = await pageDesktop.$('.dons-currency');
  const currencyText = await currency?.textContent();
  console.log('  - Symbole devise:', currencyText === '€' ? '€ (OK)' : currencyText);

  // Verifier hauteur du champ
  const inputBox = await inputDesktop?.boundingBox();
  console.log('  - Hauteur champ:', inputBox ? `${inputBox.height}px` : 'N/A');

  await ctxDesktop.close();

  // Mobile 390x844
  console.log('\nMobile 390x844...');
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageMobile = await ctxMobile.newPage();
  await pageMobile.goto(`${BASE_URL}/dons`, { waitUntil: 'networkidle', timeout: 15000 });
  await pageMobile.waitForTimeout(500);
  await pageMobile.screenshot({ path: `${CAPTURE_DIR}/dons-mobile-390x844.png`, fullPage: true });
  console.log(`  Capture: ${CAPTURE_DIR}/dons-mobile-390x844.png`);

  // Verifier pas de scroll horizontal
  const hasHScroll = await pageMobile.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('  - Defilement horizontal:', hasHScroll ? 'PRESENT (probleme)' : 'AUCUN (OK)');

  // Verifier bouton disabled
  const btnMobile = await pageMobile.$('.dons-submit');
  const btnDisabled = await btnMobile?.getAttribute('disabled');
  console.log('  - Bouton disabled au depart:', btnDisabled !== null ? 'OUI (OK)' : 'NON');

  // Verifier texte bouton
  const btnText = await btnMobile?.textContent();
  console.log('  - Texte bouton:', btnText?.includes('Faire un don') ? 'OK' : btnText);

  await ctxMobile.close();
  await browser.close();

  console.log('\n=== CAPTURES TERMINEES ===');
  console.log(`Fichiers dans: ${CAPTURE_DIR}`);
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
