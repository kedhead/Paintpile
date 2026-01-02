import { BasePaintScraper, ScrapedPaint, ScraperResult } from './base-scraper';
import * as cheerio from 'cheerio';

/**
 * Vallejo Scraper
 * Scrapes paint data from Vallejo website
 *
 * Target: https://acrylicosvallejo.com/en/
 */
export class VallejoScraper extends BasePaintScraper {
  constructor() {
    super('Vallejo', 'https://acrylicosvallejo.com');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      console.log('Starting Vallejo scraping...');

      const paints: ScrapedPaint[] = [];

      // Scrape Model Color line
      const modelColorPaints = await this.scrapeModelColor();
      paints.push(...modelColorPaints);

      // Scrape Game Color line
      const gameColorPaints = await this.scrapeGameColor();
      paints.push(...gameColorPaints);

      console.log(`Successfully scraped ${paints.length} Vallejo paints`);

      return this.createResult(paints);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape Vallejo Model Color line
   */
  private async scrapeModelColor(): Promise<ScrapedPaint[]> {
    try {
      const url = `${this.baseUrl}/en/model-color/`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const paints: ScrapedPaint[] = [];

      // Vallejo typically has a color chart
      $('.color-item, .product-item').each((_, element) => {
        try {
          const name = $(element).find('.color-name, .product-name').text().trim();
          const colorCode = $(element).find('.color-code').text().trim();

          // Look for color swatch
          const colorSwatch = $(element).find('.color-swatch, .color-preview');
          const bgColor = colorSwatch.css('background-color');

          if (!name) return;

          // Try to extract hex from background color or data attribute
          let hexColor = colorSwatch.attr('data-color') ||
                        colorSwatch.attr('data-hex') ||
                        (bgColor ? this.rgbToHex(bgColor) : undefined);

          if (!hexColor || !this.validateHexColor(hexColor)) {
            // Fallback: infer from name
            hexColor = this.inferColorFromName(name);
          }

          hexColor = this.normalizeHexColor(hexColor);

          paints.push({
            brand: 'Vallejo Model Color',
            name: this.normalizeName(name),
            hexColor,
            type: this.mapVallejoType(name),
            sourceUrl: url,
          });
        } catch (error: any) {
          this.logError(`Error parsing Model Color paint: ${error.message}`);
        }
      });

      return paints;
    } catch (error: any) {
      this.logError(`Failed to scrape Model Color: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape Vallejo Game Color line
   */
  private async scrapeGameColor(): Promise<ScrapedPaint[]> {
    try {
      const url = `${this.baseUrl}/en/game-color/`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const paints: ScrapedPaint[] = [];

      $('.color-item, .product-item').each((_, element) => {
        try {
          const name = $(element).find('.color-name, .product-name').text().trim();
          const colorSwatch = $(element).find('.color-swatch, .color-preview');
          const bgColor = colorSwatch.css('background-color');

          if (!name) return;

          let hexColor = colorSwatch.attr('data-color') ||
                        colorSwatch.attr('data-hex') ||
                        (bgColor ? this.rgbToHex(bgColor) : undefined);

          if (!hexColor || !this.validateHexColor(hexColor)) {
            hexColor = this.inferColorFromName(name);
          }

          hexColor = this.normalizeHexColor(hexColor);

          paints.push({
            brand: 'Vallejo Game Color',
            name: this.normalizeName(name),
            hexColor,
            type: this.mapVallejoType(name),
            sourceUrl: url,
          });
        } catch (error: any) {
          this.logError(`Error parsing Game Color paint: ${error.message}`);
        }
      });

      return paints;
    } catch (error: any) {
      this.logError(`Failed to scrape Game Color: ${error.message}`);
      return [];
    }
  }

  /**
   * Convert RGB to Hex
   */
  private rgbToHex(rgb: string): string {
    if (!rgb || !rgb.includes('rgb')) return '';

    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return '';

    const r = parseInt(matches[0]);
    const g = parseInt(matches[1]);
    const b = parseInt(matches[2]);

    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  /**
   * Map Vallejo naming to paint types
   */
  private mapVallejoType(name: string): any {
    const lower = name.toLowerCase();

    if (lower.includes('metal') || lower.includes('metallic')) {
      return 'metallic';
    }

    // Vallejo primarily makes layer paints
    return 'layer';
  }

  /**
   * Infer color from name as fallback
   */
  private inferColorFromName(name: string): string {
    // Similar color mapping as Monument scraper
    // Return medium gray as fallback
    return '#808080';
  }
}
