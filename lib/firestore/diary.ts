import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit, // eslint-disable-line @typescript-eslint/no-unused-vars
    startAfter, // eslint-disable-line @typescript-eslint/no-unused-vars
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { DiaryEntry, DiaryEntryFormData } from '@/types/diary';
import { incrementUserStats } from '@/lib/firestore/users';
import { checkAndAwardBadges } from '@/lib/firestore/badges';

const COLLECTION_NAME = 'diary_entries';

/**
 * Create a new diary entry
 */
export async function createDiaryEntry(userId: string, data: DiaryEntryFormData): Promise<string> {
    try {
        const entryData = {
            ...data,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), entryData);

        // Update stats and check for badges
        await incrementUserStats(userId, 'diaryEntryCount', 1);
        await checkAndAwardBadges(userId);

        return docRef.id;
    } catch (error) {
        console.error('Error creating diary entry:', error);
        throw error;
    }
}

/**
 * Update an existing diary entry
 */
export async function updateDiaryEntry(entryId: string, data: Partial<DiaryEntryFormData>): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, entryId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating diary entry:', error);
        throw error;
    }
}

/**
 * Delete a diary entry
 */
export async function deleteDiaryEntry(entryId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, entryId));
    } catch (error) {
        console.error('Error deleting diary entry:', error);
        throw error;
    }
}

/**
 * Get all diary entries for a user, ordered by date desc
 */
export async function getUserDiaryEntries(userId: string): Promise<DiaryEntry[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            entryId: doc.id,
            ...doc.data()
        } as DiaryEntry));
    } catch (error) {
        console.error('Error fetching diary entries:', error);
        throw error;
    }
}

/**
 * Get a single diary entry
 */
export async function getDiaryEntry(entryId: string): Promise<DiaryEntry | null> {
    try {
        const docRef = doc(db, COLLECTION_NAME, entryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { entryId: docSnap.id, ...docSnap.data() } as DiaryEntry;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching diary entry:', error);
        throw error;
    }
}
