
import * as fs from 'fs';
import * as cheerio from 'cheerio';

async function debugScraper() {
    try {
        const html = fs.readFileSync('debug_liquitex.html', 'utf8');
        const $ = cheerio.load(html);
        let count = 0;

        const scripts = $('script').toArray();
        for (const script of scripts) {
            const content = $(script).html() || '';
            if (content.includes('listed_products: [')) {
                // Extract the listed_products array
                const match = content.match(/listed_products:\s*(\[[\s\S]*?\])/);
                if (match && match[1]) {
                    const productsLiteral = match[1];
                    const productMatches = productsLiteral.matchAll(/\{[\s\S]*?\}/g);

                    for (const pMatch of productMatches) {
                        const productStr = pMatch[0];

                        // Extract Title
                        const titleMatch = productStr.match(/title:\s*"([^"]+)"/);
                        const titleAltMatch = productStr.match(/title:\s*'([^']+)'/);
                        const fullTitle = titleMatch ? titleMatch[1] : (titleAltMatch ? titleAltMatch[1] : '');

                        if (fullTitle) {
                            count++;
                            // Logic from LiquitexScraper
                            const searchTitle = fullTitle.replace(/ - 1oz\/30ml$/, '').replace(/ - Default Title$/, '');

                            // Debug: Check what images we find
                            const safeTitle = searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            // console.log(`Searching for img with alt="${searchTitle}"`);

                            const img = $(`img[alt="${searchTitle}"]`).first();
                            let swatchUrl = '';

                            if (img.length > 0) {
                                const src = img.attr('src') || img.attr('data-src');
                                if (src) {
                                    swatchUrl = src.startsWith('//') ? `https:${src}` : src;
                                }
                            } else {
                                // Try finding *any* image with the title in alt
                                const looseImg = $(`img[alt*="${searchTitle}"]`).first();
                                if (looseImg.length > 0) {
                                    console.log(`[${searchTitle}] Start match failed, but found loose match: ${looseImg.attr('alt')}`);
                                } else {
                                    console.log(`[${searchTitle}] NO IMAGE FOUND`);
                                }
                            }

                            if (swatchUrl) {
                                console.log(`[OK] ${searchTitle} -> ${swatchUrl.substring(0, 50)}...`);
                            }
                        }
                    }
                }
            }
        }
        console.log(`Total products processed: ${count}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

debugScraper();
