import { BasePaintSetScraper, ScrapedPaintSet, PaintSetScraperResult } from './paint-set-scraper-base';
import * as cheerio from 'cheerio';
import { getAnthropicClient } from '../ai/anthropic-client';

/**
 * Army Painter Paint Set Scraper (AI-Enhanced)
 * Scrapes paint sets from Army Painter website
 *
 * Target: https://www.thearmypainter.com/shop/us/paint-sets
 */
export class ArmyPainterSetScraperAI extends BasePaintSetScraper {
  private aiClient: ReturnType<typeof getAnthropicClient> | null = null;

  constructor() {
    super('Army Painter', 'https://thearmypainter.com');
  }

  private getAIClient(): ReturnType<typeof getAnthropicClient> {
    if (!this.aiClient) {
      this.aiClient = getAnthropicClient();
    }
    return this.aiClient;
  }

  async scrape(): Promise<PaintSetScraperResult> {
    try {
      console.log('Starting Army Painter paint set scraping (AI-enhanced)...');

      const sets = await this.scrapeArmyPainterSets();

      console.log(`Successfully scraped ${sets.length} Army Painter paint sets`);

      return this.createResult(sets);
    } catch (error: any) {
      this.logError(`Scraping failed: ${error.message}`);
      return this.createResult([]);
    }
  }

  private async scrapeArmyPainterSets(): Promise<ScrapedPaintSet[]> {
    try {
      const collectionUrls = [
        `https://thearmypainter.com/collections/all-paint-sets`,
        `https://thearmypainter.com/collections/warpaints-fanatic-boxed-sets`,
        `https://thearmypainter.com/collections/warpaints-air-sets`,
        `https://thearmypainter.com/collections/speedpaint-sets`,
      ];

      let sets: ScrapedPaintSet[] = [];

      for (const url of collectionUrls) {
        try {
          console.log(`Trying URL: ${url}`);
          const html = await this.fetchHTML(url);
          const $ = cheerio.load(html);

          $('.product-item, .product-card, .product').each((_, element) => {
            try {
              const $element = $(element);
              const name = $element.find('.product-title, h2, h3').first().text().trim();
              const link = $element.find('a').first().attr('href');

              if (!name || !link || !this.isPaintSet(name)) return;

              const imageUrl = $element.find('img').first().attr('src');

              console.log(`Found set: ${name}`);

              sets.push({
                setName: this.normalizeSetName(name),
                brand: 'Army Painter',
                paintNames: [],
                sourceUrl: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
                paintCount: this.extractPaintCountFromName(name),
                imageUrl: imageUrl?.startsWith('//') ? `https:${imageUrl}` : imageUrl,
              });
            } catch (error: any) {
              // Skip invalid items
            }
          });

          if (sets.length > 0) break;
        } catch (error: any) {
          console.log(`Failed to fetch ${url}: ${error.message}`);
        }
      }

      console.log(`\nFound ${sets.length} sets, extracting paint names with AI...\n`);

      const detailedSets = [];
      for (const set of sets) {
        const detailed = await this.scrapeSetDetailsWithAI(set);
        detailedSets.push(detailed);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return detailedSets;
    } catch (error: any) {
      this.logError(`Failed to scrape Army Painter sets: ${error.message}`);
      return [];
    }
  }

  private isPaintSet(name: string): boolean {
    const lower = name.toLowerCase();
    if (!lower.includes('set') && !lower.includes('pack')) return false;
    if (lower.includes('brush') || lower.includes('tool')) return false;
    return true;
  }

  private extractPaintCountFromName(name: string): number {
    const match = name.match(/(\d+)[- ]?(color|paint|bottle)/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  private async scrapeSetDetailsWithAI(set: ScrapedPaintSet): Promise<ScrapedPaintSet> {
    try {
      console.log(`Scraping ${set.setName}...`);
      const html = await this.fetchHTML(set.sourceUrl);
      const $ = cheerio.load(html);

      const description = $('.product-description, .description, [class*="description"]')
        .first()
        .text()
        .trim()
        .substring(0, 200);

      set.description = description || set.setName;

      if (!description) {
        console.log(`  ⚠️  No description found`);
        return set;
      }

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

  private async extractPaintNamesWithAI(setName: string, description: string): Promise<string[]> {
    try {
      const prompt = `Extract paint names from this Army Painter set: "${setName}"

Description:
${description}

Instructions:
1. Extract ONLY paint color names
2. Ignore navigation, features, marketing text
3. Return each paint name on a new line
4. If no specific paints listed, return "NO PAINTS LISTED"

Paint Names:`;

      const rawText = await this.getAIClient().callAPI({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      if (rawText.includes('NO PAINTS LISTED')) return [];

      const paintNames = rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => this.looksLikePaintName(line))
        .map(line => this.normalizePaintName(line));

      return [...new Set(paintNames)];
    } catch (error: any) {
      console.error(`AI extraction failed: ${error.message}`);
      return [];
    }
  }

  private looksLikePaintName(text: string): boolean {
    if (text.length < 3 || text.length > 50) return false;

    const lower = text.toLowerCase();
    const skipPatterns = [
      'color', 'paint', 'bottle', 'includes', 'contains',
      'http', 'www', '@', 'click', 'buy', 'add', 'cart',
    ];

    return !skipPatterns.some(pattern => lower.includes(pattern)) && /[a-zA-Z]{3,}/.test(text);
  }
}
