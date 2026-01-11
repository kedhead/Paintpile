'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotifications, markAllNotificationsAsRead, deleteNotification } from '@/lib/firestore/notifications';
import { Notification, NotificationType } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/Button';
import { Trash2, CheckCheck } from 'lucide-react';

interface NotificationListProps {
  limitCount?: number;
}

export function NotificationList({ limitCount = 50 }: NotificationListProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  // Load notifications
  useEffect(() => {
    if (!currentUser) return;

    async function loadNotifications() {
      if (!currentUser) return;

      try {
        setLoading(true);
        const notifs = await getUserNotifications(currentUser.uid, limitCount);
        setNotifications(notifs);
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [currentUser, limitCount]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;

    try {
      await markAllNotificationsAsRead(currentUser.uid);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      await deleteNotification(currentUser.uid, notificationId);
      setNotifications(notifications.filter(n => n.notificationId !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Filter notifications
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) return null;

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('like')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'like'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Likes
        </button>
        <button
          onClick={() => setFilter('comment')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'comment'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setFilter('follow')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'follow'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Follows
        </button>
        <button
          onClick={() => setFilter('mention')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'mention'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Mentions
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'No notifications yet'
                : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <div key={notification.notificationId} className="relative group">
                <NotificationItem notification={notification} />

                {/* Delete Button (shows on hover) */}
                <button
                  onClick={() => handleDelete(notification.notificationId)}
                  className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-accent-600 hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More (placeholder for future pagination) */}
      {filteredNotifications.length >= limitCount && (
        <div className="text-center py-4">
          <Button variant="ghost" size="sm">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
