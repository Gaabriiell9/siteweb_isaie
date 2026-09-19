/**
 * Inventaire des couleurs du site
 * Usage: node scripts/color-inventory.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Regex pour extraire les couleurs
const COLOR_PATTERNS = [
  /#([0-9a-fA-F]{3}){1,2}\b/g,
  /rgba?\s*\([^)]+\)/gi,
  /hsla?\s*\([^)]+\)/gi,
];

// Noms de couleurs CSS courants
const NAMED_COLORS = [
  'white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'olive', 'maroon', 'silver', 'gold', 'transparent', 'inherit',
  'currentColor', 'charcoal'
];

const NAMED_COLOR_REGEX = new RegExp(`\\b(${NAMED_COLORS.join('|')})\\b`, 'gi');

// Conversion hex vers HSL
function hexToHsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Classification par famille de couleur
function classifyColor(color) {
  const lowerColor = color.toLowerCase();

  // Noms speciaux
  if (lowerColor === 'transparent' || lowerColor === 'inherit' || lowerColor === 'currentcolor') {
    return 'special';
  }
  if (lowerColor === 'white' || lowerColor === '#fff' || lowerColor === '#ffffff') {
    return 'blanc';
  }
  if (lowerColor === 'black' || lowerColor === '#000' || lowerColor === '#000000') {
    return 'noir';
  }
  if (lowerColor === 'charcoal') {
    return 'gris';
  }

  // Extraire HSL pour les hex
  let hsl;
  if (lowerColor.startsWith('#')) {
    hsl = hexToHsl(lowerColor);
  } else if (lowerColor.startsWith('rgb')) {
    const match = lowerColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
      const [, r, g, b] = match;
      const hex = '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      hsl = hexToHsl(hex);
    }
  } else if (lowerColor.startsWith('hsl')) {
    const match = lowerColor.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)/i);
    if (match) {
      hsl = { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
    }
  }

  if (!hsl) {
    // Noms de couleurs
    if (['red', 'maroon'].includes(lowerColor)) return 'rouge';
    if (['green', 'lime', 'teal'].includes(lowerColor)) return 'vert';
    if (['blue', 'navy', 'cyan'].includes(lowerColor)) return 'bleu';
    if (['yellow', 'gold'].includes(lowerColor)) return 'or';
    if (['orange'].includes(lowerColor)) return 'orange';
    if (['gray', 'grey', 'silver'].includes(lowerColor)) return 'gris';
    return 'autre';
  }

  const { h, s, l } = hsl;

  // Gris (faible saturation)
  if (s < 8) {
    if (l > 90) return 'blanc';
    if (l < 10) return 'noir';
    return 'gris';
  }

  // Classification par teinte
  if (h >= 0 && h < 15) return 'rouge';
  if (h >= 15 && h < 45) return 'orange';
  if (h >= 45 && h < 70) return 'or';
  if (h >= 70 && h < 170) return 'vert';
  if (h >= 170 && h < 260) return 'bleu';
  if (h >= 260 && h < 290) return 'violet';
  if (h >= 290 && h < 330) return 'rose';
  if (h >= 330) return 'rouge';

  return 'autre';
}

// Parcourir les fichiers
function walkDir(dir, extensions, results = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const path = join(dir, file);
      try {
        const stat = statSync(path);
        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
            walkDir(path, extensions, results);
          }
        } else if (extensions.includes(extname(file))) {
          results.push(path);
        }
      } catch (e) {
        // Ignorer les erreurs de permission
      }
    }
  } catch (e) {
    // Ignorer les erreurs de permission
  }
  return results;
}

// Extraire les couleurs d'un fichier
function extractColors(content) {
  const colors = new Map();

  // Patterns hex, rgb, hsl
  for (const pattern of COLOR_PATTERNS) {
    const matches = content.match(pattern) || [];
    for (const match of matches) {
      const normalized = match.toLowerCase().replace(/\s+/g, '');
      colors.set(normalized, (colors.get(normalized) || 0) + 1);
    }
  }

  // Noms de couleurs
  const namedMatches = content.match(NAMED_COLOR_REGEX) || [];
  for (const match of namedMatches) {
    const normalized = match.toLowerCase();
    colors.set(normalized, (colors.get(normalized) || 0) + 1);
  }

  return colors;
}

// Main
console.log('=== Inventaire des Couleurs ===\n');

const srcFiles = walkDir('src', ['.css', '.js', '.jsx']);
const publicFiles = ['public/index.html', 'public/manifest.json'].filter(f => {
  try { readFileSync(f); return true; } catch { return false; }
});

const allFiles = [...srcFiles, ...publicFiles];
const globalStats = {
  byFamily: {},
  byColor: {},
  filesByFamily: {}
};

for (const file of allFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    const colors = extractColors(content);

    if (colors.size > 0) {
      console.log(`\n--- ${file} ---`);
      console.log(`Occurrences totales: ${[...colors.values()].reduce((a, b) => a + b, 0)}`);

      const byFamily = {};
      for (const [color, count] of colors) {
        const family = classifyColor(color);
        if (!byFamily[family]) byFamily[family] = [];
        byFamily[family].push({ color, count });

        // Stats globales
        globalStats.byColor[color] = (globalStats.byColor[color] || 0) + count;
        globalStats.byFamily[family] = (globalStats.byFamily[family] || 0) + count;
        if (!globalStats.filesByFamily[family]) globalStats.filesByFamily[family] = new Set();
        globalStats.filesByFamily[family].add(file);
      }

      for (const [family, items] of Object.entries(byFamily).sort()) {
        const colorList = items.map(i => `${i.color}(${i.count})`).join(', ');
        console.log(`  ${family}: ${colorList}`);
      }
    }
  } catch (e) {
    // Ignorer les fichiers non lisibles
  }
}

console.log('\n\n=== Resume Global ===\n');

console.log('Par famille:');
for (const [family, count] of Object.entries(globalStats.byFamily).sort((a, b) => b[1] - a[1])) {
  const files = globalStats.filesByFamily[family];
  console.log(`  ${family}: ${count} occurrences dans ${files.size} fichiers`);
}

console.log('\n\nFichiers avec gris fonces ou noirs:');
const grayFiles = globalStats.filesByFamily['gris'] || new Set();
const blackFiles = globalStats.filesByFamily['noir'] || new Set();
const combined = new Set([...grayFiles, ...blackFiles]);
for (const file of [...combined].sort()) {
  console.log(`  - ${file}`);
}

console.log('\n\nCouleurs grises distinctes:');
const grayColors = Object.entries(globalStats.byColor)
  .filter(([color]) => classifyColor(color) === 'gris')
  .sort((a, b) => b[1] - a[1]);
for (const [color, count] of grayColors) {
  console.log(`  ${color}: ${count}`);
}

console.log('\n\nCouleurs noires distinctes:');
const blackColors = Object.entries(globalStats.byColor)
  .filter(([color]) => classifyColor(color) === 'noir')
  .sort((a, b) => b[1] - a[1]);
for (const [color, count] of blackColors) {
  console.log(`  ${color}: ${count}`);
}
