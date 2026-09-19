/**
 * Optimisation des images pour le site
 * Convertit les images PNG en WebP avec plusieurs tailles
 * Usage: node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const IMAGES = [
  {
    src: 'public/pr_img.png',
    dest: 'public/pr_img',
    sizes: [800, 1200, 1600],
    quality: 85,
  },
];

async function optimizeImage({ src, dest, sizes, quality = 85 }) {
  const srcPath = join(ROOT, src);
  const destDir = dirname(join(ROOT, dest));

  try {
    await mkdir(destDir, { recursive: true });
  } catch {}

  console.log(`\nOptimizing: ${src}`);

  const img = sharp(srcPath);
  const metadata = await img.metadata();
  console.log(`  Original: ${metadata.width}x${metadata.height}`);

  for (const width of sizes) {
    const destPath = `${join(ROOT, dest)}_${width}.webp`;
    await sharp(srcPath)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality })
      .toFile(destPath);
    const stats = await sharp(destPath).metadata();
    console.log(`  ${width}px: ${stats.width}x${stats.height} -> ${destPath.split('/').pop()}`);
  }

  // Generate single WebP at original size as fallback
  const destWebp = `${join(ROOT, dest)}.webp`;
  await sharp(srcPath)
    .webp({ quality })
    .toFile(destWebp);
  console.log(`  Full: ${destWebp.split('/').pop()}`);
}

async function main() {
  console.log('=== Image Optimization ===');

  for (const config of IMAGES) {
    await optimizeImage(config);
  }

  console.log('\n✓ Done!');
}

main().catch(console.error);
