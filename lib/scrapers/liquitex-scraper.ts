
import { BasePaintScraper, ScrapedPaint, ScraperResult } from './base-scraper';
import * as cheerio from 'cheerio';

export class LiquitexScraper extends BasePaintScraper {
    constructor() {
        super('Liquitex', 'https://www.liquitex.com');
    }

    async scrape(): Promise<ScraperResult> {
        try {
            console.log('Starting Liquitex scraping...');
            const paints: ScrapedPaint[] = await this.scrapeAcrylicInks();
            return this.createResult(paints);
        } catch (error: any) {
            this.logError(`Scraping failed: ${error.message}`);
            return this.createResult([]);
        }
    }

    private async scrapeAcrylicInks(): Promise<ScrapedPaint[]> {
        try {
            const url = 'https://www.liquitex.com/collections/professional-acrylic-inks';
            const html = await this.fetchHTML(url);
            const $ = cheerio.load(html);
            const paints: ScrapedPaint[] = [];

            // Liquitex uses embedded JSON for product data
            // Look for a script containing "listed_products" or "eventProps"
            const scripts = $('script').toArray();
            let productData: any[] = [];

            for (const script of scripts) {
                const content = $(script).html() || '';
                if (content.includes('listed_products: [')) {
                    // Extract the listed_products array
                    const match = content.match(/listed_products:\s*(\[[\s\S]*?\])/);
                    if (match && match[1]) {
                        try {
                            // The JSON might be malformed (e.g. trailing commas, method calls), so we need to be careful
                            // However, the snippet we saw looked like valid JS object literals, not strict JSON.
                            // { id: "...", ... } keys are not quoted.
                            // We'll use a regex to extract individual objects or just parse the JS using Function constructor if safe-ish,
                            // or safer: regex extract fields.

                            const productsLiteral = match[1];
                            const productMatches = productsLiteral.matchAll(/\{[\s\S]*?\}/g);

                            for (const pMatch of productMatches) {
                                const productStr = pMatch[0];
                                const titleMatch = productStr.match(/title:\s*"([^"]+)"/);
                                const titleAltMatch = productStr.match(/title:\s*'([^']+)'/);
                                const title = titleMatch ? titleMatch[1] : (titleAltMatch ? titleAltMatch[1] : '');

                                if (title) {
                                    productData.push({ title });
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing Liquitex JSON:', e);
                        }
                    }
                }
            }

            console.log(`Found ${productData.length} products via JSON`);

            for (const p of productData) {
                let name = p.title;
                // Clean up name: "Professional Acrylic Ink - Bismuth Yellow - 1oz/30ml"
                name = name.replace(/^Professional Acrylic Ink - /, '')
                    .replace(/ - 1oz\/30ml$/, '')
                    .replace(/\.replace\(\/ - Default Title\$\/g, ''\)$/, ''); // Clean up the JS replace code if it was captured

                name = name.trim();

                if (name) {
                    // Try to find the image SWATCH based on the title
                    // HTML Image: alt="Professional Acrylic Ink - Bismuth Yellow" src="..."
                    // JSON Title: "Professional Acrylic Ink - Bismuth Yellow - 1oz/30ml"
                    // We need to match partially.

                    const searchTitle = p.title.replace(/ - 1oz\/30ml$/, '').replace(/ - Default Title$/, ''); // "Professional Acrylic Ink - Bismuth Yellow"

                    let swatchUrl = '';
                    // Look for img with alt containing the searchTitle
                    // Use a specific selector to avoid thumbnails if possible, but finding by alt is decent
                    // The main image usually has class "product-primary-image" or similar, but let's check all imgs

                    // We need to escape special regex chars in searchTitle just in case
                    const safeTitle = searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const img = $(`img[alt="${searchTitle}"]`).first();

                    if (img.length > 0) {
                        // Prefer data-src or srcset if available, otherwise src
                        const src = img.attr('src') || img.attr('data-src');
                        if (src) {
                            swatchUrl = src.startsWith('//') ? `https:${src}` : src;
                        }
                    }

                    paints.push({
                        brand: 'Liquitex Professional Acrylic Ink',
                        name: this.normalizeName(name),
                        hexColor: '#000000', // Fallback
                        type: 'shade',
                        sourceUrl: url || '', // Ensure it's a string if ever undefined
                        swatchUrl: swatchUrl || undefined
                    });
                }
            }

            return paints;
        } catch (error: any) {
            this.logError(`Failed to scrape Liquitex Acrylic Inks: ${error.message}`);
            return [];
        }
    }
}
