import { BasePaintSetScraper, ScrapedPaintSet, PaintSetScraperResult } from './paint-set-scraper-base';
import * as cheerio from 'cheerio';

/**
 * Monument Hobbies ProAcryl Paint Set Scraper
 * Scrapes paint SET data from Monument Hobbies website
 *
 * Target: https://monumenthobbies.com/collections/pro-acryl-sets
 */
export class MonumentSetScraper extends BasePaintSetScraper {
  constructor() {
    super('ProAcryl', 'https://monumenthobbies.com');
  }

  async scrape(): Promise<PaintSetScraperResult> {
    try {
      console.log('Starting Monument Hobbies paint set scraping...');

      const sets = await this.scrapeProAcrylSets();

      console.log(`Successfully scraped ${sets.length} ProAcryl paint sets`);

      return this.createResult(sets);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape all ProAcryl paint sets from the collections page
   */
  private async scrapeProAcrylSets(): Promise<ScrapedPaintSet[]> {
    try {
      // Try multiple potential collection URLs
      const collectionUrls = [
        `${this.baseUrl}/collections/pro-acryl-sets`,
        `${this.baseUrl}/collections/paint-sets`,
        `${this.baseUrl}/collections/pro-acryl-paints`,
      ];

      let sets: ScrapedPaintSet[] = [];

      for (const url of collectionUrls) {
        try {
          console.log(`Trying URL: ${url}`);
          const html = await this.fetchHTML(url);
          const $ = cheerio.load(html);

          // Monument uses Shopify, look for product grid items
          $('.product-item, .grid-product, .product-card').each((_, element) => {
            try {
              const $element = $(element);

              // Extract product name
              const name = $element.find('.product-title, .product-item__title, .product-card__title, h3, h2').text().trim();

              // Extract product link
              const linkElement = $element.find('a').first();
              const link = linkElement.attr('href');

              // Extract image
              const imageUrl = $element.find('img').first().attr('src');

              if (!name || !link) return;

              // Only process if it appears to be a paint set (not individual paints)
              if (!this.isPaintSet(name)) return;

              console.log(`Found set: ${name}`);

              sets.push({
                setName: this.normalizeSetName(name),
                brand: 'ProAcryl',
                paintNames: [], // Will be filled by detail scraping
                sourceUrl: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
                paintCount: this.extractPaintCountFromName(name),
                imageUrl: imageUrl?.startsWith('http') ? imageUrl : (imageUrl ? `https:${imageUrl}` : undefined),
              });
            } catch (error: any) {
              this.logError(`Error parsing set item: ${error.message}`);
            }
          });

          if (sets.length > 0) {
            console.log(`Found ${sets.length} sets at ${url}`);
            break; // Stop trying URLs once we find sets
          }
        } catch (error: any) {
          console.log(`Failed to fetch ${url}: ${error.message}`);
          // Continue to next URL
        }
      }

      // Now scrape detailed info for each set
      const detailedSets = await Promise.all(
        sets.map(set => this.scrapeSetDetails(set))
      );

      return detailedSets.filter(set => set.paintNames.length > 0);
    } catch (error: any) {
      this.logError(`Failed to scrape ProAcryl sets: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if a product name is likely a paint set
   */
  private isPaintSet(name: string): boolean {
    const lower = name.toLowerCase();

    // Include if it has "set" keyword
    if (lower.includes('set')) return true;

    // Include if it has "bundle" or "collection"
    if (lower.includes('bundle') || lower.includes('collection')) return true;

    // Exclude individual paints
    if (lower.includes('single') || lower.includes('individual')) return false;

    // Include if it mentions multiple items (e.g., "12 pack", "24 colors")
    if (/\d+\s*(pack|colors?|paints?|bottles?)/i.test(lower)) return true;

    return false;
  }

  /**
   * Extract paint count from set name (e.g., "24-Color Set" -> 24)
   */
  private extractPaintCountFromName(name: string): number {
    const match = name.match(/(\d+)[- ](color|paint|bottle)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  /**
   * Scrape detailed information about a specific set
   */
  private async scrapeSetDetails(set: ScrapedPaintSet): Promise<ScrapedPaintSet> {
    try {
      console.log(`Scraping details for: ${set.setName}`);
      const html = await this.fetchHTML(set.sourceUrl);
      const $ = cheerio.load(html);

      // Extract description
      const description = $('.product-description, .product__description, [class*="description"]')
        .first()
        .text()
        .trim()
        .split('\n')[0] // First paragraph only
        .substring(0, 200); // Max 200 chars

      set.description = description || set.setName;

      // Extract paint names from various possible locations
      const paintNames: string[] = [];

      // Method 1: Look for bulleted lists
      $('ul li, ol li').each((_, el) => {
        const text = $(el).text().trim();
        if (this.looksLikePaintName(text)) {
          const normalized = this.normalizePaintName(text);
          if (normalized && !paintNames.includes(normalized)) {
            paintNames.push(normalized);
          }
        }
      });

      // Method 2: Look for comma-separated lists in paragraphs
      if (paintNames.length === 0) {
        $('p, .description, [class*="description"]').each((_, el) => {
          const text = $(el).text();

          // Check if paragraph contains "includes:" or similar
          if (/includes?:|contains?:|features?:/i.test(text)) {
            const extracted = this.extractPaintNames(text);
            extracted.forEach(name => {
              if (!paintNames.includes(name)) {
                paintNames.push(name);
              }
            });
          }
        });
      }

      // Method 3: Look in table format
      if (paintNames.length === 0) {
        $('table td, table th').each((_, el) => {
          const text = $(el).text().trim();
          if (this.looksLikePaintName(text)) {
            const normalized = this.normalizePaintName(text);
            if (normalized && !paintNames.includes(normalized)) {
              paintNames.push(normalized);
            }
          }
        });
      }

      set.paintNames = paintNames;

      // Update paint count if we found more accurate info
      if (paintNames.length > 0 && set.paintCount === 0) {
        set.paintCount = paintNames.length;
      }

      console.log(`Found ${paintNames.length} paints in ${set.setName}`);

      return set;
    } catch (error: any) {
      this.logError(`Failed to scrape details for ${set.setName}: ${error.message}`);
      return set; // Return original set even if detail scraping fails
    }
  }

  /**
   * Check if text looks like a paint name
   */
  private looksLikePaintName(text: string): boolean {
    // Must be reasonable length
    if (text.length < 3 || text.length > 50) return false;

    // Should not be common UI text
    const lower = text.toLowerCase();
    const skipPatterns = [
      'add to cart',
      'buy now',
      'view details',
      'learn more',
      'in stock',
      'out of stock',
      'description',
      'reviews',
      'shipping',
      'return',
      '$', '€', '£',
      'quantity',
      'share',
      'save',
    ];

    if (skipPatterns.some(pattern => lower.includes(pattern))) {
      return false;
    }

    // Should have word characters
    return /[a-zA-Z]{3,}/.test(text);
  }
}

/**
 * Run the scraper and output results
 */
export async function scrapeMonumentSets() {
  const scraper = new MonumentSetScraper();
  const result = await scraper.scrape();

  console.log('\n=== SCRAPING RESULTS ===');
  console.log(`Brand: ${result.brand}`);
  console.log(`Sets found: ${result.sets.length}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Scraped at: ${result.scrapedAt.toISOString()}`);

  if (result.errors.length > 0) {
    console.log('\n=== ERRORS ===');
    result.errors.forEach(error => console.log(`- ${error}`));
  }

  console.log('\n=== SETS ===');
  result.sets.forEach(set => {
    console.log(`\n${set.setName} (${set.paintCount} paints)`);
    console.log(`  URL: ${set.sourceUrl}`);
    console.log(`  Paints: ${set.paintNames.length > 0 ? set.paintNames.join(', ') : 'None found'}`);
  });

  return result;
}
