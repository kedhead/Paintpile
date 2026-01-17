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
import { getArmy } from './armies';
import { getRecipe } from './recipes';
import { getUserProfile } from './users';

type CommentTargetType = 'project' | 'army' | 'recipe';

/**
 * Create a new comment on a project
 */
/**
 * Generic function to create a comment on an entity
 */
export async function createEntityComment(
  entityId: string,
  type: CommentTargetType,
  userId: string,
  username: string,
  userPhotoURL: string | undefined,
  content: string
): Promise<string> {
  const collectionName = type === 'project' ? 'projects' : type === 'army' ? 'armies' : 'recipes'; // recipes actually uses 'paintRecipes'
  const dbCollectionName = type === 'recipe' ? 'paintRecipes' : collectionName;

  const commentsRef = collection(db, dbCollectionName, entityId, 'comments');
  const newCommentRef = doc(commentsRef);
  const commentId = newCommentRef.id;

  const comment = {
    commentId,
    targetId: entityId,
    targetType: type,
    userId,
    username,
    userPhotoURL: userPhotoURL || '',
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    edited: false,
    ...(type === 'project' ? { projectId: entityId } : {}), // Legacy support only for projects
  };

  await setDoc(newCommentRef, comment);

  // Increment comment count on entity
  const entityRef = doc(db, dbCollectionName, entityId);
  await updateDoc(entityRef, {
    commentCount: increment(1), // Assuming all entities have commentCount, need to verify or add it
  });

  // Handle Notifications & Activity
  try {
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
      await createNotification({
        userId: targetOwnerId,
        type: 'comment',
        actorId: userId,
        actorUsername: username,
        actorPhotoURL: userPhotoURL,
        targetId: entityId,
        targetType: type,
        targetName: targetName,
        message: createNotificationMessage('comment', username, targetName),
        actionUrl: createActionUrl(type, entityId),
      });

      // Increment target owner's stats
      const ownerRef = doc(db, 'users', targetOwnerId);
      await updateDoc(ownerRef, {
        'stats.commentsReceived': increment(1),
      });
    }

    // Increment commenter's stats
    const commenterRef = doc(db, 'users', userId);
    await updateDoc(commenterRef, {
      'stats.commentCount': increment(1),
    });
    await checkAndAwardBadges(userId);

    // Create activity
    const commentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
    await createActivity(
      userId,
      username,
      userPhotoURL,
      'comment_created', // TODO: Make generic or reuse
      entityId,
      type,
      {
        projectName: type === 'project' ? targetName : undefined,
        armyName: type === 'army' ? targetName : undefined,
        recipeName: type === 'recipe' ? targetName : undefined,
        targetName: targetName,
        commentText: content,
        commentPreview,
        visibility: isPublic ? 'public' : 'private',
      }
    );

  } catch (err) {
    console.error('Error creating comment side-effects:', err);
  }

  return commentId;
}

/**
 * Wrapper for legacy createComment (projects)
 */
export async function createComment(
  projectId: string,
  userId: string,
  username: string,
  userPhotoURL: string | undefined,
  content: string
): Promise<string> {
  return createEntityComment(projectId, 'project', userId, username, userPhotoURL, content);
}


/**
 * Generic function to get comments
 */
export async function getEntityComments(
  entityId: string,
  type: CommentTargetType,
  limitCount: number = 50
): Promise<Comment[]> {
  const dbCollectionName = type === 'project' ? 'projects' : type === 'army' ? 'armies' : 'paintRecipes';
  const commentsRef = collection(db, dbCollectionName, entityId, 'comments');
  const q = query(
    commentsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Comment);
}

/**
 * Legacy wrapper
 */
export async function getProjectComments(projectId: string, limitCount: number = 50): Promise<Comment[]> {
  return getEntityComments(projectId, 'project', limitCount);
}

/**
 * Generic update comment
 */
export async function updateEntityComment(
  entityId: string,
  type: CommentTargetType,
  commentId: string,
  content: string
): Promise<void> {
  const dbCollectionName = type === 'project' ? 'projects' : type === 'army' ? 'armies' : 'paintRecipes';
  const commentRef = doc(db, dbCollectionName, entityId, 'comments', commentId);

  await updateDoc(commentRef, {
    content,
    updatedAt: serverTimestamp(),
    edited: true,
  });
}

// Legacy wrapper
export async function updateComment(projectId: string, commentId: string, content: string): Promise<void> {
  return updateEntityComment(projectId, 'project', commentId, content);
}


/**
 * Generic delete comment
 */
export async function deleteEntityComment(
  entityId: string,
  type: CommentTargetType,
  commentId: string,
  userId: string
): Promise<void> {
  const dbCollectionName = type === 'project' ? 'projects' : type === 'army' ? 'armies' : 'paintRecipes';
  const commentRef = doc(db, dbCollectionName, entityId, 'comments', commentId);

  // Get metadata for stats
  let targetOwnerId: string | undefined;
  try {
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
  } catch (e) { console.error(e); }

  await deleteDoc(commentRef);

  // Decrement count
  const entityRef = doc(db, dbCollectionName, entityId);
  await updateDoc(entityRef, {
    commentCount: increment(-1),
  });

  // Decrement stats
  try {
    const commenterRef = doc(db, 'users', userId);
    await updateDoc(commenterRef, {
      'stats.commentCount': increment(-1),
    });

    if (targetOwnerId && targetOwnerId !== userId) {
      const ownerRef = doc(db, 'users', targetOwnerId);
      await updateDoc(ownerRef, {
        'stats.commentsReceived': increment(-1),
      });
    }
  } catch (e) { console.error(e); }
}

// Legacy wrapper
export async function deleteComment(projectId: string, commentId: string, userId: string): Promise<void> {
  return deleteEntityComment(projectId, 'project', commentId, userId);
}
