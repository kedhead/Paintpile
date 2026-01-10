import { BasePaintScraper, ScrapedPaint, ScraperResult } from './base-scraper';
import * as cheerio from 'cheerio';

/**
 * Army Painter Scraper
 * Scrapes paint data from The Army Painter website
 *
 * Target: https://www.thearmypainter.com/shop/us/paints
 */
export class ArmyPainterScraper extends BasePaintScraper {
  constructor() {
    super('Army Painter', 'https://www.thearmypainter.com');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      console.log('Starting Army Painter scraping...');

      const paints: ScrapedPaint[] = [];

      // Scrape Fanatic line
      const fanaticPaints = await this.scrapeFanaticLine();
      paints.push(...fanaticPaints);

      // Scrape Warpaints line
      const warpaintsPaints = await this.scrapeWarpaints();
      paints.push(...warpaintsPaints);

      console.log(`Successfully scraped ${paints.length} Army Painter paints`);

      return this.createResult(paints);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape Army Painter Fanatic line
   */
  private async scrapeFanaticLine(): Promise<ScrapedPaint[]> {
    try {
      const url = `${this.baseUrl}/shop/us/paints/fanatic`;
      const html = await this.fetchHTML(url);

      // Parse HTML with cheerio
      const $ = cheerio.load(html);
      const paints: ScrapedPaint[] = [];

      // Find product cards (adjust selector based on actual HTML structure)
      $('.product-card').each((_, element) => {
        try {
          const name = $(element).find('.product-title').text().trim();
          const colorSwatch = $(element).find('.color-swatch').attr('style');
          const category = $(element).find('.product-category').text().trim();

          if (!name || !colorSwatch) return;

          // Extract hex color from style attribute
          const hexMatch = colorSwatch.match(/#[0-9A-F]{6}/i);
          if (!hexMatch) return;

          const hexColor = this.normalizeHexColor(hexMatch[0]);
          const type = this.mapPaintType(category || name);

          paints.push({
            brand: 'Army Painter Fanatic',
            name: this.normalizeName(name),
            hexColor,
            type,
            sourceUrl: url,
          });
        } catch (error: any) {
          this.logError(`Error parsing Fanatic paint: ${error.message}`);
        }
      });

      return paints;
    } catch (error: any) {
      this.logError(`Failed to scrape Fanatic line: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape Army Painter Warpaints
   */
  private async scrapeWarpaints(): Promise<ScrapedPaint[]> {
    try {
      const url = `${this.baseUrl}/shop/us/paints/warpaints`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const paints: ScrapedPaint[] = [];

      $('.product-card').each((_, element) => {
        try {
          const name = $(element).find('.product-title').text().trim();
          const colorSwatch = $(element).find('.color-swatch').attr('style');
          const category = $(element).find('.product-category').text().trim();

          if (!name || !colorSwatch) return;

          const hexMatch = colorSwatch.match(/#[0-9A-F]{6}/i);
          if (!hexMatch) return;

          const hexColor = this.normalizeHexColor(hexMatch[0]);
          const type = this.mapPaintType(category || name);

          paints.push({
            brand: 'Army Painter',
            name: this.normalizeName(name),
            hexColor,
            type,
            sourceUrl: url,
          });
        } catch (error: any) {
          this.logError(`Error parsing Warpaint: ${error.message}`);
        }
      });

      return paints;
    } catch (error: any) {
      this.logError(`Failed to scrape Warpaints: ${error.message}`);
      return [];
    }
  }
}
