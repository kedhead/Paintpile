import { Paint } from './paint';

/**
 * Represents a curated paint set (e.g., "Army Painter Speedpaint 2.0 Mega Set")
 */
export interface PaintSet {
  setId: string;
  setName: string;
  brand: string;
  paintNames: string[];        // Names of paints included in the set
  description?: string;
  releaseYear?: number;
  imageUrl?: string;
  sourceUrl?: string;          // Where this data came from (product page, manual curation, etc.)
  paintCount: number;          // Total number of paints in the set
  isCurated: boolean;          // True if manually verified, false if scraped
}

/**
 * Result of matching a paint set to actual Paint objects from database
 */
export interface ResolvedPaintSet {
  set: PaintSet;
  matchedPaints: Paint[];      // Paints we found in the database
  unmatchedNames: string[];    // Paint names we couldn't find
  matchRate: number;           // Percentage of paints successfully matched (0-100)
}
