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
import { Like } from '@/types/social';
import { createNotification, createNotificationMessage, createActionUrl } from './notifications';
import { createActivity } from './activities';
import { checkAndAwardBadges } from './badges';
import { getProject } from './projects';
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
        projectPhotoUrl: project.coverPhotoUrl,
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
export async function getUserLikedProjects(
  userId: string,
  limitCount: number = 20
): Promise<Like[]> {
  const likesRef = collection(db, 'likes');
  const q = query(
    likesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Like);
}
