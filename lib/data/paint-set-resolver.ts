import { Paint } from '@/types/paint';
import { PaintSet, ResolvedPaintSet } from '@/types/paint-set';

/**
 * Resolve a paint set by matching paint names to actual Paint objects
 */
export function resolvePaintSet(
  paintSet: PaintSet,
  allPaints: Paint[]
): ResolvedPaintSet {
  const matchedPaints: Paint[] = [];
  const unmatchedNames: string[] = [];

  // Normalize function for fuzzy matching
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Create a lookup map for faster searching
  const paintMap = new Map<string, Paint>();
  allPaints.forEach(paint => {
    const key = normalize(`${paint.brand} ${paint.name}`);
    paintMap.set(key, paint);

    // Also add just the name for matching
    const nameKey = normalize(paint.name);
    if (!paintMap.has(nameKey)) {
      paintMap.set(nameKey, paint);
    }
  });

  // Try to match each paint name from the set
  for (const paintName of paintSet.paintNames) {
    let found = false;

    // Try 1: Exact match with brand + name
    const fullKey = normalize(`${paintSet.brand} ${paintName}`);
    if (paintMap.has(fullKey)) {
      matchedPaints.push(paintMap.get(fullKey)!);
      found = true;
    }

    // Try 2: Just the paint name
    if (!found) {
      const nameKey = normalize(paintName);
      if (paintMap.has(nameKey)) {
        const paint = paintMap.get(nameKey)!;
        // Make sure brand matches or is related
        if (brandsMatch(paintSet.brand, paint.brand)) {
          matchedPaints.push(paint);
          found = true;
        }
      }
    }

    // Try 3: Fuzzy search through all paints of the same brand
    if (!found) {
      const brandPaints = allPaints.filter(p =>
        brandsMatch(paintSet.brand, p.brand)
      );

      const normalizedName = normalize(paintName);
      const fuzzyMatch = brandPaints.find(p => {
        const pName = normalize(p.name);
        // Check if either contains the other
        return pName.includes(normalizedName) || normalizedName.includes(pName);
      });

      if (fuzzyMatch) {
        matchedPaints.push(fuzzyMatch);
        found = true;
      }
    }

    // If still not found, add to unmatched list
    if (!found) {
      unmatchedNames.push(paintName);
    }
  }

  // Calculate match rate
  const matchRate = paintSet.paintNames.length > 0
    ? (matchedPaints.length / paintSet.paintNames.length) * 100
    : 0;

  return {
    set: paintSet,
    matchedPaints,
    unmatchedNames,
    matchRate,
  };
}

/**
 * Check if two brand names match (accounting for variations)
 */
function brandsMatch(brand1: string, brand2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const b1 = normalize(brand1);
  const b2 = normalize(brand2);

  // Exact match
  if (b1 === b2) return true;

  // One contains the other
  if (b1.includes(b2) || b2.includes(b1)) return true;

  // Known equivalents
  const equivalents: Record<string, string[]> = {
    'armypainter': ['armypainter', 'thearmypainter'],
    'citadel': ['citadel', 'gamesworkshop', 'gw'],
    'vallejo': ['vallejo', 'vallejomodelcolor', 'vallejogamecolor'],
    'reaper': ['reaper', 'reapermsp', 'reaperminiatures'],
    'scale75': ['scale75', 'scale', 'scalecolor'],
  };

  for (const [key, variants] of Object.entries(equivalents)) {
    if (variants.includes(b1) && variants.includes(b2)) {
      return true;
    }
  }

  return false;
}

/**
 * Batch resolve multiple paint sets
 */
export function resolvePaintSets(
  paintSets: PaintSet[],
  allPaints: Paint[]
): ResolvedPaintSet[] {
  return paintSets.map(set => resolvePaintSet(set, allPaints));
}

/**
 * Get statistics about paint set coverage
 */
export function getPaintSetCoverage(
  paintSets: PaintSet[],
  allPaints: Paint[]
): {
  totalSets: number;
  totalPaintsInSets: number;
  averageMatchRate: number;
  setsByBrand: Record<string, number>;
} {
  const resolved = resolvePaintSets(paintSets, allPaints);

  const totalSets = paintSets.length;
  const totalPaintsInSets = paintSets.reduce((sum, set) => sum + set.paintCount, 0);
  const averageMatchRate = resolved.reduce((sum, r) => sum + r.matchRate, 0) / resolved.length;

  const setsByBrand: Record<string, number> = {};
  paintSets.forEach(set => {
    setsByBrand[set.brand] = (setsByBrand[set.brand] || 0) + 1;
  });

  return {
    totalSets,
    totalPaintsInSets,
    averageMatchRate,
    setsByBrand,
  };
}
