import { Timestamp } from 'firebase/firestore';

/**
 * Types of notifications that can be sent to users
 */
export type NotificationType =
  | 'follow'           // Someone followed you
  | 'like'             // Someone liked your project/army
  | 'comment'          // Someone commented on your project/army
  | 'comment_reply'    // Someone replied to your comment
  | 'mention'          // Someone mentioned you in a comment
  | 'badge_earned';    // You earned a badge

/**
 * Type of entity being referenced in notification
 */
export type NotificationTargetType =
  | 'project'
  | 'army'
  | 'recipe'
  | 'comment'
  | 'user'
  | 'badge';

/**
 * Notification document stored in users/{userId}/notifications collection
 */
export interface Notification {
  notificationId: string;
  userId: string;              // Recipient of the notification
  type: NotificationType;

  // Actor (person who triggered the notification)
  actorId: string;
  actorUsername: string;
  actorPhotoURL?: string;

  // Target entity
  targetId: string;            // ID of project, army, recipe, etc.
  targetType: NotificationTargetType;
  targetName?: string;         // Name of the target entity

  message: string;             // Human-readable message
  read: boolean;
  createdAt: Timestamp;
  actionUrl: string;           // URL to navigate to when clicked
}

/**
 * User's notification preferences
 */
export interface NotificationPreferences {
  // In-app notifications
  inApp: {
    follows: boolean;
    likes: boolean;
    comments: boolean;
    commentReplies: boolean;
    mentions: boolean;
  };

  // Email notifications (for future implementation)
  email: {
    enabled: boolean;
    follows: boolean;
    likes: boolean;
    comments: boolean;
    commentReplies: boolean;
    mentions: boolean;
    digestMode: boolean;        // Send daily digest instead of immediate
    digestTime: string;         // Time of day for digest (e.g., "09:00")
  };

  // Push notifications (for future mobile app)
  push: {
    enabled: boolean;
    follows: boolean;
    likes: boolean;
    comments: boolean;
    commentReplies: boolean;
    mentions: boolean;
  };
}

/**
 * Default notification preferences for new users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inApp: {
    follows: true,
    likes: true,
    comments: true,
    commentReplies: true,
    mentions: true,
  },
  email: {
    enabled: false,
    follows: false,
    likes: false,
    comments: true,
    commentReplies: true,
    mentions: true,
    digestMode: true,
    digestTime: '09:00',
  },
  push: {
    enabled: false,
    follows: true,
    likes: true,
    comments: true,
    commentReplies: true,
    mentions: true,
  },
};

/**
 * Helper type for creating notifications
 */
export type CreateNotificationData = Omit<Notification, 'notificationId' | 'createdAt' | 'read'>;
