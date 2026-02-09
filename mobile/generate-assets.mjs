import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '..', 'public', 'images', 'paintpile-logo-main.png');
const assetsDir = path.join(__dirname, 'assets');

async function generateIcon() {
  const iconSize = 1024;
  const metadata = await sharp(logoPath).metadata();
  console.log(`Source logo: ${metadata.width}x${metadata.height}`);

  // Crop just the P (top ~65% of the image, skip the "PaintPile.com" text)
  const pHeight = Math.round(metadata.height * 0.65);
  const pCropped = await sharp(logoPath)
    .extract({ left: 0, top: 0, width: metadata.width, height: pHeight })
    .png()
    .toBuffer();

  console.log(`Cropped P region: ${metadata.width}x${pHeight}`);

  // Icon: P at ~65% of icon size, centered on black
  const logoFit = Math.round(iconSize * 0.65);
  const iconResized = await sharp(pCropped)
    .resize(logoFit, logoFit, { fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 },
    },
  })
    .composite([{ input: iconResized, gravity: 'centre' }])
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  console.log('Created icon.png (1024x1024)');

  // Adaptive icon: smaller P (~50%) for Android safe zone
  const adaptiveFit = Math.round(iconSize * 0.50);
  const adaptiveResized = await sharp(pCropped)
    .resize(adaptiveFit, adaptiveFit, { fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 },
    },
  })
    .composite([{ input: adaptiveResized, gravity: 'centre' }])
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));

  console.log('Created adaptive-icon.png (1024x1024)');
}

async function generateSplash() {
  const splashWidth = 1284;
  const splashHeight = 2778;
  const metadata = await sharp(logoPath).metadata();

  // Use the full logo for splash, resized to ~50% of splash width
  const targetWidth = Math.round(splashWidth * 0.50);
  const resized = await sharp(logoPath)
    .resize(targetWidth, null, { fit: 'inside' })
    .png()
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();
  console.log(`Splash logo resized: ${resizedMeta.width}x${resizedMeta.height}`);

  await sharp({
    create: {
      width: splashWidth,
      height: splashHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 },
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));

  console.log('Created splash.png (1284x2778)');
}

async function main() {
  await generateIcon();
  await generateSplash();
  console.log('\nAll assets generated in mobile/assets/');
}

main().catch(console.error);
