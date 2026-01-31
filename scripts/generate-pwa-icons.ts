import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SOURCE_IMAGE = path.join(PUBLIC_DIR, 'paintpile-logo.png');

async function generateIcons() {
    if (!fs.existsSync(SOURCE_IMAGE)) {
        console.error('Source image not found:', SOURCE_IMAGE);
        process.exit(1);
    }

    const sizes = [192, 512];

    for (const size of sizes) {
        const dest = path.join(PUBLIC_DIR, `web-app-manifest-${size}x${size}.png`);

        console.log(`Generating ${size}x${size} icon...`);

        await sharp(SOURCE_IMAGE)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .toFile(dest);

        console.log(`Created ${dest}`);
    }
}

generateIcons().catch(console.error);
