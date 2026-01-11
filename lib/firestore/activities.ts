import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import {
  Activity,
  CreateActivityData,
  ActivityType,
  ActivityMetadata,
  ActivityTargetType,
} from '@/types/activity';
import { getUserFollowing } from './follows';

/**
 * Create a new activity entry
 */
export async function createActivity(
  userId: string,
  username: string,
  userPhotoUrl: string | undefined,
  type: ActivityType,
  targetId: string,
  targetType: ActivityTargetType,
  metadata?: ActivityMetadata
): Promise<string> {
  const activitiesRef = collection(db, 'activities');
  const newActivityRef = doc(activitiesRef);
  const activityId = newActivityRef.id;

  const activity: Omit<Activity, 'activityId' | 'createdAt'> & {
    activityId: string;
    createdAt: any;
  } = {
    activityId,
    userId,
    username,
    userPhotoUrl,
    type,
    targetId,
    targetType,
    metadata: metadata || {},
    createdAt: serverTimestamp(),
  };

  await setDoc(newActivityRef, activity);

  return activityId;
}

/**
 * Get activities for a specific user
 */
export async function getUserActivities(
  userId: string,
  limitCount: number = 50
): Promise<Activity[]> {
  const activitiesRef = collection(db, 'activities');

  const q = query(
    activitiesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Activity);
}

/**
 * Get activities from users that the current user follows
 * This creates a "Following Feed"
 */
export async function getFollowingActivities(
  userId: string,
  limitCount: number = 50
): Promise<Activity[]> {
  // Get list of users the current user follows
  const following = await getUserFollowing(userId);

  if (following.length === 0) {
    return [];
  }

  // Extract user IDs
  const followingIds = following.map((follow) => follow.followingId);

  // Firestore 'in' query is limited to 30 items, so we need to chunk if necessary
  const chunkSize = 30;
  const chunks: string[][] = [];

  for (let i = 0; i < followingIds.length; i += chunkSize) {
    chunks.push(followingIds.slice(i, i + chunkSize));
  }

  // Query activities for each chunk and combine results
  const activitiesRef = collection(db, 'activities');
  const allActivities: Activity[] = [];

  for (const chunk of chunks) {
    const q = query(
      activitiesRef,
      where('userId', 'in', chunk),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map((doc) => doc.data() as Activity);
    allActivities.push(...activities);
  }

  // Sort combined results by createdAt and limit
  allActivities.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return allActivities.slice(0, limitCount);
}

/**
 * Get global activities (public feed)
 */
export async function getGlobalActivities(
  limitCount: number = 50
): Promise<Activity[]> {
  const activitiesRef = collection(db, 'activities');

  // Only show activities for public content
  // Filter will need to check visibility metadata
  const q = query(
    activitiesRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const activities = querySnapshot.docs.map((doc) => doc.data() as Activity);

  // Filter to only show activities for public content
  // (visibility is stored in metadata)
  return activities.filter((activity) => {
    return activity.metadata?.visibility !== 'private';
  });
}

/**
 * Delete all activities for a specific target entity
 * Used when a project/army/recipe is deleted
 */
export async function deleteActivitiesForTarget(
  targetId: string
): Promise<void> {
  const activitiesRef = collection(db, 'activities');
  const q = query(activitiesRef, where('targetId', '==', targetId));

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  querySnapshot.docs.forEach((activityDoc) => {
    batch.delete(activityDoc.ref);
  });

  await batch.commit();
}

/**
 * Delete all activities for a specific user
 * Used when a user deletes their account
 */
export async function deleteUserActivities(userId: string): Promise<void> {
  const activitiesRef = collection(db, 'activities');
  const q = query(activitiesRef, where('userId', '==', userId));

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  querySnapshot.docs.forEach((activityDoc) => {
    batch.delete(activityDoc.ref);
  });

  await batch.commit();
}

/**
 * Prune old activities (maintenance function)
 * Keep only recent activities to prevent collection from growing too large
 */
export async function pruneOldActivities(daysToKeep: number = 90): Promise<number> {
  const activitiesRef = collection(db, 'activities');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  // Note: This is a simplified version. In production, you'd want to use
  // Cloud Functions with scheduled triggers to handle this efficiently
  const querySnapshot = await getDocs(activitiesRef);

  const batch = writeBatch(db);
  let deleteCount = 0;

  querySnapshot.docs.forEach((activityDoc) => {
    const activity = activityDoc.data() as Activity;
    const activityDate = activity.createdAt?.toDate();

    if (activityDate && activityDate < cutoffDate) {
      batch.delete(activityDoc.ref);
      deleteCount++;
    }
  });

  if (deleteCount > 0) {
    await batch.commit();
  }

  return deleteCount;
}
