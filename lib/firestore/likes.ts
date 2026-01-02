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
}

/**
 * Unlike a project
 */
export async function unlikeProject(userId: string, projectId: string): Promise<void> {
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(db, 'likes', likeId);

  // Delete like
  await deleteDoc(likeRef);

  // Decrement project like count
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    likeCount: increment(-1),
  });
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
