/**
 * Color Matcher Utility
 *
 * Matches hex colors to paints in the database using Delta E (CIE76) color difference algorithm.
 * Delta E measures perceptual color difference in LAB color space.
 *
 * Conversion pipeline: HEX → RGB → XYZ → LAB → Delta E calculation
 */

import { Paint } from '@/types/paint';
import { getAllPaints } from '@/lib/firestore/paints';

export interface PaintMatch {
  paint: Paint;
  similarity: number;  // 0-100, where 100 is perfect match
  deltaE: number;      // Lower is better (0 = identical)
}

/**
 * Find paints that match a given hex color
 * @param hexColor - Hex color code (e.g., "#FF5733" or "FF5733")
 * @param maxResults - Maximum number of results to return
 * @returns Array of matching paints sorted by similarity (best first)
 */
export async function findMatchingPaints(
  hexColor: string,
  maxResults: number = 5
): Promise<PaintMatch[]> {
  // Get all paints from database
  const allPaints = await getAllPaints();

  if (allPaints.length === 0) {
    return [];
  }

  // Convert target color to LAB
  const targetLab = hexToLab(hexColor);

  // Calculate Delta E for each paint
  const matches: PaintMatch[] = allPaints.map(paint => {
    const paintLab = hexToLab(paint.hexColor);
    const deltaE = calculateDeltaE(targetLab, paintLab);
    const similarity = deltaEToSimilarity(deltaE);

    return {
      paint,
      similarity,
      deltaE
    };
  });

  // Sort by deltaE (lower is better) and return top matches
  return matches
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, maxResults);
}

/**
 * Convert Delta E to similarity percentage (0-100)
 * Delta E values:
 * - 0-1: Not perceptible by human eyes
 * - 1-2: Perceptible through close observation
 * - 2-10: Perceptible at a glance
 * - 11-49: Colors are more similar than opposite
 * - 50+: Colors are very different
 */
function deltaEToSimilarity(deltaE: number): number {
  if (deltaE === 0) return 100;
  if (deltaE <= 1) return 99;
  if (deltaE <= 2) return 95;
  if (deltaE <= 5) return 90;
  if (deltaE <= 10) return 80;
  if (deltaE <= 20) return 60;
  if (deltaE <= 30) return 40;
  if (deltaE <= 40) return 20;
  return Math.max(0, 10 - (deltaE - 40) / 5);
}

/**
 * Calculate Delta E (CIE76) between two LAB colors
 * Formula: sqrt((L2-L1)² + (a2-a1)² + (b2-b1)²)
 */
export function calculateDeltaE(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number }
): number {
  const deltaL = lab2.L - lab1.L;
  const deltaA = lab2.a - lab1.a;
  const deltaB = lab2.b - lab1.b;

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Convert hex color to LAB color space
 */
export function hexToLab(hex: string): { L: number; a: number; b: number } {
  const rgb = hexToRgb(hex);
  const xyz = rgbToXyz(rgb);
  return xyzToLab(xyz);
}

/**
 * Convert hex to RGB (0-255)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB (0-255) to XYZ color space
 * Uses D65 illuminant (standard daylight)
 */
function rgbToXyz(rgb: { r: number; g: number; b: number }): { x: number; y: number; z: number } {
  // Normalize RGB to 0-1
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Apply gamma correction (sRGB)
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Multiply by 100
  r *= 100;
  g *= 100;
  b *= 100;

  // Convert to XYZ using D65 illuminant matrix
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return { x, y, z };
}

/**
 * Convert XYZ to LAB color space
 * Uses D65 reference white
 */
function xyzToLab(xyz: { x: number; y: number; z: number }): { L: number; a: number; b: number } {
  // D65 reference white
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  // Normalize to reference white
  let x = xyz.x / refX;
  let y = xyz.y / refY;
  let z = xyz.z / refZ;

  // Apply Lab transformation function
  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1/3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1/3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1/3) : (kappa * z + 16) / 116;

  // Calculate LAB values
  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return { L, a, b };
}

/**
 * Helper function to get paint matches by role
 * Useful for grouping suggestions by base/highlight/shadow
 */
export async function findMatchesByRole(
  colors: Array<{ hex: string; location?: string }>,
  matchesPerColor: number = 3
): Promise<Record<string, PaintMatch[]>> {
  const results: Record<string, PaintMatch[]> = {};

  for (const color of colors) {
    const matches = await findMatchingPaints(color.hex, matchesPerColor);
    const role = color.location || 'general';
    results[role] = matches;
  }

  return results;
}
