import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Follow } from '@/types/social';
import { User } from '@/types/user';
import { createNotification, createNotificationMessage, createActionUrl } from './notifications';
import { createActivity } from './activities';
import { checkAndAwardBadges } from './badges';
import { getUserProfile } from './users';

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  const followsRef = collection(db, 'follows');
  const followId = `${followerId}_${followingId}`;
  const followRef = doc(followsRef, followId);

  // Create follow relationship
  await setDoc(followRef, {
    followId,
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });

  // Update follower count for the user being followed
  const followingUserRef = doc(db, 'users', followingId);
  await updateDoc(followingUserRef, {
    'stats.followerCount': increment(1),
  });

  // Update following count for the user who is following
  const followerUserRef = doc(db, 'users', followerId);
  await updateDoc(followerUserRef, {
    'stats.followingCount': increment(1),
  });

  // Get user details for notification/activity
  const [follower, followingUser] = await Promise.all([
    getUserProfile(followerId),
    getUserProfile(followingId),
  ]);

  if (!follower || !followingUser) return;

  // Create notification for the user being followed
  try {
    await createNotification({
      userId: followingId,
      type: 'follow',
      actorId: followerId,
      actorUsername: follower.displayName || follower.email,
      actorPhotoURL: follower.photoURL,
      targetId: followerId,
      targetType: 'user',
      targetName: follower.displayName || follower.email,
      message: createNotificationMessage('follow', follower.displayName || follower.email),
      actionUrl: `/users/${follower.username || followerId}`,
    });

    // Check if the followed user earned any badges
    await checkAndAwardBadges(followingId);
  } catch (err) {
    console.error('Error creating follow notification:', err);
  }

  // Create activity entry
  try {
    await createActivity(
      followerId,
      follower.displayName || follower.email,
      follower.photoURL,
      'user_followed',
      followingId,
      'user',
      {
        targetUsername: followingUser.displayName || followingUser.email,
        targetUserPhotoUrl: followingUser.photoURL,
      }
    );
  } catch (err) {
    console.error('Error creating follow activity:', err);
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const followId = `${followerId}_${followingId}`;
  const followRef = doc(db, 'follows', followId);

  // Delete follow relationship
  await deleteDoc(followRef);

  // Update follower count for the user being unfollowed
  const followingUserRef = doc(db, 'users', followingId);
  await updateDoc(followingUserRef, {
    'stats.followerCount': increment(-1),
  });

  // Update following count for the user who is unfollowing
  const followerUserRef = doc(db, 'users', followerId);
  await updateDoc(followerUserRef, {
    'stats.followingCount': increment(-1),
  });
}

/**
 * Check if a user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const followId = `${followerId}_${followingId}`;
  const followRef = doc(db, 'follows', followId);
  const followSnap = await getDoc(followRef);

  return followSnap.exists();
}

/**
 * Get users who follow a specific user (followers)
 */
export async function getUserFollowers(
  userId: string,
  limitCount: number = 20
): Promise<Follow[]> {
  const followsRef = collection(db, 'follows');
  const q = query(
    followsRef,
    where('followingId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Follow);
}

/**
 * Get users that a specific user is following
 */
export async function getUserFollowing(
  userId: string,
  limitCount: number = 20
): Promise<Follow[]> {
  const followsRef = collection(db, 'follows');
  const q = query(
    followsRef,
    where('followerId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Follow);
}
