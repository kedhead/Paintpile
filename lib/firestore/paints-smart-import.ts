import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Paint } from '@/types/paint';

/**
 * Generate a deterministic paint ID from brand and name
 * This ensures we can check for duplicates and avoid creating them
 */
export function generatePaintId(brand: string, name: string): string {
  const normalized = `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized;
}

/**
 * Check if a paint already exists in the database
 */
export async function paintExists(brand: string, name: string): Promise<boolean> {
  const paintId = generatePaintId(brand, name);
  const paintsRef = collection(db, 'paints');
  const paintDoc = doc(paintsRef, paintId);

  try {
    const snapshot = await getDocs(query(paintsRef, where('paintId', '==', paintId)));
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if paint exists:', error);
    return false;
  }
}

/**
 * Get existing paints as a Map for quick lookup
 */
export async function getExistingPaintsMap(): Promise<Map<string, Paint>> {
  const paintsRef = collection(db, 'paints');
  const snapshot = await getDocs(paintsRef);

  const paintsMap = new Map<string, Paint>();
  snapshot.docs.forEach(doc => {
    const paint = doc.data() as Paint;
    const key = `${paint.brand.toLowerCase()}|${paint.name.toLowerCase()}`;
    paintsMap.set(key, paint);
  });

  return paintsMap;
}

/**
 * Smart import: Only add paints that don't already exist
 * Returns counts of added, skipped, and updated paints
 */
export async function smartImportPaints(
  paints: Omit<Paint, 'paintId'>[],
  options: {
    updateExisting?: boolean; // If true, update existing paints with new data
    dryRun?: boolean; // If true, only report what would happen without writing
  } = {}
): Promise<{
  added: number;
  skipped: number;
  updated: number;
  errors: string[];
  addedPaints: Paint[];
  skippedPaints: Array<{ brand: string; name: string; reason: string }>;
  updatedPaints: Paint[];
}> {
  const { updateExisting = false, dryRun = false } = options;

  const result = {
    added: 0,
    skipped: 0,
    updated: 0,
    errors: [] as string[],
    addedPaints: [] as Paint[],
    skippedPaints: [] as Array<{ brand: string; name: string; reason: string }>,
    updatedPaints: [] as Paint[],
  };

  try {
    // Get all existing paints for quick lookup
    console.log('[Smart Import] Loading existing paints...');
    const existingPaintsMap = await getExistingPaintsMap();
    console.log(`[Smart Import] Found ${existingPaintsMap.size} existing paints`);

    // Categorize paints
    const paintsToAdd: Paint[] = [];
    const paintsToUpdate: Paint[] = [];

    for (const paintData of paints) {
      const key = `${paintData.brand.toLowerCase()}|${paintData.name.toLowerCase()}`;
      const existingPaint = existingPaintsMap.get(key);

      if (existingPaint) {
        if (updateExisting) {
          // Update existing paint with new data
          const updatedPaint: Paint = {
            ...existingPaint,
            ...paintData,
            paintId: existingPaint.paintId, // Keep original ID
          };
          paintsToUpdate.push(updatedPaint);
          result.updatedPaints.push(updatedPaint);
          result.updated++;
        } else {
          // Skip duplicate
          result.skippedPaints.push({
            brand: paintData.brand,
            name: paintData.name,
            reason: 'Already exists',
          });
          result.skipped++;
        }
      } else {
        // New paint - add it
        const paintId = generatePaintId(paintData.brand, paintData.name);
        const newPaint: Paint = {
          ...paintData,
          paintId,
        };
        paintsToAdd.push(newPaint);
        result.addedPaints.push(newPaint);
        result.added++;
      }
    }

    if (dryRun) {
      console.log('[Smart Import] Dry run complete - no changes made');
      return result;
    }

    // Write new paints in batches
    if (paintsToAdd.length > 0) {
      console.log(`[Smart Import] Adding ${paintsToAdd.length} new paints...`);
      const paintsRef = collection(db, 'paints');

      // Firestore batches are limited to 500 operations
      const batchSize = 500;
      for (let i = 0; i < paintsToAdd.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchPaints = paintsToAdd.slice(i, i + batchSize);

        for (const paint of batchPaints) {
          const paintDoc = doc(paintsRef, paint.paintId);
          batch.set(paintDoc, paint);
        }

        await batch.commit();
        console.log(`[Smart Import] Batch ${Math.floor(i / batchSize) + 1} committed`);
      }
    }

    // Update existing paints in batches
    if (paintsToUpdate.length > 0) {
      console.log(`[Smart Import] Updating ${paintsToUpdate.length} existing paints...`);
      const paintsRef = collection(db, 'paints');

      const batchSize = 500;
      for (let i = 0; i < paintsToUpdate.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchPaints = paintsToUpdate.slice(i, i + batchSize);

        for (const paint of batchPaints) {
          const paintDoc = doc(paintsRef, paint.paintId);
          batch.set(paintDoc, paint);
        }

        await batch.commit();
        console.log(`[Smart Import] Update batch ${Math.floor(i / batchSize) + 1} committed`);
      }
    }

    console.log('[Smart Import] Complete!');
    console.log(`  Added: ${result.added}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  Updated: ${result.updated}`);

    return result;
  } catch (error: any) {
    console.error('[Smart Import] Error:', error);
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Import paints from comprehensive database without duplicates
 */
export async function smartSeedPaintDatabase(updateExisting = false): Promise<{
  added: number;
  skipped: number;
  updated: number;
}> {
  const { COMPREHENSIVE_PAINTS } = await import('@/lib/data/comprehensive-paints');

  const result = await smartImportPaints(COMPREHENSIVE_PAINTS, {
    updateExisting,
    dryRun: false,
  });

  return {
    added: result.added,
    skipped: result.skipped,
    updated: result.updated,
  };
}
