import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Paint } from '@/types/paint';
import { COMPREHENSIVE_PAINTS } from '@/lib/data/comprehensive-paints';

/**
 * Get all paints from the global database
 */
export async function getAllPaints(): Promise<Paint[]> {
  const paintsRef = collection(db, 'paints');

  const querySnapshot = await getDocs(paintsRef);
  const paints = querySnapshot.docs.map((doc) => doc.data() as Paint);

  // Sort in memory instead of using Firestore orderBy (avoids needing composite index)
  return paints.sort((a, b) => {
    if (a.brand !== b.brand) {
      return a.brand.localeCompare(b.brand);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get paints by brand
 */
export async function getPaintsByBrand(brand: string): Promise<Paint[]> {
  const paintsRef = collection(db, 'paints');
  const q = query(paintsRef, where('brand', '==', brand));

  const querySnapshot = await getDocs(q);
  const paints = querySnapshot.docs.map((doc) => doc.data() as Paint);

  // Sort by name in memory
  return paints.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search paints by name
 */
export async function searchPaints(searchTerm: string): Promise<Paint[]> {
  const paints = await getAllPaints();
  const lowerSearch = searchTerm.toLowerCase();

  return paints.filter(
    (paint) =>
      paint.name.toLowerCase().includes(lowerSearch) ||
      paint.brand.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Get paints by IDs
 */
export async function getPaintsByIds(paintIds: string[]): Promise<Paint[]> {
  if (paintIds.length === 0) return [];

  const paints = await getAllPaints();
  return paints.filter((paint) => paintIds.includes(paint.paintId));
}

/**
 * Seed the paint database (run once)
 * Comprehensive database with 500+ paints from major miniature paint brands
 */
export async function seedPaintDatabase(): Promise<number> {
  const paintsRef = collection(db, 'paints');

  // 1. Load existing paints to prevent duplicates
  const existingSnapshot = await getDocs(paintsRef);
  const existingMap = new Set<string>();

  existingSnapshot.docs.forEach(doc => {
    const data = doc.data() as Paint;
    // Create unique key for brand+name
    if (data.brand && data.name) {
      existingMap.add(`${data.brand.toLowerCase()}:${data.name.toLowerCase()}`);
    }
  });

  console.log(`[Seed] Found ${existingMap.size} existing paints.`);

  let count = 0;

  // 2. Add only missing paints
  for (const paint of COMPREHENSIVE_PAINTS) {
    const key = `${paint.brand.toLowerCase()}:${paint.name.toLowerCase()}`;

    if (!existingMap.has(key)) {
      const paintRef = doc(paintsRef);
      await setDoc(paintRef, {
        paintId: paintRef.id,
        ...paint,
      });
      count++;
    }
  }

  return count;
}
