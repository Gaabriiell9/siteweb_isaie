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

// Palette du site (variables de index.css - palette origine)
const COLORS = {
  noir: '#0E0600',
  bordeaux: '#6B1A2E',
  bordeauxClair: '#8B2E44',
  or: '#B87800',
  orClair: '#E8B84B',
  orPale: '#FDF3DC',
  creme: '#FFFBF5',
  texte: '#2A1200',
  texteDoux: '#6B5540',
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
  { fg: 'creme', bg: 'noir', name: 'Creme sur noir', minRatio: 4.5 },
  { fg: 'creme', bg: 'bordeaux', name: 'Creme sur bordeaux', minRatio: 4.5 },
  { fg: 'orClair', bg: 'noir', name: 'Or clair sur noir', minRatio: 3 },
  { fg: 'orClair', bg: 'bordeaux', name: 'Or clair sur bordeaux', minRatio: 3 },
  { fg: 'or', bg: 'noir', name: 'Or sur noir', minRatio: 3 },

  // Textes sur fonds clairs
  { fg: 'bordeaux', bg: 'creme', name: 'Bordeaux sur creme', minRatio: 4.5 },
  { fg: 'bordeauxClair', bg: 'creme', name: 'Bordeaux clair sur creme', minRatio: 4.5 },
  { fg: 'texte', bg: 'creme', name: 'Texte sur creme', minRatio: 4.5 },
  { fg: 'texteDoux', bg: 'creme', name: 'Texte doux sur creme', minRatio: 4.5 },
  { fg: 'or', bg: 'creme', name: 'Or sur creme', minRatio: 3 },

  // Boutons
  { fg: 'texte', bg: 'or', name: 'Texte bouton (texte sur or)', minRatio: 4.5 },
  { fg: 'creme', bg: 'bordeaux', name: 'Texte bouton (creme sur bordeaux)', minRatio: 4.5 },

  // Liens Footer sur noir
  { fg: 'orClair', bg: 'noir', name: 'Liens footer (or clair sur noir)', minRatio: 3 },

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
