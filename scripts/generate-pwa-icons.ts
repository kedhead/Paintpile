import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SOURCE_IMAGE = path.join(PUBLIC_DIR, 'images', 'paintpile-logo-main.png');
const BG_COLOR = { r: 9, g: 9, b: 11, alpha: 255 }; // #09090b zinc-950

async function makeIcon(
    pCropped: Buffer,
    size: number,
    pScale: number,
    bg: typeof BG_COLOR | null,
    outputPath: string
) {
    const logoFit = Math.round(size * pScale);
    const resized = await sharp(pCropped)
        .resize(logoFit, logoFit, { fit: 'inside' })
        .png()
        .toBuffer();

    const background = bg
        ? { r: bg.r, g: bg.g, b: bg.b, alpha: bg.alpha }
        : { r: 0, g: 0, b: 0, alpha: 0 };

    await sharp({
        create: { width: size, height: size, channels: 4, background },
    })
        .composite([{ input: resized, gravity: 'centre' }])
        .png()
        .toFile(outputPath);

    console.log(`  ${path.relative(PUBLIC_DIR, outputPath)} (${size}x${size})`);
}

async function makeSplash(
    pCropped: Buffer,
    width: number,
    height: number,
    name: string
) {
    const splashDir = path.join(PUBLIC_DIR, 'splash');
    if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

    const logoTarget = Math.round(width * 0.35);
    const resized = await sharp(pCropped)
        .resize(logoTarget, logoTarget, { fit: 'inside' })
        .png()
        .toBuffer();

    await sharp({
        create: { width, height, channels: 4, background: BG_COLOR },
    })
        .composite([{ input: resized, gravity: 'centre' }])
        .png({ compressionLevel: 9 })
        .toFile(path.join(splashDir, `${name}.png`));

    console.log(`  splash/${name}.png (${width}x${height})`);
}

async function generateIcons() {
    if (!fs.existsSync(SOURCE_IMAGE)) {
        console.error('Source image not found:', SOURCE_IMAGE);
        process.exit(1);
    }

    const metadata = await sharp(SOURCE_IMAGE).metadata();
    console.log(`Source: ${metadata.width}x${metadata.height}`);

    // Crop to just the P (top 65%, skip "PaintPile.com" text)
    const pHeight = Math.round(metadata.height! * 0.65);
    const pCropped = await sharp(SOURCE_IMAGE)
        .extract({ left: 0, top: 0, width: metadata.width!, height: pHeight })
        .png()
        .toBuffer();

    console.log(`Cropped P region: ${metadata.width}x${pHeight}\n`);

    // --- Standard icons (dark background, P at 65%) ---
    console.log('Standard icons:');
    await makeIcon(pCropped, 192, 0.65, BG_COLOR, path.join(PUBLIC_DIR, 'web-app-manifest-192x192.png'));
    await makeIcon(pCropped, 512, 0.65, BG_COLOR, path.join(PUBLIC_DIR, 'web-app-manifest-512x512.png'));

    // --- Apple touch icon (dark background, P at 65%) ---
    console.log('\nApple touch icon:');
    await makeIcon(pCropped, 180, 0.65, BG_COLOR, path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

    // --- Maskable icons (dark background, P at 50% for safe zone) ---
    console.log('\nMaskable icons:');
    await makeIcon(pCropped, 192, 0.50, BG_COLOR, path.join(PUBLIC_DIR, 'maskable-icon-192x192.png'));
    await makeIcon(pCropped, 512, 0.50, BG_COLOR, path.join(PUBLIC_DIR, 'maskable-icon-512x512.png'));

    // --- Favicons (transparent background, P at 80% for small sizes) ---
    console.log('\nFavicons:');
    await makeIcon(pCropped, 32, 0.80, null, path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    await makeIcon(pCropped, 16, 0.80, null, path.join(PUBLIC_DIR, 'favicon-16x16.png'));

    // favicon.ico — modern browsers accept PNG served as .ico
    fs.copyFileSync(
        path.join(PUBLIC_DIR, 'favicon-32x32.png'),
        path.join(PUBLIC_DIR, 'favicon.ico')
    );
    console.log('  favicon.ico (copied from favicon-32x32.png)');

    // --- iPhone splash screens ---
    console.log('\nSplash screens:');
    const splashes = [
        { w: 750,  h: 1334, name: 'iphone-8' },
        { w: 828,  h: 1792, name: 'iphone-xr' },
        { w: 1125, h: 2436, name: 'iphone-x' },
        { w: 1170, h: 2532, name: 'iphone-12' },
        { w: 1179, h: 2556, name: 'iphone-14-pro' },
        { w: 1284, h: 2778, name: 'iphone-14-pro-max' },
        { w: 1290, h: 2796, name: 'iphone-15-pro-max' },
    ];

    for (const s of splashes) {
        await makeSplash(pCropped, s.w, s.h, s.name);
    }

    console.log('\nAll PWA assets generated.');
}

generateIcons().catch(console.error);
