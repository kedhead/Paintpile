import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
// import { createNotification } from './notifications'; // Commented out to avoid circular deps or missing errors for now
import { Badge, UserBadge, CreateBadgeData } from '@/types/badge';

const BADGES_COLLECTION = 'badges';
const USERS_COLLECTION = 'users';

// --- Badge Definitions (Admin) ---

export async function getAllBadges(): Promise<Badge[]> {
  try {
    const q = query(collection(db, BADGES_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

export async function createBadge(badgeData: CreateBadgeData): Promise<string> {
  const docRef = await addDoc(collection(db, BADGES_COLLECTION), {
    ...badgeData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateBadge(id: string, badgeData: Partial<Badge>): Promise<void> {
  const docRef = doc(db, BADGES_COLLECTION, id);
  await updateDoc(docRef, badgeData);
}

export async function deleteBadge(id: string): Promise<void> {
  await deleteDoc(doc(db, BADGES_COLLECTION, id));
}

// --- User Badges (Earned) ---

/**
 * Fetch all badges earned by a user.
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  try {
    const userBadgesRef = collection(db, USERS_COLLECTION, userId, 'earned_badges');
    const snapshot = await getDocs(userBadgesRef);
    return snapshot.docs.map(doc => ({ badgeId: doc.id, ...doc.data() } as UserBadge));
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
}

/**
 * Check if a user has a specific badge.
 */
export async function hasBadge(userId: string, badgeId: string): Promise<boolean> {
  const userBadgeRef = doc(db, USERS_COLLECTION, userId, 'earned_badges', badgeId);
  const snap = await getDoc(userBadgeRef);
  return snap.exists();
}

/**
 * Award a badge to a user.
 * Returns true if successful, false if already earned or error.
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  if (await hasBadge(userId, badgeId)) return false;

  try {
    const userBadgeRef = doc(db, USERS_COLLECTION, userId, 'earned_badges', badgeId);
    await setDoc(userBadgeRef, {
      badgeId,
      userId,
      earnedAt: serverTimestamp(),
      notificationSent: false,
      showcased: false
    });

    // Increment user badge count
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      'stats.badgeCount': increment(1)
    });

    // TODO: Trigger Notification here

    return true;
  } catch (error) {
    console.error("Error awarding badge:", error);
    return false;
  }
}
