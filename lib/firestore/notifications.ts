import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import {
  Notification,
  CreateNotificationData,
  NotificationType,
} from '@/types/notification';

/**
 * Create a new notification for a user
 */
export async function createNotification(
  notificationData: CreateNotificationData
): Promise<string> {
  const notificationsRef = collection(
    db,
    'users',
    notificationData.userId,
    'notifications'
  );
  const newNotificationRef = doc(notificationsRef);
  const notificationId = newNotificationRef.id;

  const notification: Omit<Notification, 'notificationId' | 'createdAt' | 'read'> & {
    notificationId: string;
    createdAt: any;
    read: boolean;
  } = {
    notificationId,
    userId: notificationData.userId,
    type: notificationData.type,
    actorId: notificationData.actorId,
    actorUsername: notificationData.actorUsername,
    actorPhotoURL: notificationData.actorPhotoURL,
    targetId: notificationData.targetId,
    targetType: notificationData.targetType,
    targetName: notificationData.targetName,
    message: notificationData.message,
    read: false,
    createdAt: serverTimestamp(),
    actionUrl: notificationData.actionUrl,
  };

  await setDoc(newNotificationRef, notification);

  // Increment unread count on user document (denormalized for efficiency)
  // This is stored in a separate field for quick access
  const userRef = doc(db, 'users', notificationData.userId);
  await updateDoc(userRef, {
    unreadNotificationCount: increment(1),
  });

  return notificationId;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');

  try {
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Notification);
  } catch (error: any) {
    // Fallback: If index is missing or error occurs, try basic query without sort
    console.warn('Notification sort failed, falling back to unsorted:', error);
    const fallbackQ = query(notificationsRef, limit(limitCount));
    const fallbackSnap = await getDocs(fallbackQ);
    // Sort in memory as fallback
    const notifications = fallbackSnap.docs.map((doc) => doc.data() as Notification);
    return notifications.sort((a, b) => {
      // Handle potential missing createdAt
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }
}

// ... existing code ...
import { Timestamp } from 'firebase/firestore';

// ... existing code ...

/**
 * Get notifications for a user since a specific timestamp
 */
export async function getNotificationsSince(
  userId: string,
  since: Timestamp | Date
): Promise<{
  newFollowers: number;
  newLikes: number;
  newComments: number;
  samples: Notification[];
}> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const sinceDate = since instanceof Date ? since : since.toDate();

  const q = query(
    notificationsRef,
    where('createdAt', '>', sinceDate),
    orderBy('createdAt', 'desc'),
    limit(20) // Limit sample size
  );

  const querySnapshot = await getDocs(q);
  const notifications = querySnapshot.docs.map((doc) => doc.data() as Notification);

  // Calculate stats
  let newFollowers = 0;
  let newLikes = 0;
  let newComments = 0;

  notifications.forEach((n) => {
    if (n.type === 'follow') newFollowers++;
    else if (n.type === 'like') newLikes++;
    else if (n.type === 'comment' || n.type === 'comment_reply' || n.type === 'mention') newComments++;
  });

  return {
    newFollowers,
    newLikes,
    newComments,
    samples: notifications.slice(0, 3) // Return 3 most recent as samples
  };
}
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  // Try to get from denormalized field first (faster)
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    return userData.unreadNotificationCount || 0;
  }

  // Fallback: count unread notifications (slower)
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, where('read', '==', false));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(
    db,
    'users',
    userId,
    'notifications',
    notificationId
  );

  // Check if already read to avoid unnecessary writes
  const notificationSnap = await getDoc(notificationRef);
  if (notificationSnap.exists() && !notificationSnap.data().read) {
    await updateDoc(notificationRef, {
      read: true,
    });

    // Decrement unread count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      unreadNotificationCount: increment(-1),
    });
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, where('read', '==', false));

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  querySnapshot.docs.forEach((notificationDoc) => {
    batch.update(notificationDoc.ref, {
      read: true,
    });
  });

  // Reset unread count
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    unreadNotificationCount: 0,
  });

  await batch.commit();
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(
    db,
    'users',
    userId,
    'notifications',
    notificationId
  );

  // Check if unread before deleting
  const notificationSnap = await getDoc(notificationRef);
  const wasUnread =
    notificationSnap.exists() && !notificationSnap.data().read;

  await deleteDoc(notificationRef);

  // Decrement unread count if notification was unread
  if (wasUnread) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      unreadNotificationCount: increment(-1),
    });
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const querySnapshot = await getDocs(notificationsRef);

  const batch = writeBatch(db);

  querySnapshot.docs.forEach((notificationDoc) => {
    batch.delete(notificationDoc.ref);
  });

  // Reset unread count
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    unreadNotificationCount: 0,
  });

  await batch.commit();
}

/**
 * Helper function to create a notification message based on type
 */
export function createNotificationMessage(
  type: NotificationType,
  actorUsername: string,
  targetName?: string
): string {
  switch (type) {
    case 'follow':
      return `${actorUsername} started following you`;
    case 'like':
      return targetName
        ? `${actorUsername} liked your ${targetName}`
        : `${actorUsername} liked your content`;
    case 'comment':
      return targetName
        ? `${actorUsername} commented on ${targetName}`
        : `${actorUsername} commented on your content`;
    case 'comment_reply':
      return `${actorUsername} replied to your comment`;
    case 'mention':
      return `${actorUsername} mentioned you in a comment`;
    default:
      return `${actorUsername} interacted with your content`;
  }
}

/**
 * Helper function to create action URL based on target type
 */
export function createActionUrl(
  targetType: string,
  targetId: string
): string {
  switch (targetType) {
    case 'project':
      return `/projects/${targetId}`;
    case 'army':
      return `/armies/${targetId}`;
    case 'recipe':
      return `/recipes/${targetId}`;
    case 'user':
      return `/users/${targetId}`;
    default:
      return '/notifications';
  }
}

/**
 * Send email notification (placeholder for future implementation)
 */
export async function sendEmailNotification(
  userId: string,
  notification: Notification
): Promise<void> {
  // TODO: Implement email notification using SendGrid, AWS SES, or similar
  // For now, this is a placeholder
  console.log('Email notification would be sent:', {
    userId,
    notification,
  });
}
