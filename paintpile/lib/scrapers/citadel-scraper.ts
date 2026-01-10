import { BasePaintScraper, ScrapedPaint, ScraperResult } from './base-scraper';
import * as cheerio from 'cheerio';

/**
 * Citadel Paint Scraper
 * Scrapes paint data from Games Workshop website
 *
 * Target: https://www.games-workshop.com/en-US/Painting-Modelling
 */
export class CitadelScraper extends BasePaintScraper {
  constructor() {
    super('Citadel', 'https://www.games-workshop.com');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      console.log('Starting Citadel paint scraping...');

      const paints: ScrapedPaint[] = [];

      // Scrape different paint lines
      const categories = [
        'base-paints',
        'layer-paints',
        'shade-paints',
        'dry-paints',
        'contrast-paints',
        'technical-paints',
      ];

      for (const category of categories) {
        const categoryPaints = await this.scrapeCitadelCategory(category);
        paints.push(...categoryPaints);
      }

      console.log(`Successfully scraped ${paints.length} Citadel paints`);

      return this.createResult(paints);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape a specific Citadel paint category
   */
  private async scrapeCitadelCategory(category: string): Promise<ScrapedPaint[]> {
    try {
      const url = `${this.baseUrl}/en-US/searchResults?N=2562821819+${this.getCategoryCode(category)}`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const paints: ScrapedPaint[] = [];

      // Games Workshop uses product cards
      $('.product').each((_, element) => {
        try {
          const name = $(element).find('.product__title').text().trim();
          const link = $(element).find('a').attr('href');

          if (!name) return;

          // Extract color from product image or swatch if available
          const colorSwatch = $(element).find('.color-swatch');
          let hexColor = colorSwatch.attr('data-color') || '#808080';

          hexColor = this.normalizeHexColor(hexColor);

          const type = this.mapCitadelCategory(category);

          paints.push({
            brand: 'Citadel',
            name: this.normalizeName(name.replace('Citadel', '').trim()),
            hexColor,
            type,
            sourceUrl: link ? `${this.baseUrl}${link}` : url,
          });
        } catch (error: any) {
          this.logError(`Error parsing Citadel paint: ${error.message}`);
        }
      });

      return paints;
    } catch (error: any) {
      this.logError(`Failed to scrape category ${category}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get GW category code for filtering
   */
  private getCategoryCode(category: string): string {
    const codes: Record<string, string> = {
      'base-paints': '1613190097',
      'layer-paints': '1613190098',
      'shade-paints': '1613190099',
      'dry-paints': '1613190100',
      'contrast-paints': '1613190101',
      'technical-paints': '1613190102',
    };

    return codes[category] || '';
  }

  /**
   * Map Citadel category to paint type
   */
  private mapCitadelCategory(category: string): any {
    if (category.includes('base')) return 'base';
    if (category.includes('layer')) return 'layer';
    if (category.includes('shade')) return 'shade';
    if (category.includes('dry')) return 'layer';
    if (category.includes('contrast')) return 'contrast';
    if (category.includes('technical')) return 'technical';

    return 'layer';
  }
}
