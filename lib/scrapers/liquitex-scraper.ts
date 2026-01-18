
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

            while (hasMore && page <= 3) { // Safety limit of 3 pages (likely only 2 needed for 55 products)
                console.log(`Scraping page ${page}...`);
                const url = page === 1
                    ? 'https://www.liquitex.com/collections/professional-acrylic-inks'
                    : `https://www.liquitex.com/collections/professional-acrylic-inks?page=${page}`;

                try {
                    const html = await this.fetchHTML(url);
                    const $ = cheerio.load(html);
                    const pagePaints: ScrapedPaint[] = [];
                    let productData: any[] = [];

                    // Liquitex uses embedded JSON for product data
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
                                        const titleMatch = productStr.match(/title:\s*"([^"]+)"/);
                                        const titleAltMatch = productStr.match(/title:\s*'([^']+)'/);
                                        const title = titleMatch ? titleMatch[1] : (titleAltMatch ? titleAltMatch[1] : '');
                                        if (title) productData.push({ title });
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

                    for (const p of productData) {
                        let name = p.title;
                        name = name.replace(/^Professional Acrylic Ink - /, '')
                            .replace(/ - 1oz\/30ml$/, '')
                            .replace(/\.replace\(\/ - Default Title\$\/g, ''\)$/, '');
                        name = name.trim();

                        if (name) {
                            const searchTitle = p.title.replace(/ - 1oz\/30ml$/, '').replace(/ - Default Title$/, ''); // "Professional Acrylic Ink - Bismuth Yellow"
                            let swatchUrl = '';
                            const safeTitle = searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const img = $(`img[alt="${searchTitle}"]`).first();

                            if (img.length > 0) {
                                const src = img.attr('src') || img.attr('data-src');
                                if (src) {
                                    swatchUrl = src.startsWith('//') ? `https:${src}` : src;
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
