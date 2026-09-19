/**
 * Verification du contraste WCAG AA
 * Usage: npm run test:contrast
 */

// Conversion hex vers RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calcul de la luminance relative (WCAG)
function getLuminance(rgb) {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calcul du ratio de contraste
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(hexToRgb(color1));
  const l2 = getLuminance(hexToRgb(color2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Palette du site (variables de index.css)
const COLORS = {
  vert: '#1E4D46',
  vertNuit: '#122D29',
  vertDoux: '#F5FAF9',
  or: '#C89B4A',
  orTexte: '#D4AD5C',
  orLabel: '#A07C38',
  creme: '#FAF7F1',
  encre: '#1A1F1E',
  encreDouce: '#4A5250',
  bord: '#D8E0DC',
  blanc: '#FFFFFF',
  statutDirect: '#B42318',
  statutOk: '#1D8348',
  statutAlerte: '#B35F00',
  statutErreur: '#C0392B',
  statutInfo: '#1F6091',
};

// Paires a verifier (labels en majuscules >= 14px sont "grand texte" -> min 3:1)
const PAIRS = [
  // Textes sur fonds sombres
  { fg: 'creme', bg: 'vert', name: 'Creme sur vert', minRatio: 4.5 },
  { fg: 'creme', bg: 'vertNuit', name: 'Creme sur vert nuit', minRatio: 4.5 },
  { fg: 'orTexte', bg: 'vert', name: 'Or texte sur vert', minRatio: 3 },
  { fg: 'orTexte', bg: 'vertNuit', name: 'Or texte sur vert nuit', minRatio: 3 },
  { fg: 'or', bg: 'vertNuit', name: 'Or sur vert nuit', minRatio: 3 },

  // Textes sur fonds clairs
  { fg: 'vert', bg: 'creme', name: 'Vert sur creme', minRatio: 4.5 },
  { fg: 'encre', bg: 'creme', name: 'Encre sur creme', minRatio: 4.5 },
  { fg: 'encreDouce', bg: 'creme', name: 'Encre douce sur creme', minRatio: 4.5 },
  { fg: 'orLabel', bg: 'creme', name: 'Or label sur creme', minRatio: 3 },

  // Boutons
  { fg: 'encre', bg: 'or', name: 'Texte bouton (encre sur or)', minRatio: 4.5 },
  { fg: 'creme', bg: 'vert', name: 'Texte bouton (creme sur vert)', minRatio: 4.5 },

  // Liens Footer sur vert nuit
  { fg: 'creme', bg: 'vertNuit', name: 'Liens footer (creme 50% sur vert nuit)', minRatio: 3 },

  // Statuts sur leurs fonds
  { fg: 'statutDirect', bg: 'creme', name: 'Statut direct sur creme', minRatio: 4.5 },
  { fg: 'statutOk', bg: 'creme', name: 'Statut ok sur creme', minRatio: 3 },
  { fg: 'statutAlerte', bg: 'creme', name: 'Statut alerte sur creme', minRatio: 3 },
  { fg: 'statutErreur', bg: 'creme', name: 'Statut erreur sur creme', minRatio: 4.5 },
  { fg: 'statutInfo', bg: 'creme', name: 'Statut info sur creme', minRatio: 4.5 },
  { fg: 'blanc', bg: 'statutDirect', name: 'Blanc sur statut direct', minRatio: 4.5 },
];

console.log('=== Verification du contraste WCAG AA ===\n');

let allPass = true;

for (const pair of PAIRS) {
  const fgColor = COLORS[pair.fg];
  const bgColor = COLORS[pair.bg];
  const ratio = getContrastRatio(fgColor, bgColor);
  const pass = ratio >= pair.minRatio;

  if (!pass) allPass = false;

  const status = pass ? '✓' : '✗';
  const color = pass ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}${status}${reset} ${pair.name}`);
  console.log(`    ${fgColor} sur ${bgColor}`);
  console.log(`    Ratio: ${ratio.toFixed(2)}:1 (min: ${pair.minRatio}:1)`);
  console.log();
}

console.log('=== Resume ===');
if (allPass) {
  console.log('\x1b[32m✓ Tous les contrastes sont conformes WCAG AA\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ Certains contrastes ne sont pas conformes\x1b[0m');
  process.exit(1);
}
