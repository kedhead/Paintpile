import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    writeBatch,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { UserOwnedPaint } from '@/types/paint';

/**
 * Get all paints in a user's inventory
 */
export async function getUserInventory(userId: string): Promise<UserOwnedPaint[]> {
    const inventoryRef = collection(db, `users/${userId}/inventory`);
    const snapshot = await getDocs(inventoryRef);

    return snapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id,
    } as UserOwnedPaint));
}

/**
 * Add a paint to the user's inventory
 */
export async function addToInventory(userId: string, paintId: string, notes?: string): Promise<void> {
    // Use paintId as the document ID to prevent duplicates easily
    const paintRef = doc(db, `users/${userId}/inventory`, paintId);

    const ownedPaint: Partial<UserOwnedPaint> = {
        userId,
        paintId,
        quantity: 1,
        notes: notes || '',
        acquiredAt: serverTimestamp() as Timestamp,
    };

    // setDoc with merge: true allows updating notes/quantity if it already exists
    // effectively equivalent to "upsert"
    await setDoc(paintRef, ownedPaint, { merge: true });
}

/**
 * Remove a paint from the user's inventory
 */
export async function removeFromInventory(userId: string, paintId: string): Promise<void> {
    const paintRef = doc(db, `users/${userId}/inventory`, paintId);
    await deleteDoc(paintRef);
}

/**
 * Bulk add multiple paints to inventory
 * Used for AI import or adding sets
 */
export async function bulkAddToInventory(userId: string, paintIds: string[]): Promise<void> {
    if (paintIds.length === 0) return;

    // Firestore batches allow up to 500 operations
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    paintIds.forEach((paintId) => {
        const paintRef = doc(db, `users/${userId}/inventory`, paintId);
        batch.set(paintRef, {
            userId,
            paintId,
            quantity: 1,
            notes: 'Imported via AI',
            acquiredAt: timestamp,
        }, { merge: true });
    });

    await batch.commit();
}
