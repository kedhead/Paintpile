import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    type DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    isActive: boolean;
    startDate: Timestamp;
    endDate: Timestamp;
    rewardBadgeId?: string; // Optional link to a badge
    coverImageUrl?: string;
    participantCount?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type CreateChallengeData = Omit<Challenge, 'id' | 'createdAt' | 'updatedAt' | 'participantCount'> & {
    participantCount?: number;
};

const COLLECTION = 'challenges';

/**
 * Get all challenges (Admin use mostly)
 */
export async function getChallenges(): Promise<Challenge[]> {
    try {
        const q = query(
            collection(db, COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Challenge));
    } catch (error) {
        console.error('Error fetching challenges:', error);
        return [];
    }
}

/**
 * Get the currently active challenge
 */
export async function getActiveChallenge(): Promise<Challenge | null> {
    try {
        const q = query(
            collection(db, COLLECTION),
            where('isActive', '==', true),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            } as Challenge;
        }
        return null;
    } catch (error) {
        console.error('Error fetching active challenge:', error);
        return null;
    }
}

/**
 * Create a new challenge
 */
export async function createChallenge(data: CreateChallengeData): Promise<string> {
    // If setting as active, deactivate others (optional but good UX)
    // For now, allow simple creation. Admin UI can handle toggling others off if needed, 
    // or we can do a batch update here. Let's keep it simple: just add.

    const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        participantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}

/**
 * Update a challenge
 */
export async function updateChallenge(id: string, data: Partial<CreateChallengeData>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
}

/**
 * Set a challenge as Active (and optionally deactivate all others)
 */
export async function setActiveChallenge(id: string): Promise<void> {
    // 1. Get all currently active challenges
    const q = query(collection(db, COLLECTION), where('isActive', '==', true));
    const snapshot = await getDocs(q);

    // 2. Deactivate them
    const updates = snapshot.docs.map(d => updateDoc(d.ref, { isActive: false }));
    await Promise.all(updates);

    // 3. Activate the target
    await updateDoc(doc(db, COLLECTION, id), { isActive: true });
}

/**
 * Delete a challenge
 */
export async function deleteChallenge(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}
