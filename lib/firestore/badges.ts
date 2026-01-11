import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import {
  UserBadge,
  BadgeType,
  BADGE_DEFINITIONS,
  BadgeDefinition,
} from '@/types/badge';
import { User } from '@/types/user';
import { createNotification, createNotificationMessage, createActionUrl } from './notifications';

/**
 * Get all badges earned by a user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const badgesRef = collection(db, 'users', userId, 'badges');
  const querySnapshot = await getDocs(badgesRef);

  return querySnapshot.docs.map((doc) => doc.data() as UserBadge);
}

/**
 * Check if user has a specific badge
 */
export async function userHasBadge(
  userId: string,
  badgeType: BadgeType
): Promise<boolean> {
  const badgesRef = collection(db, 'users', userId, 'badges');
  const q = query(badgesRef, where('badgeType', '==', badgeType));

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  sendNotification: boolean = true
): Promise<string | null> {
  // Check if user already has this badge
  const hasBadge = await userHasBadge(userId, badgeType);

  if (hasBadge) {
    return null; // Already has badge
  }

  const badgesRef = collection(db, 'users', userId, 'badges');
  const newBadgeRef = doc(badgesRef);
  const badgeId = newBadgeRef.id;

  const badge: Omit<UserBadge, 'badgeId' | 'earnedAt'> & {
    badgeId: string;
    earnedAt: any;
  } = {
    badgeId,
    userId,
    badgeType,
    earnedAt: serverTimestamp(),
    notificationSent: false,
    showcased: false,
  };

  await setDoc(newBadgeRef, badge);

  // Increment badge count in user stats
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'stats.badgeCount': increment(1),
  });

  // Send notification
  if (sendNotification) {
    const badgeDefinition = BADGE_DEFINITIONS[badgeType];
    await createNotification({
      userId,
      type: 'mention', // Using 'mention' as a generic notification type
      actorId: 'system',
      actorUsername: 'PaintPile',
      message: `🎉 You earned the "${badgeDefinition.name}" badge! ${badgeDefinition.description}`,
      targetId: badgeId,
      targetType: 'user',
      targetName: badgeDefinition.name,
      actionUrl: `/profile`,
    });

    // Mark notification as sent
    await updateDoc(newBadgeRef, {
      notificationSent: true,
    });
  }

  return badgeId;
}

/**
 * Check and award badges based on user stats
 * Returns array of newly awarded badge types
 */
export async function checkAndAwardBadges(userId: string): Promise<BadgeType[]> {
  // Get user document with stats
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const user = userSnap.data() as User;
  const stats = user.stats;

  const awardedBadges: BadgeType[] = [];

  // Check project count badges
  if (stats.projectCount >= 100 && !(await userHasBadge(userId, 'project_100'))) {
    await awardBadge(userId, 'project_100');
    awardedBadges.push('project_100');
  } else if (stats.projectCount >= 50 && !(await userHasBadge(userId, 'project_50'))) {
    await awardBadge(userId, 'project_50');
    awardedBadges.push('project_50');
  } else if (stats.projectCount >= 10 && !(await userHasBadge(userId, 'project_10'))) {
    await awardBadge(userId, 'project_10');
    awardedBadges.push('project_10');
  } else if (stats.projectCount >= 1 && !(await userHasBadge(userId, 'first_project'))) {
    await awardBadge(userId, 'first_project');
    awardedBadges.push('first_project');
  }

  // Check army count badges
  if (stats.armyCount >= 10 && !(await userHasBadge(userId, 'army_10'))) {
    await awardBadge(userId, 'army_10');
    awardedBadges.push('army_10');
  } else if (stats.armyCount >= 1 && !(await userHasBadge(userId, 'first_army'))) {
    await awardBadge(userId, 'first_army');
    awardedBadges.push('first_army');
  }

  // Check recipe count badges
  if (stats.recipesCreated >= 50 && !(await userHasBadge(userId, 'recipe_master'))) {
    await awardBadge(userId, 'recipe_master');
    awardedBadges.push('recipe_master');
  } else if (stats.recipesCreated >= 10 && !(await userHasBadge(userId, 'recipe_10'))) {
    await awardBadge(userId, 'recipe_10');
    awardedBadges.push('recipe_10');
  } else if (stats.recipesCreated >= 1 && !(await userHasBadge(userId, 'recipe_creator'))) {
    await awardBadge(userId, 'recipe_creator');
    awardedBadges.push('recipe_creator');
  }

  // Check likes received badges
  if (stats.likesReceived >= 1000 && !(await userHasBadge(userId, 'likes_1000'))) {
    await awardBadge(userId, 'likes_1000');
    awardedBadges.push('likes_1000');
  } else if (stats.likesReceived >= 500 && !(await userHasBadge(userId, 'likes_500'))) {
    await awardBadge(userId, 'likes_500');
    awardedBadges.push('likes_500');
  } else if (stats.likesReceived >= 50 && !(await userHasBadge(userId, 'likes_50'))) {
    await awardBadge(userId, 'likes_50');
    awardedBadges.push('likes_50');
  }

  // Check follower count badges
  if (stats.followerCount >= 1000 && !(await userHasBadge(userId, 'influencer'))) {
    await awardBadge(userId, 'influencer');
    awardedBadges.push('influencer');
  } else if (stats.followerCount >= 500 && !(await userHasBadge(userId, 'follower_500'))) {
    await awardBadge(userId, 'follower_500');
    awardedBadges.push('follower_500');
  } else if (stats.followerCount >= 100 && !(await userHasBadge(userId, 'follower_100'))) {
    await awardBadge(userId, 'follower_100');
    awardedBadges.push('follower_100');
  } else if (stats.followerCount >= 10 && !(await userHasBadge(userId, 'follower_10'))) {
    await awardBadge(userId, 'follower_10');
    awardedBadges.push('follower_10');
  }

  // Check comment count badges
  if (stats.commentCount >= 50 && !(await userHasBadge(userId, 'commenter'))) {
    await awardBadge(userId, 'commenter');
    awardedBadges.push('commenter');
  }

  return awardedBadges;
}

/**
 * Get all badge definitions (static data)
 */
export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS);
}

/**
 * Get badge definition by type
 */
export function getBadgeDefinition(badgeType: BadgeType): BadgeDefinition {
  return BADGE_DEFINITIONS[badgeType];
}

/**
 * Get badges organized by category
 */
export function getBadgesByCategory(): Record<string, BadgeDefinition[]> {
  const badges = getAllBadgeDefinitions();
  const categorized: Record<string, BadgeDefinition[]> = {};

  badges.forEach((badge) => {
    if (!categorized[badge.category]) {
      categorized[badge.category] = [];
    }
    categorized[badge.category].push(badge);
  });

  return categorized;
}

/**
 * Toggle showcase status for a badge
 */
export async function toggleBadgeShowcase(
  userId: string,
  badgeId: string,
  showcased: boolean
): Promise<void> {
  const badgeRef = doc(db, 'users', userId, 'badges', badgeId);
  await updateDoc(badgeRef, {
    showcased,
  });
}

/**
 * Get showcased badges for a user (for display on profile)
 */
export async function getShowcasedBadges(userId: string): Promise<UserBadge[]> {
  const badgesRef = collection(db, 'users', userId, 'badges');
  const q = query(badgesRef, where('showcased', '==', true));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as UserBadge);
}
