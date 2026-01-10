import { PaintSet } from '@/types/paint-set';

export interface ScrapedPaintSet {
  setName: string;
  brand: string;
  paintNames: string[];
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  paintCount: number;
}

export interface PaintSetScraperResult {
  brand: string;
  sets: ScrapedPaintSet[];
  scrapedAt: Date;
  errors: string[];
}

/**
 * Base class for paint set scrapers
 * Scrapes PAINT SETS (not individual paints) from manufacturer websites
 */
export abstract class BasePaintSetScraper {
  protected brand: string;
  protected baseUrl: string;
  protected errors: string[] = [];

  constructor(brand: string, baseUrl: string) {
    this.brand = brand;
    this.baseUrl = baseUrl;
  }

  /**
   * Main scraping method - must be implemented by each scraper
   */
  abstract scrape(): Promise<PaintSetScraperResult>;

  /**
   * Normalize set name (remove extra whitespace, etc.)
   */
  protected normalizeSetName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-'&.]/g, '');
  }

  /**
   * Normalize paint name
   */
  protected normalizePaintName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^-\s*/, '') // Remove leading dashes
      .replace(/^\d+\.\s*/, ''); // Remove leading numbers
  }

  /**
   * Extract paint names from common list formats
   */
  protected extractPaintNames(text: string): string[] {
    const paints: string[] = [];

    // Split by common delimiters
    const lines = text.split(/[\n\r•,]/);

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines or very short entries
      if (trimmed.length < 3) continue;

      // Skip obvious non-paint entries
      if (this.isNonPaintLine(trimmed)) continue;

      // Extract paint name
      const paintName = this.normalizePaintName(trimmed);
      if (paintName.length > 0) {
        paints.push(paintName);
      }
    }

    return paints;
  }

  /**
   * Check if a line is obviously not a paint name
   */
  protected isNonPaintLine(line: string): boolean {
    const lower = line.toLowerCase();

    const skipPatterns = [
      'includes:',
      'contains:',
      'this set',
      'perfect for',
      'features:',
      'description:',
      'specifications:',
      'click here',
      'learn more',
      'add to cart',
      'buy now',
      'price:',
      '$',
      '€',
      '£',
    ];

    return skipPatterns.some(pattern => lower.includes(pattern));
  }

  /**
   * Generate a set ID from name
   */
  protected generateSetId(setName: string): string {
    return setName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Log an error
   */
  protected logError(error: string): void {
    console.error(`[${this.brand} Set Scraper] ${error}`);
    this.errors.push(error);
  }

  /**
   * Create result object
   */
  protected createResult(sets: ScrapedPaintSet[]): PaintSetScraperResult {
    return {
      brand: this.brand,
      sets,
      scrapedAt: new Date(),
      errors: this.errors,
    };
  }

  /**
   * Fetch HTML from a URL with error handling
   */
  protected async fetchHTML(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      this.logError(`Failed to fetch ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert scraped set to curated PaintSet format
   */
  protected toPaintSet(scraped: ScrapedPaintSet): PaintSet {
    return {
      setId: this.generateSetId(`${this.brand}-${scraped.setName}`),
      setName: scraped.setName,
      brand: scraped.brand,
      paintNames: scraped.paintNames,
      description: scraped.description,
      imageUrl: scraped.imageUrl,
      sourceUrl: scraped.sourceUrl,
      paintCount: scraped.paintCount,
      isCurated: false, // Scraped sets are not manually verified
    };
  }
}
