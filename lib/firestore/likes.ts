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
import { Like, LikeType } from '@/types/social';
import { createNotification, createNotificationMessage, createActionUrl } from './notifications';
import { createActivity } from './activities';
import { checkAndAwardBadges } from './badges';
import { getProject } from './projects';
import { getArmy } from './armies';
import { getRecipe } from './recipes';
import { getUserProfile } from './users';

/**
 * Like a project
 */
export async function likeProject(userId: string, projectId: string): Promise<void> {
  const likesRef = collection(db, 'likes');
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(likesRef, likeId);

  // Create like
  await setDoc(likeRef, {
    likeId,
    userId,
    projectId,
    createdAt: serverTimestamp(),
  });

  // Increment project like count
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    likeCount: increment(1),
  });

  // Get project and user details for notification/activity
  const [project, user] = await Promise.all([
    getProject(projectId),
    getUserProfile(userId),
  ]);

  if (!project || !user) return;

  // Create notification for project owner (but not if they liked their own project)
  if (project.userId !== userId) {
    try {
      await createNotification({
        userId: project.userId,
        type: 'like',
        actorId: userId,
        actorUsername: user.displayName || user.email,
        actorPhotoURL: user.photoURL,
        targetId: projectId,
        targetType: 'project',
        targetName: project.name,
        message: createNotificationMessage('like', user.displayName || user.email, project.name),
        actionUrl: createActionUrl('project', projectId),
      });

      // Increment project owner's likes received stat
      const ownerRef = doc(db, 'users', project.userId);
      await updateDoc(ownerRef, {
        'stats.likesReceived': increment(1),
      });

      // Check if project owner earned any badges
      await checkAndAwardBadges(project.userId);
    } catch (err) {
      console.error('Error creating like notification:', err);
    }
  }

  // Create activity entry
  try {
    await createActivity(
      userId,
      user.displayName || user.email,
      user.photoURL,
      'project_liked',
      projectId,
      'project',
      {
        projectName: project.name,
        visibility: project.isPublic ? 'public' : 'private',
      }
    );
  } catch (err) {
    console.error('Error creating like activity:', err);
  }
}

/**
 * Unlike a project
 */
export async function unlikeProject(userId: string, projectId: string): Promise<void> {
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(db, 'likes', likeId);

  // Get project details before deleting
  const project = await getProject(projectId);

  // Delete like
  await deleteDoc(likeRef);

  // Decrement project like count
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    likeCount: increment(-1),
  });

  // Decrement project owner's likes received stat (if not their own project)
  if (project && project.userId !== userId) {
    try {
      const ownerRef = doc(db, 'users', project.userId);
      await updateDoc(ownerRef, {
        'stats.likesReceived': increment(-1),
      });
    } catch (err) {
      console.error('Error updating likes received stat:', err);
    }
  }
}

/**
 * Check if a user has liked a project
 */
export async function isProjectLiked(userId: string, projectId: string): Promise<boolean> {
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(db, 'likes', likeId);
  const likeSnap = await getDoc(likeRef);

  return likeSnap.exists();
}

/**
 * Get all likes for a project
 */
export async function getProjectLikes(
  projectId: string,
  limitCount: number = 20
): Promise<Like[]> {
  const likesRef = collection(db, 'likes');
  const q = query(
    likesRef,
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Like);
}

/**
 * Get all projects liked by a user
 */
/**
 * Generic function to check if an entity is liked
 */
export async function isEntityLiked(userId: string, entityId: string, type: LikeType = 'project'): Promise<boolean> {
  const likeId = `${userId}_${entityId}`;
  const likeRef = doc(db, 'likes', likeId);
  const likeSnap = await getDoc(likeRef);
  return likeSnap.exists();
}

/**
 * Generic function to toggle like on an entity
 */
export async function toggleLike(
  userId: string,
  entityId: string,
  type: LikeType
): Promise<{ liked: boolean; count: number }> {
  // First check if already liked
  const liked = await isEntityLiked(userId, entityId, type);

  if (liked) {
    await unlikeEntity(userId, entityId, type);
    return { liked: false, count: -1 }; // Caller handles count logic usually, but returns delta
  } else {
    await likeEntity(userId, entityId, type);
    return { liked: true, count: 1 };
  }
}

async function likeEntity(userId: string, entityId: string, type: LikeType): Promise<void> {
  const likesRef = collection(db, 'likes');
  const likeId = `${userId}_${entityId}`;
  const likeRef = doc(likesRef, likeId);

  await setDoc(likeRef, {
    likeId,
    userId,
    targetId: entityId,
    targetType: type,
    createdAt: serverTimestamp(),
    projectId: type === 'project' ? entityId : undefined, // Legacy support
  });

  // Increment count on target entity
  const collectionName = type === 'project' ? 'projects' : type === 'army' ? 'armies' : 'recipes';
  const entityRef = doc(db, collectionName, entityId);
  await updateDoc(entityRef, {
    likeCount: increment(1),
  });

  // Handle Notifications & Activity
  try {
    const user = await getUserProfile(userId);
    let targetOwnerId: string | undefined;
    let targetName: string = '';
    let isPublic = true;

    if (type === 'project') {
      const data = await getProject(entityId);
      if (data) { targetOwnerId = data.userId; targetName = data.name; isPublic = data.isPublic; }
    } else if (type === 'army') {
      const data = await getArmy(entityId);
      if (data) { targetOwnerId = data.userId; targetName = data.name; isPublic = data.isPublic; }
    } else if (type === 'recipe') {
      const data = await getRecipe(entityId);
      if (data) { targetOwnerId = data.userId; targetName = data.name; isPublic = data.isPublic; }
    }

    if (targetOwnerId && targetOwnerId !== userId) {
      // Ensure targetName is string
      const finalTargetName = targetName || 'Entity';

      await createNotification({
        userId: targetOwnerId,
        type: 'like',
        actorId: userId,
        actorUsername: user?.displayName || 'User',
        actorPhotoURL: user?.photoURL,
        targetId: entityId,
        targetType: type,
        targetName: finalTargetName,
        message: createNotificationMessage('like', user?.displayName || 'User', finalTargetName),
        actionUrl: createActionUrl(type, entityId),
      });

      // Update owner stats
      const ownerRef = doc(db, 'users', targetOwnerId);
      await updateDoc(ownerRef, {
        'stats.likesReceived': increment(1),
      });

      await checkAndAwardBadges(targetOwnerId);
    }

    // Map LikeType to ActivityType
    let activityType: 'project_liked' | 'army_liked' | 'recipe_liked';
    switch (type) {
      case 'army': activityType = 'army_liked'; break;
      case 'recipe': activityType = 'recipe_liked'; break;
      default: activityType = 'project_liked';
    }

    // Create activity
    await createActivity(
      userId,
      user?.displayName || 'Unknown User',
      user?.photoURL,
      activityType,
      entityId,
      type,
      {
        projectName: type === 'project' ? targetName : undefined,
        armyName: type === 'army' ? targetName : undefined,
        recipeName: type === 'recipe' ? targetName : undefined,
        targetName: targetName,
        visibility: isPublic ? 'public' : 'private',
      }
    );

  } catch (err) {
    console.error(`Error processing like side-effects for ${type}:`, err);
  }
}

async function unlikeEntity(userId: string, entityId: string, type: LikeType): Promise<void> {
  const likeId = `${userId}_${entityId}`;
  const likeRef = doc(db, 'likes', likeId);

  // Get owner before deleting for stats
  let targetOwnerId: string | undefined;
  if (type === 'project') {
    const data = await getProject(entityId);
    targetOwnerId = data?.userId;
  } else if (type === 'army') {
    const data = await getArmy(entityId);
    targetOwnerId = data?.userId;
  } else if (type === 'recipe') {
    const data = await getRecipe(entityId);
    targetOwnerId = data?.userId;
  }

  await deleteDoc(likeRef);

  // Decrement count
  const collectionName = type === 'project' ? 'projects' : type === 'army' ? 'armies' : 'recipes';
  const entityRef = doc(db, collectionName, entityId);
  await updateDoc(entityRef, {
    likeCount: increment(-1),
  });

  // Decrement owner stats
  if (targetOwnerId && targetOwnerId !== userId) {
    const ownerRef = doc(db, 'users', targetOwnerId);
    await updateDoc(ownerRef, {
      'stats.likesReceived': increment(-1),
    });
  }
}
