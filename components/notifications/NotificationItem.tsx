'use client';

import { Notification, NotificationType } from '@/types/notification';
import { Heart, MessageCircle, UserPlus, AtSign, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { markNotificationAsRead } from '@/lib/firestore/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { currentUser } = useAuth();

  const handleClick = async () => {
    if (!currentUser) return;

    // Mark as read when clicked
    if (!notification.read) {
      try {
        await markNotificationAsRead(currentUser.uid, notification.notificationId);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    onClick?.();
  };

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-accent-500 fill-accent-500" />;
      case 'comment':
      case 'comment_reply':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format timestamp
  const timeAgo = notification.createdAt
    ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
    : '';

  return (
    <Link
      href={notification.actionUrl}
      onClick={handleClick}
      className={`block px-4 py-3 hover:bg-muted/50 transition-colors ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Actor Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {notification.actorPhotoURL ? (
            <img
              src={notification.actorPhotoURL}
              alt={notification.actorUsername}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {notification.actorUsername[0]?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
          </div>

          {/* Unread Indicator */}
          {!notification.read && (
            <div className="mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
