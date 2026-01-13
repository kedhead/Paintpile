import { BasePaintSetScraper, ScrapedPaintSet, PaintSetScraperResult } from './paint-set-scraper-base';
import * as cheerio from 'cheerio';
import { getAnthropicClient } from '../ai/anthropic-client';

/**
 * Monument Hobbies ProAcryl Paint Set Scraper (AI-Enhanced)
 * Uses Claude AI to intelligently extract paint names from product pages
 *
 * Target: https://monumenthobbies.com/collections/pro-acryl-paints
 */
export class MonumentSetScraperAI extends BasePaintSetScraper {
  private aiClient: ReturnType<typeof getAnthropicClient> | null = null;

  constructor() {
    super('ProAcryl', 'https://monumenthobbies.com');
  }

  /**
   * Lazy-initialize AI client (after env vars are loaded)
   */
  private getAIClient(): ReturnType<typeof getAnthropicClient> {
    if (!this.aiClient) {
      this.aiClient = getAnthropicClient();
    }
    return this.aiClient;
  }

  async scrape(): Promise<PaintSetScraperResult> {
    try {
      console.log('Starting Monument Hobbies paint set scraping (AI-enhanced)...');

      const sets = await this.scrapeProAcrylSets();

      console.log(`Successfully scraped ${sets.length} ProAcryl paint sets`);

      return this.createResult(sets);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  /**
   * Scrape all ProAcryl paint sets
   */
  private async scrapeProAcrylSets(): Promise<ScrapedPaintSet[]> {
    try {
      const url = `${this.baseUrl}/collections/pro-acryl-paints`;
      console.log(`Fetching ${url}`);
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      const sets: ScrapedPaintSet[] = [];

      // Monument uses Shopify, look for product cards
      $('.product-item, .grid-product, .product-card, [class*="product"]').each((_, element) => {
        try {
          const $element = $(element);

          // Extract product name from various possible selectors
          const name = $element.find('.product-title, .product-item__title, .product-card__title, h3.product, h2.product')
            .first()
            .text()
            .trim();

          // Extract product link
          const linkElement = $element.find('a[href*="/products/"]').first();
          const link = linkElement.attr('href');

          if (!name || !link || !this.isPaintSet(name)) return;

          // Extract image
          const imageUrl = $element.find('img').first().attr('src');

          console.log(`Found set: ${name}`);

          sets.push({
            setName: this.normalizeSetName(name),
            brand: 'ProAcryl',
            paintNames: [], // Will be filled by AI extraction
            sourceUrl: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
            paintCount: this.extractPaintCountFromName(name),
            imageUrl: imageUrl?.startsWith('//') ? `https:${imageUrl}` : imageUrl,
          });
        } catch (error: any) {
          // Silently skip invalid items
        }
      });

      if (sets.length === 0) {
        this.logError('No paint sets found on collections page');
        return [];
      }

      console.log(`\nFound ${sets.length} sets, now extracting paint names with AI...\n`);

      // Now use AI to extract paint names from each product page
      const detailedSets = [];
      for (const set of sets) {
        const detailed = await this.scrapeSetDetailsWithAI(set);
        detailedSets.push(detailed);

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return detailedSets;
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

    // Must contain "set"
    if (!lower.includes('set')) return false;

    // Exclude certain products
    if (lower.includes('brush')) return false;
    if (lower.includes('tool')) return false;

    return true;
  }

  /**
   * Extract paint count from set name
   */
  private extractPaintCountFromName(name: string): number {
    const match = name.match(/(\d+)[- ]?(color|paint|bottle)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  /**
   * Scrape set details using AI to extract paint names
   */
  private async scrapeSetDetailsWithAI(set: ScrapedPaintSet): Promise<ScrapedPaintSet> {
    try {
      console.log(`Scraping ${set.setName}...`);

      const html = await this.fetchHTML(set.sourceUrl);
      const $ = cheerio.load(html);

      // Extract the full product description
      const description = $('.product-description, .product__description, [class*="description"]')
        .first()
        .text()
        .trim();

      set.description = description.substring(0, 200);

      if (!description) {
        console.log(`  ⚠️  No description found for ${set.setName}`);
        return set;
      }

      // Use Claude AI to extract paint names
      console.log(`  🤖 Using AI to extract paint names...`);
      const paintNames = await this.extractPaintNamesWithAI(set.setName, description);

      set.paintNames = paintNames;
      if (paintNames.length > 0 && set.paintCount === 0) {
        set.paintCount = paintNames.length;
      }

      console.log(`  ✅ Found ${paintNames.length} paints`);

      return set;
    } catch (error: any) {
      this.logError(`Failed to scrape details for ${set.setName}: ${error.message}`);
      return set;
    }
  }

  /**
   * Use Claude AI to extract paint names from product description
   */
  private async extractPaintNamesWithAI(setName: string, description: string): Promise<string[]> {
    try {
      const prompt = `Extract the list of paint names from this product description for "${setName}".

Product Description:
${description}

Instructions:
1. Extract ONLY the paint color names (e.g., "Bold Titanium White", "Dark Blue", "Silver")
2. Ignore navigation items, product features, and marketing text
3. Ignore items like "Colors include", "Includes", "Set contains"
4. Return each paint name on a new line
5. If the description lists actual paint names, extract them
6. If it just describes the set without listing specific paints, return "NO PAINTS LISTED"

Paint Names (one per line):`;

      const rawText = await this.getAIClient().callAPI({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (rawText.includes('NO PAINTS LISTED')) {
        return [];
      }

      // Parse paint names from AI response
      const paintNames = rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('Paint Names'))
        .filter(line => this.looksLikePaintName(line))
        .map(line => this.normalizePaintName(line));

      return [...new Set(paintNames)]; // Remove duplicates
    } catch (error: any) {
      console.error(`AI extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if text looks like a paint name
   */
  private looksLikePaintName(text: string): boolean {
    // Must be reasonable length
    if (text.length < 3 || text.length > 50) return false;

    // Remove common prefixes
    text = text.replace(/^[-•\d.)\s]+/, '');

    // Should not be common UI text
    const lower = text.toLowerCase();
    const skipPatterns = [
      'color', 'paint', 'bottle', 'includes', 'contains', 'features',
      'http', 'www', '@', 'click', 'buy', 'add', 'cart',
      'description', 'review', 'shipping', 'return', 'policy',
      'set contains', 'this set', 'pro acryl',
    ];

    if (skipPatterns.some(pattern => lower.includes(pattern))) {
      return false;
    }

    // Should have word characters
    return /[a-zA-Z]{3,}/.test(text);
  }
}

/**
 * Run the AI-enhanced scraper
 */
export async function scrapeMonumentSetsAI() {
  const scraper = new MonumentSetScraperAI();
  return await scraper.scrape();
}
