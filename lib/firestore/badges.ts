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
import { createNotification } from './notifications';
import { Badge, UserBadge, CreateBadgeData } from '@/types/badge';

// ... (rest of imports)

// ... (existing code)

/**
 * Award a badge to a user.
 * Returns true if successful, false if already earned or error.
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  if (await hasBadge(userId, badgeId)) return false;

  try {
    // Fetch badge details for notification
    const badgeRef = doc(db, BADGES_COLLECTION, badgeId);
    const badgeSnap = await getDoc(badgeRef);
    const badgeName = badgeSnap.exists() ? badgeSnap.data().name : 'New Badge';

    const userBadgeRef = doc(db, USERS_COLLECTION, userId, 'earned_badges', badgeId);
    await setDoc(userBadgeRef, {
      badgeId,
      userId,
      earnedAt: serverTimestamp(),
      notificationSent: true, // Mark as sent immediately
      showcased: false
    });

    // Increment user badge count
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      'stats.badgeCount': increment(1)
    });

    // Trigger Notification
    await createNotification({
      userId,
      type: 'badge_earned',
      actorId: 'system',
      actorUsername: 'PaintPile',
      targetId: badgeId,
      targetType: 'badge',
      targetName: badgeName,
      message: `You earned the "${badgeName}" badge!`,
      actionUrl: '/badges'
    });

    return true;
  } catch (error) {
    console.error("Error awarding badge:", error);
    return false;
  }
}


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

export async function createBadgeWithId(id: string, badgeData: CreateBadgeData): Promise<void> {
  const docRef = doc(db, BADGES_COLLECTION, id);
  await setDoc(docRef, {
    ...badgeData,
    createdAt: new Date().toISOString(),
  }, { merge: true }); // Merge to avoid overwriting creation time if possible, or just overwrite? 
  // Actually, for seeding standard defs, we probably want to ensure latest data.
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
 * Check and award badges based on user stats.
 * This function checks for standard milestones (projects, armies, social).
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
    // Fetch user stats
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const stats = userData.stats || {};

    // Dictionary of Badge ID -> Requirement Condition
    // This maps the dynamic badge IDs (seeded defaults) to logic
    const checks: Record<string, boolean> = {
      // Projects
      'first_project': (stats.projectCount || 0) >= 1,
      'project_10': (stats.projectCount || 0) >= 10,
      'project_50': (stats.projectCount || 0) >= 50,
      'project_100': (stats.projectCount || 0) >= 100,

      // Armies
      'first_army': (stats.armyCount || 0) >= 1,
      'army_10': (stats.armyCount || 0) >= 10,

      // Recipes
      'recipe_creator': (stats.recipesCreated || 0) >= 1,
      'recipe_10': (stats.recipesCreated || 0) >= 10,
      'recipe_master': (stats.recipesCreated || 0) >= 50,

      // Social
      'follower_10': (stats.followerCount || 0) >= 10,
      'follower_100': (stats.followerCount || 0) >= 100,
      'follower_500': (stats.followerCount || 0) >= 500,
      'likes_50': (stats.likesReceived || 0) >= 50,
      'likes_500': (stats.likesReceived || 0) >= 500,
      'likes_1000': (stats.likesReceived || 0) >= 1000,
      'commenter': (stats.commentCount || 0) >= 50,
    };

    // Check each condition
    const awardedPromises: Promise<boolean>[] = [];
    for (const [badgeId, condition] of Object.entries(checks)) {
      if (condition) {
        // awardBadge handles duplication check internally
        awardedPromises.push(awardBadge(userId, badgeId));
      }
    }

    await Promise.all(awardedPromises);

  } catch (error) {
    console.error("Error checking/awarding badges:", error);
  }
}

/**
 * Manually trigger a sync of user stats and then check for badges.
 * Use this for retroactive awarding.
 */
export async function syncAndAwardBadges(userId: string): Promise<void> {
  // Dynamic import to avoid circular dependency if possible, or just standard import
  const { syncUserStats } = await import('./users');

  await syncUserStats(userId);
  await checkAndAwardBadges(userId);
}
