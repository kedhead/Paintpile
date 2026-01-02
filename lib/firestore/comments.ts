import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Comment } from '@/types/social';

/**
 * Create a new comment on a project
 */
export async function createComment(
  projectId: string,
  userId: string,
  username: string,
  userPhotoURL: string | undefined,
  content: string
): Promise<string> {
  const commentsRef = collection(db, 'projects', projectId, 'comments');
  const newCommentRef = doc(commentsRef);
  const commentId = newCommentRef.id;

  const comment = {
    commentId,
    projectId,
    userId,
    username,
    userPhotoURL: userPhotoURL || '',
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    edited: false,
  };

  await setDoc(newCommentRef, comment);

  // Increment comment count on project
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    commentCount: increment(1),
  });

  return commentId;
}

/**
 * Get all comments for a project
 */
export async function getProjectComments(
  projectId: string,
  limitCount: number = 50
): Promise<Comment[]> {
  const commentsRef = collection(db, 'projects', projectId, 'comments');
  const q = query(
    commentsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Comment);
}

/**
 * Update a comment
 */
export async function updateComment(
  projectId: string,
  commentId: string,
  content: string
): Promise<void> {
  const commentRef = doc(db, 'projects', projectId, 'comments', commentId);

  await updateDoc(commentRef, {
    content,
    updatedAt: serverTimestamp(),
    edited: true,
  });
}

/**
 * Delete a comment
 */
export async function deleteComment(
  projectId: string,
  commentId: string,
  userId: string
): Promise<void> {
  const commentRef = doc(db, 'projects', projectId, 'comments', commentId);

  await deleteDoc(commentRef);

  // Decrement comment count on project
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    commentCount: increment(-1),
  });
}
