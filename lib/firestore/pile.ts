import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { PileItem, PileFormData } from '@/types/pile';
import { incrementUserStats } from './users';

/**
 * Add an item to the pile
 */
export async function addToPile(
  userId: string,
  pileData: PileFormData
): Promise<string> {
  const pileRef = collection(db, 'pile');
  const newPileRef = doc(pileRef);
  const pileId = newPileRef.id;

  const pileItem: PileItem = {
    pileId,
    userId,
    name: pileData.name,
    quantity: pileData.quantity,
    status: pileData.status,
    type: pileData.type,
    notes: pileData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(newPileRef, pileItem);

  // Increment user pile count
  await incrementUserStats(userId, 'pileCount', pileData.quantity);

  return pileId;
}

/**
 * Get all pile items for a user
 */
export async function getUserPile(userId: string): Promise<PileItem[]> {
  const pileRef = collection(db, 'pile');
  const q = query(pileRef, where('userId', '==', userId));

  const querySnapshot = await getDocs(q);
  const items = querySnapshot.docs.map((doc) => doc.data() as PileItem);

  // Sort by createdAt in memory to avoid needing a composite index
  return items.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });
}

/**
 * Update a pile item
 */
export async function updatePileItem(
  pileId: string,
  userId: string,
  updates: Partial<PileFormData>
): Promise<void> {
  const pileRef = doc(db, 'pile', pileId);

  // If quantity is changing, update user stats
  if (updates.quantity !== undefined) {
    // We'd need to fetch the old quantity first to calculate the difference
    // For now, we'll just update the document
  }

  await updateDoc(pileRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a pile item
 */
export async function deletePileItem(
  pileId: string,
  userId: string,
  quantity: number
): Promise<void> {
  const pileRef = doc(db, 'pile', pileId);
  await deleteDoc(pileRef);

  // Decrement user pile count
  await incrementUserStats(userId, 'pileCount', -quantity);
}

/**
 * Get pile statistics
 */
export async function getPileStats(userId: string): Promise<{
  total: number;
  unpainted: number;
  painting: number;
  painted: number;
  byType: Record<string, number>;
}> {
  const pileItems = await getUserPile(userId);

  const stats = {
    total: 0,
    unpainted: 0,
    painting: 0,
    painted: 0,
    byType: {} as Record<string, number>,
  };

  pileItems.forEach((item) => {
    const qty = item.quantity;
    stats.total += qty;

    // Count by status
    if (item.status === 'unpainted') stats.unpainted += qty;
    else if (item.status === 'painting') stats.painting += qty;
    else if (item.status === 'painted') stats.painted += qty;

    // Count by type
    if (!stats.byType[item.type]) {
      stats.byType[item.type] = 0;
    }
    stats.byType[item.type] += qty;
  });

  return stats;
}

/**
 * Mark pile item as started (unpainted -> painting)
 */
export async function startPainting(pileId: string): Promise<void> {
  const pileRef = doc(db, 'pile', pileId);
  await updateDoc(pileRef, {
    status: 'painting',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark pile item as completed (painting -> painted)
 */
export async function completePainting(pileId: string): Promise<void> {
  const pileRef = doc(db, 'pile', pileId);
  await updateDoc(pileRef, {
    status: 'painted',
    updatedAt: serverTimestamp(),
  });
}
