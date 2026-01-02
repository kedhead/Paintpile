import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Paint, CustomPaint } from '@/types/paint';

/**
 * Create a custom paint for a user
 */
export async function createCustomPaint(
  userId: string,
  brand: string,
  name: string,
  hexColor: string,
  type: 'base' | 'layer' | 'shade' | 'metallic' | 'technical' | 'contrast'
): Promise<string> {
  const customPaintsRef = collection(db, 'customPaints');
  const newPaintRef = doc(customPaintsRef);

  const customPaint: Omit<CustomPaint, 'createdAt'> & { createdAt: any } = {
    paintId: newPaintRef.id,
    userId,
    brand,
    name,
    hexColor,
    type,
    createdAt: serverTimestamp(),
  };

  await setDoc(newPaintRef, customPaint);
  return newPaintRef.id;
}

/**
 * Get all custom paints for a user
 */
export async function getUserCustomPaints(userId: string): Promise<CustomPaint[]> {
  const customPaintsRef = collection(db, 'customPaints');
  const q = query(customPaintsRef, where('userId', '==', userId));

  const querySnapshot = await getDocs(q);
  const customPaints = querySnapshot.docs.map((doc) => doc.data() as CustomPaint);

  // Sort by brand then name
  return customPaints.sort((a, b) => {
    if (a.brand !== b.brand) {
      return a.brand.localeCompare(b.brand);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Delete a custom paint
 * Only the owner can delete their custom paint
 */
export async function deleteCustomPaint(paintId: string, userId: string): Promise<void> {
  const paintRef = doc(db, 'customPaints', paintId);

  // Note: Firestore security rules will enforce that only the owner can delete
  await deleteDoc(paintRef);
}

/**
 * Get all paints (global + user's custom) for a user
 */
export async function getAllPaintsForUser(userId: string): Promise<(Paint | CustomPaint)[]> {
  const { getAllPaints } = await import('./paints');

  const [globalPaints, customPaints] = await Promise.all([
    getAllPaints(),
    getUserCustomPaints(userId),
  ]);

  // Combine and sort
  const allPaints = [...globalPaints, ...customPaints];
  return allPaints.sort((a, b) => {
    if (a.brand !== b.brand) {
      return a.brand.localeCompare(b.brand);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Search paints (global + user's custom) for a user
 */
export async function searchPaintsForUser(
  userId: string,
  searchTerm: string
): Promise<(Paint | CustomPaint)[]> {
  const allPaints = await getAllPaintsForUser(userId);
  const lowerSearch = searchTerm.toLowerCase();

  return allPaints.filter(
    (paint) =>
      paint.name.toLowerCase().includes(lowerSearch) ||
      paint.brand.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Check if a paint is a custom paint
 */
export function isCustomPaint(paint: Paint | CustomPaint): paint is CustomPaint {
  return 'userId' in paint && 'createdAt' in paint;
}
