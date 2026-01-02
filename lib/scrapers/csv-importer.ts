import { PaintType } from '@/types/paint';
import { ScrapedPaint } from './base-scraper';

/**
 * CSV Paint Importer
 * Import paint data from CSV files
 *
 * Expected CSV format:
 * brand,name,hexColor,type
 * Citadel,Abaddon Black,#000000,base
 * Vallejo Model Color,Black,#000000,base
 */
export class CSVPaintImporter {
  /**
   * Parse CSV text into paint objects
   */
  static parsePaintsFromCSV(csvText: string): ScrapedPaint[] {
    const paints: ScrapedPaint[] = [];
    const lines = csvText.split('\n');

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const paint = this.parseLine(line);
        if (paint) {
          paints.push(paint);
        }
      } catch (error: any) {
        console.error(`Error parsing line ${i + 1}: ${error.message}`);
      }
    }

    return paints;
  }

  /**
   * Parse a single CSV line
   */
  private static parseLine(line: string): ScrapedPaint | null {
    // Handle quoted fields and commas within quotes
    const fields = this.parseCSVLine(line);

    if (fields.length < 4) {
      throw new Error('Invalid CSV format: expected at least 4 fields');
    }

    const [brand, name, hexColor, type] = fields;

    // Validate required fields
    if (!brand || !name || !hexColor || !type) {
      throw new Error('Missing required field');
    }

    // Validate hex color
    const normalizedHex = this.normalizeHexColor(hexColor);
    if (!this.validateHexColor(normalizedHex)) {
      throw new Error(`Invalid hex color: ${hexColor}`);
    }

    // Validate paint type
    const paintType = this.validatePaintType(type);
    if (!paintType) {
      throw new Error(`Invalid paint type: ${type}`);
    }

    return {
      brand: brand.trim(),
      name: name.trim(),
      hexColor: normalizedHex,
      type: paintType,
    };
  }

  /**
   * Parse CSV line handling quoted fields
   */
  private static parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Add last field
    fields.push(currentField);

    return fields;
  }

  /**
   * Normalize hex color
   */
  private static normalizeHexColor(hex: string): string {
    hex = hex.trim();
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    return hex.toUpperCase();
  }

  /**
   * Validate hex color format
   */
  private static validateHexColor(hex: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  /**
   * Validate and convert paint type string
   */
  private static validatePaintType(type: string): PaintType | null {
    const lower = type.toLowerCase().trim();

    const typeMap: Record<string, PaintType> = {
      base: 'base',
      layer: 'layer',
      shade: 'shade',
      wash: 'shade',
      metallic: 'metallic',
      metal: 'metallic',
      contrast: 'contrast',
      technical: 'technical',
      texture: 'technical',
    };

    return typeMap[lower] || null;
  }

  /**
   * Generate CSV template
   */
  static generateTemplate(): string {
    return `brand,name,hexColor,type
Citadel,Abaddon Black,#000000,base
Citadel,Corax White,#FFFFFF,base
Vallejo Model Color,Black,#000000,base
Army Painter,Matt Black,#000000,base`;
  }

  /**
   * Export paints to CSV format
   */
  static exportToPaintsCSV(paints: ScrapedPaint[]): string {
    const header = 'brand,name,hexColor,type';
    const rows = paints.map((paint) => {
      const name = paint.name.includes(',') ? `"${paint.name}"` : paint.name;
      return `${paint.brand},${name},${paint.hexColor},${paint.type}`;
    });

    return [header, ...rows].join('\n');
  }
}
