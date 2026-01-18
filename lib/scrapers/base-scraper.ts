import { PaintType } from '@/types/paint';

export interface ScrapedPaint {
  brand: string;
  name: string;
  hexColor: string;
  type: PaintType;
  sourceUrl: string;
  swatchUrl?: string;
  category?: string;
  imageUrl?: string;
}

export interface ScraperResult {
  brand: string;
  paints: ScrapedPaint[];
  scrapedAt: Date;
  errors: string[];
}

/**
 * Base class for paint scrapers
 * Provides common functionality for all brand-specific scrapers
 */
export abstract class BasePaintScraper {
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
  abstract scrape(): Promise<ScraperResult>;

  /**
   * Normalize paint name (remove extra whitespace, etc.)
   */
  protected normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-']/g, '');
  }

  /**
   * Validate hex color format
   */
  protected validateHexColor(hex: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  /**
   * Normalize hex color (ensure # prefix and uppercase)
   */
  protected normalizeHexColor(hex: string): string {
    hex = hex.trim();
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    return hex.toUpperCase();
  }

  /**
   * Map common paint type keywords to our PaintType enum
   */
  protected mapPaintType(typeString: string): PaintType {
    const lower = typeString.toLowerCase();

    if (lower.includes('base') || lower.includes('foundation')) {
      return 'base';
    }
    if (lower.includes('layer') || lower.includes('highlight')) {
      return 'layer';
    }
    if (lower.includes('shade') || lower.includes('wash') || lower.includes('ink')) {
      return 'shade';
    }
    if (lower.includes('metallic') || lower.includes('metal')) {
      return 'metallic';
    }
    if (lower.includes('contrast') || lower.includes('speed paint')) {
      return 'contrast';
    }
    if (lower.includes('technical') || lower.includes('texture')) {
      return 'technical';
    }

    // Default to layer if unknown
    return 'layer';
  }

  /**
   * Extract RGB from hex color
   */
  protected hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : null;
  }

  /**
   * Calculate brightness of a color (for auto-categorization)
   */
  protected getColorBrightness(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 128;

    // Using perceived brightness formula
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  }

  /**
   * Log an error
   */
  protected logError(error: string): void {
    console.error(`[${this.brand} Scraper] ${error}`);
    this.errors.push(error);
  }

  /**
   * Create result object
   */
  protected createResult(paints: ScrapedPaint[]): ScraperResult {
    return {
      brand: this.brand,
      paints,
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
}
