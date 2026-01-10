import {
  BasePaintSetScraper,
  ScrapedPaintSet,
  PaintSetScraperResult,
} from './paint-set-scraper-base';
import * as cheerio from 'cheerio';

/**
 * Army Painter Paint Set Scraper
 * Scrapes paint SET information from The Army Painter website
 *
 * Target: https://www.thearmypainter.com/shop/us/paints
 */
export class ArmyPainterSetScraper extends BasePaintSetScraper {
  constructor() {
    super('Army Painter', 'https://www.thearmypainter.com');
  }

  async scrape(): Promise<PaintSetScraperResult> {
    try {
      console.log('Starting Army Painter paint set scraping...');

      const sets: ScrapedPaintSet[] = [];

      // Scrape Speedpaint sets
      const speedpaintSets = await this.scrapeSpeedpaintSets();
      sets.push(...speedpaintSets);

      // Scrape Fanatic sets
      const fanaticSets = await this.scrapeFanaticSets();
      sets.push(...fanaticSets);

      // Scrape Warpaints sets
      const warpaintsSets = await this.scrapeWarpaintsSets();
      sets.push(...warpaintsSets);

      console.log(`Successfully scraped ${sets.length} Army Painter paint sets`);

      return this.createResult(sets);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape Speedpaint sets
   */
  private async scrapeSpeedpaintSets(): Promise<ScrapedPaintSet[]> {
    try {
      // Target the Speedpaint product page
      const url = `${this.baseUrl}/shop/us/sp2001`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const sets: ScrapedPaintSet[] = [];

      // Look for set/bundle products
      // Note: HTML selectors may need adjustment based on actual site structure
      $('.product-bundle, .product-set, [data-product-type="set"]').each((_, element) => {
        try {
          const setName = $(element).find('.product-title, h1, h2').first().text().trim();
          const description = $(element).find('.product-description, .description').first().text().trim();
          const imageUrl = $(element).find('img').first().attr('src');

          // Extract paint list from description or included items
          const paintListText = $(element).find('.included-paints, .product-includes, ul').text();
          const paintNames = this.extractPaintNames(paintListText);

          if (setName && paintNames.length > 0) {
            sets.push({
              setName: this.normalizeSetName(setName),
              brand: 'Army Painter',
              paintNames,
              description: description || undefined,
              imageUrl: imageUrl ? this.resolveUrl(imageUrl) : undefined,
              sourceUrl: url,
              paintCount: paintNames.length,
            });
          }
        } catch (error: any) {
          this.logError(`Error parsing Speedpaint set: ${error.message}`);
        }
      });

      return sets;
    } catch (error: any) {
      this.logError(`Failed to scrape Speedpaint sets: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape Fanatic paint sets
   */
  private async scrapeFanaticSets(): Promise<ScrapedPaintSet[]> {
    try {
      // Army Painter Fanatic starter sets
      const url = `${this.baseUrl}/shop/us/paints/fanatic`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const sets: ScrapedPaintSet[] = [];

      // Find set/bundle products (adjust selectors as needed)
      $('.product-card').each((_, element) => {
        const title = $(element).find('.product-title').text().trim();

        // Only process items that are sets (contain "set" in the title)
        if (!title.toLowerCase().includes('set')) return;

        try {
          const productLink = $(element).find('a').attr('href');
          const fullUrl = productLink ? `${this.baseUrl}${productLink}` : url;

          // We'd need to visit the individual product page to get paint list
          // For now, we'll note the set exists
          sets.push({
            setName: this.normalizeSetName(title),
            brand: 'Army Painter Fanatic',
            paintNames: [], // Would need to scrape individual product page
            sourceUrl: fullUrl,
            paintCount: 0,
          });
        } catch (error: any) {
          this.logError(`Error parsing Fanatic set: ${error.message}`);
        }
      });

      return sets;
    } catch (error: any) {
      this.logError(`Failed to scrape Fanatic sets: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape Warpaints sets
   */
  private async scrapeWarpaintsSets(): Promise<ScrapedPaintSet[]> {
    try {
      const url = `${this.baseUrl}/shop/us/paints/warpaints`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const sets: ScrapedPaintSet[] = [];

      $('.product-card').each((_, element) => {
        const title = $(element).find('.product-title').text().trim();

        if (!title.toLowerCase().includes('set')) return;

        try {
          const productLink = $(element).find('a').attr('href');
          const fullUrl = productLink ? `${this.baseUrl}${productLink}` : url;

          sets.push({
            setName: this.normalizeSetName(title),
            brand: 'Army Painter',
            paintNames: [],
            sourceUrl: fullUrl,
            paintCount: 0,
          });
        } catch (error: any) {
          this.logError(`Error parsing Warpaints set: ${error.message}`);
        }
      });

      return sets;
    } catch (error: any) {
      this.logError(`Failed to scrape Warpaints sets: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape individual product page for paint list
   */
  private async scrapeProductPage(url: string): Promise<string[]> {
    try {
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Look for paint list in various locations
      const paintListSelectors = [
        '.product-includes ul',
        '.included-paints',
        '[data-paint-list]',
        '.description ul',
      ];

      for (const selector of paintListSelectors) {
        const listText = $(selector).text();
        if (listText.length > 0) {
          const paints = this.extractPaintNames(listText);
          if (paints.length > 0) {
            return paints;
          }
        }
      }

      return [];
    } catch (error: any) {
      this.logError(`Failed to scrape product page ${url}: ${error.message}`);
      return [];
    }
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return url;
  }
}
