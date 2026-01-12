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
import { createNotification, createNotificationMessage, createActionUrl } from './notifications';
import { createActivity } from './activities';
import { checkAndAwardBadges } from './badges';
import { getProject } from './projects';

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

  // Get project details for notification/activity
  const project = await getProject(projectId);

  if (!project) return commentId;

  // Create notification for project owner (but not if they commented on their own project)
  if (project.userId !== userId) {
    try {
      // Truncate comment for preview
      const commentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

      await createNotification({
        userId: project.userId,
        type: 'comment',
        actorId: userId,
        actorUsername: username,
        actorPhotoURL: userPhotoURL,
        targetId: projectId,
        targetType: 'project',
        targetName: project.name,
        message: createNotificationMessage('comment', username, project.name),
        actionUrl: createActionUrl('project', projectId),
      });

      // Increment project owner's comments received stat
      const ownerRef = doc(db, 'users', project.userId);
      await updateDoc(ownerRef, {
        'stats.commentsReceived': increment(1),
      });
    } catch (err) {
      console.error('Error creating comment notification:', err);
    }
  }

  // Increment commenter's comment count stat
  try {
    const commenterRef = doc(db, 'users', userId);
    await updateDoc(commenterRef, {
      'stats.commentCount': increment(1),
    });

    // Check if commenter earned any badges
    await checkAndAwardBadges(userId);
  } catch (err) {
    console.error('Error updating comment stats:', err);
  }

  // Create activity entry
  try {
    const commentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

    await createActivity(
      userId,
      username,
      userPhotoURL,
      'comment_created',
      projectId,
      'project',
      {
        projectName: project.name,
        commentText: content,
        commentPreview,
        visibility: project.isPublic ? 'public' : 'private',
      }
    );
  } catch (err) {
    console.error('Error creating comment activity:', err);
  }

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

  // Get project details before deleting
  const project = await getProject(projectId);

  await deleteDoc(commentRef);

  // Decrement comment count on project
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    commentCount: increment(-1),
  });

  // Decrement commenter's comment count stat
  try {
    const commenterRef = doc(db, 'users', userId);
    await updateDoc(commenterRef, {
      'stats.commentCount': increment(-1),
    });
  } catch (err) {
    console.error('Error updating comment stats:', err);
  }

  // Decrement project owner's comments received stat (if not their own comment)
  if (project && project.userId !== userId) {
    try {
      const ownerRef = doc(db, 'users', project.userId);
      await updateDoc(ownerRef, {
        'stats.commentsReceived': increment(-1),
      });
    } catch (err) {
      console.error('Error updating comments received stat:', err);
    }
  }
}
