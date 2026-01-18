
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
            let allPaints: ScrapedPaint[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore && page <= 3) {
                console.log(`Scraping page ${page}...`);
                const url = page === 1
                    ? 'https://www.liquitex.com/collections/professional-acrylic-inks'
                    : `https://www.liquitex.com/collections/professional-acrylic-inks?page=${page}`;

                try {
                    const html = await this.fetchHTML(url);
                    const $ = cheerio.load(html);
                    const pagePaints: ScrapedPaint[] = [];
                    let productData: any[] = [];

                    // 1. Build SKU -> Image Map from DOM
                    // Structure: <product-card> ... <figure> ... <div class="product-card-info"> ... <input name="sku"> ...
                    const skuMap = new Map<string, string>();

                    const skuInputs = $('input[name="sku"]');
                    skuInputs.each((_, el) => {
                        const sku = $(el).val() as string;
                        if (sku) {
                            // Search up for the product card container
                            const card = $(el).closest('.product-card');

                            if (card.length > 0) {
                                // Look for the primary image (swatch) first, then secondary (bottle), then any
                                let img = card.find('img.product-primary-image').first();
                                if (img.length === 0) img = card.find('img.product-secondary-image').first();
                                if (img.length === 0) img = card.find('figure img').first();

                                const src = img.attr('src') || img.attr('data-src') || img.attr('srcset')?.split(' ')[0];

                                if (src) {
                                    const finalSrc = src.startsWith('//') ? `https:${src}` : src;
                                    skuMap.set(sku, finalSrc);
                                }
                            }
                        }
                    });

                    console.log(`Page ${page}: Found ${skuMap.size} valid separate SKU/Image pairs in DOM.`);

                    // 2. Parse JSON Data
                    const scripts = $('script').toArray();
                    for (const script of scripts) {
                        const content = $(script).html() || '';
                        if (content.includes('listed_products: [')) {
                            const match = content.match(/listed_products:\s*(\[[\s\S]*?\])/);
                            if (match && match[1]) {
                                try {
                                    const productsLiteral = match[1];
                                    const productMatches = productsLiteral.matchAll(/\{[\s\S]*?\}/g);

                                    for (const pMatch of productMatches) {
                                        const productStr = pMatch[0];

                                        // Extract Title
                                        const titleMatch = productStr.match(/title:\s*"([^"]+)"/);
                                        const titleAltMatch = productStr.match(/title:\s*'([^']+)'/);
                                        const title = titleMatch ? titleMatch[1] : (titleAltMatch ? titleAltMatch[1] : '');

                                        // Extract SKU
                                        const skuMatch = productStr.match(/sku:\s*"([^"]+)"/);
                                        const skuAltMatch = productStr.match(/sku:\s*'([^']+)'/);
                                        const sku = skuMatch ? skuMatch[1] : (skuAltMatch ? skuAltMatch[1] : '');

                                        if (title) productData.push({ title, sku });
                                    }
                                } catch (e) {
                                    console.error(`Error parsing JSON on page ${page}:`, e);
                                }
                            }
                        }
                    }

                    if (productData.length === 0) {
                        console.log(`No products found on page ${page}, stopping.`);
                        hasMore = false;
                        break;
                    }

                    console.log(`Found ${productData.length} products on page ${page}`);

                    // 3. Merge Data
                    for (const p of productData) {
                        let name = p.title;
                        name = name.replace(/^Professional Acrylic Ink - /, '')
                            .replace(/ - 1oz\/30ml$/, '')
                            .replace(/\.replace\(\/ - Default Title\$\/g, ''\)$/, '');
                        name = name.trim();

                        if (name) {
                            // Lookup swatch via SKU
                            let swatchUrl = p.sku ? skuMap.get(p.sku) : undefined;

                            // Fallback to title matching if SKU lookup failed (unlikely but good safety)
                            if (!swatchUrl) {
                                // Original title matching logic as last resort
                                const searchTitle = p.title.replace(/ - 1oz\/30ml$/, '').replace(/ - Default Title$/, '');
                                const safeTitle = searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const img = $(`img[alt="${searchTitle}"]`).first();
                                if (img.length > 0) {
                                    const src = img.attr('src') || img.attr('data-src');
                                    if (src) swatchUrl = src.startsWith('//') ? `https:${src}` : src;
                                }
                            }

                            pagePaints.push({
                                brand: 'Liquitex Professional Acrylic Ink',
                                name: this.normalizeName(name),
                                hexColor: '#000000',
                                type: 'shade',
                                sourceUrl: url || '',
                                swatchUrl: swatchUrl || undefined
                            });
                        }
                    }

                    if (pagePaints.length > 0) {
                        allPaints = [...allPaints, ...pagePaints];
                        page++;
                    } else {
                        hasMore = false;
                    }

                } catch (err) {
                    console.error(`Error scraping page ${page}:`, err);
                    hasMore = false;
                }
            }

            return allPaints;
        } catch (error: any) {
            this.logError(`Failed to scrape Liquitex Acrylic Inks: ${error.message}`);
            return [];
        }
    }
}
