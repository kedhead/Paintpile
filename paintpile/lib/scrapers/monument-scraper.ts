import { BasePaintScraper, ScrapedPaint, ScraperResult } from './base-scraper';
import * as cheerio from 'cheerio';

/**
 * Monument Hobbies ProAcryl Scraper
 * Scrapes paint data from Monument Hobbies website
 *
 * Target: https://monumenthobbies.com/collections/pro-acryl-paints
 */
export class MonumentScraper extends BasePaintScraper {
  constructor() {
    super('ProAcryl', 'https://monumenthobbies.com');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      console.log('Starting ProAcryl scraping...');

      const paints = await this.scrapeProAcrylPaints();

      console.log(`Successfully scraped ${paints.length} ProAcryl paints`);

      return this.createResult(paints);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape ProAcryl paint line
   */
  private async scrapeProAcrylPaints(): Promise<ScrapedPaint[]> {
    try {
      const url = `${this.baseUrl}/collections/pro-acryl-paints`;
      const html = await this.fetchHTML(url);

      const $ = cheerio.load(html);
      const paints: ScrapedPaint[] = [];

      // Monument uses Shopify, look for product grid items
      $('.product-item, .grid-product').each((_, element) => {
        try {
          const name = $(element).find('.product-title, .product-item__title').text().trim();
          const link = $(element).find('a').attr('href');

          if (!name) return;

          // Extract color from product name or image
          // ProAcryl naming usually includes color descriptors
          const hexColor = this.inferColorFromName(name);
          const type = this.inferTypeFromName(name);

          paints.push({
            brand: 'ProAcryl',
            name: this.normalizeName(name),
            hexColor,
            type,
            sourceUrl: link ? `${this.baseUrl}${link}` : url,
          });
        } catch (error: any) {
          this.logError(`Error parsing ProAcryl paint: ${error.message}`);
        }
      });

      return paints;
    } catch (error: any) {
      this.logError(`Failed to scrape ProAcryl paints: ${error.message}`);
      return [];
    }
  }

  /**
   * Infer hex color from paint name
   * This is a fallback when color swatches aren't available
   */
  private inferColorFromName(name: string): string {
    const lower = name.toLowerCase();

    // Color keyword mapping
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'titanium white': '#FFFFFF',
      'red': '#D32F2F',
      'pyrrole red': '#B71C1C',
      'bright red': '#EF5350',
      'orange': '#FF6D00',
      'yellow': '#FFD600',
      'bright yellow': '#FFD600',
      'lemon yellow': '#FFF59D',
      'green': '#4CAF50',
      'dark green': '#1B5E20',
      'leaf green': '#4CAF50',
      'bright green': '#76FF03',
      'cyan': '#00BCD4',
      'blue': '#1976D2',
      'dark blue': '#0D47A1',
      'bold blue': '#1976D2',
      'sky blue': '#03A9F4',
      'purple': '#9C27B0',
      'deep purple': '#4A148C',
      'bold purple': '#7B1FA2',
      'violet': '#9C27B0',
      'brown': '#5D4037',
      'burnt umber': '#3E2723',
      'burnt sienna': '#5D4037',
      'raw sienna': '#A1887F',
      'buff': '#D7CCC8',
      'grey': '#757575',
      'gray': '#757575',
      'dark grey': '#424242',
      'light grey': '#BDBDBD',
      'flesh': '#FFAB91',
      'pale flesh': '#FFE0B2',
      'medium flesh': '#FFAB91',
      'dark flesh': '#D7955B',
    };

    // Check for color keywords
    for (const [keyword, hex] of Object.entries(colorMap)) {
      if (lower.includes(keyword)) {
        return hex;
      }
    }

    // Default to medium gray if no color found
    return '#808080';
  }

  /**
   * Infer paint type from name
   */
  private inferTypeFromName(name: string): any {
    const lower = name.toLowerCase();

    if (lower.includes('transparent') || lower.includes('medium')) {
      return 'technical';
    }

    // ProAcryl doesn't have strict categories, most are layer paints
    return 'layer';
  }
}
