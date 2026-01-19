import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Challenge, ChallengeEntry, CreateChallengeData, ChallengeStatus } from '@/types/challenge';
import { getProject } from './projects';
import { awardBadge } from './badges';
import { createNotification } from './notifications';

const COLLECTION = 'challenges';
const ENTRIES_COLLECTION = 'entries';

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
 * Checks for status == 'active' OR isActive == true (legacy)
 */
export async function getActiveChallenge(): Promise<Challenge | null> {
    try {
        // Try status='active' first
        let q = query(
            collection(db, COLLECTION),
            where('status', '==', 'active'),
            limit(1)
        );
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Fallback to old isActive boolean
            q = query(
                collection(db, COLLECTION),
                where('isActive', '==', true),
                limit(1)
            );
            snapshot = await getDocs(q);
        }

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
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        status: data.status || 'draft',
        isActive: data.status === 'active', // Sync legacy field
        participantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}

/**
 * Update a challenge
 */
export async function updateChallenge(id: string, data: Partial<CreateChallengeData> & { status?: ChallengeStatus }): Promise<void> {
    const docRef = doc(db, COLLECTION, id);

    const updates: any = {
        ...data,
        updatedAt: serverTimestamp()
    };

    // Keep isActive in sync for safety
    if (data.status) {
        updates.isActive = data.status === 'active';
    }

    await updateDoc(docRef, updates);
}

/**
 * Set a challenge as Active (and deactivate others methods)
 */
export async function setActiveChallenge(id: string): Promise<void> {
    // 1. Get all currently active challenges
    const q = query(collection(db, COLLECTION), where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    // 2. Deactivate them
    const updates = snapshot.docs.map(d => updateDoc(d.ref, {
        status: 'completed',
        isActive: false
    }));
    await Promise.all(updates);

    // 3. Activate the target
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'active',
        isActive: true
    });
}

/**
 * Delete a challenge
 */
export async function deleteChallenge(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

// =============================================================================
// SUBMISSIONS & ENTRIES
// =============================================================================

/**
 * Submit a project to a challenge
 */
export async function submitEntry(
    userId: string,
    challengeId: string,
    projectId: string
): Promise<void> {
    // 1. Verify Project Ownership & Data
    const project = await getProject(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");
    if (!project.isPublic) throw new Error("Project must be public to enter");

    // 2. Fetch User Profile for snapshot
    // Importing dynamically to avoid circular issues
    const { getUserProfile } = await import('./users');
    const user = await getUserProfile(userId);

    const challengeRef = doc(db, COLLECTION, challengeId);
    const entryRef = doc(collection(db, COLLECTION, challengeId, ENTRIES_COLLECTION), projectId);

    // 3. Transaction to submit + increment count
    await runTransaction(db, async (transaction) => {
        const entrySnap = await transaction.get(entryRef);
        if (entrySnap.exists()) {
            throw new Error("Project already submitted to this challenge");
        }

        const challengeSnap = await transaction.get(challengeRef);
        if (!challengeSnap.exists()) throw new Error("Challenge not found");

        const challengeData = challengeSnap.data() as Challenge;
        if (challengeData.status !== 'active' && !challengeData.isActive) {
            throw new Error("Challenge is not active");
        }

        const entry: ChallengeEntry = {
            entryId: projectId,
            challengeId,
            userId,
            projectId,
            photoUrl: project.coverPhotoUrl || '',
            projectTitle: project.name,
            submittedAt: Timestamp.now(),
            votes: 0,
            userDisplayName: user?.displayName || 'Unknown',
            userPhotoUrl: user?.photoURL || ''
        };

        transaction.set(entryRef, entry);
        transaction.update(challengeRef, {
            participantCount: (challengeData.participantCount || 0) + 1
        });
    });
}

/**
 * Get all entries for a challenge
 */
export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
    const q = query(
        collection(db, COLLECTION, challengeId, ENTRIES_COLLECTION),
        orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ChallengeEntry);
}

/**
 * Check if a user has already submitted to this challenge
 * Returns the entry if found, null otherwise
 */
export async function getUserSubmission(challengeId: string, userId: string): Promise<ChallengeEntry | null> {
    const q = query(
        collection(db, COLLECTION, challengeId, ENTRIES_COLLECTION),
        where('userId', '==', userId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs[0].data() as ChallengeEntry;
    }
    return null;
}

/**
 * Pick a winner for the challenge
 */
export async function pickChallengeWinner(challengeId: string, entryId: string): Promise<void> {
    const challengeDoc = await getDoc(doc(db, COLLECTION, challengeId));
    if (!challengeDoc.exists()) throw new Error("Challenge not found");

    const challengeData = challengeDoc.data() as Challenge;

    // Get Entry
    const entryDoc = await getDoc(doc(db, COLLECTION, challengeId, ENTRIES_COLLECTION, entryId));
    if (!entryDoc.exists()) throw new Error("Entry not found");
    const entry = entryDoc.data() as ChallengeEntry;

    // Award Badge
    if (challengeData.rewardBadgeId) {
        await awardBadge(entry.userId, challengeData.rewardBadgeId);

        await createNotification({
            userId: entry.userId,
            type: 'system',
            actorId: 'system',
            actorUsername: 'PaintPile',
            targetId: challengeId,
            targetType: 'challenge', // This needs to match NotificationTargetType
            targetName: challengeData.title,
            message: `Congratulations! You won the "${challengeData.title}" challenge!`,
            actionUrl: `/challenges/${challengeId}`
        });
    }

    // Mark Challenge Completed
    await updateChallenge(challengeId, { status: 'completed' });
}
