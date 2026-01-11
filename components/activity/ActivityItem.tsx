'use client';

import { Activity, ACTIVITY_MESSAGES } from '@/types/activity';
import { Heart, MessageCircle, UserPlus, Shield, Palette, BookOpen, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Get icon based on activity type
  const getIcon = () => {
    switch (activity.type) {
      case 'project_created':
        return <Palette className="w-5 h-5 text-blue-500" />;
      case 'project_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'project_liked':
        return <Heart className="w-5 h-5 text-accent-500 fill-accent-500" />;
      case 'army_created':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'army_liked':
        return <Heart className="w-5 h-5 text-accent-500 fill-accent-500" />;
      case 'recipe_created':
        return <BookOpen className="w-5 h-5 text-orange-500" />;
      case 'recipe_liked':
        return <Heart className="w-5 h-5 text-accent-500 fill-accent-500" />;
      case 'user_followed':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'comment_created':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Palette className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get the target URL
  const getTargetUrl = () => {
    switch (activity.targetType) {
      case 'project':
        return `/projects/${activity.targetId}`;
      case 'army':
        return `/armies/${activity.targetId}`;
      case 'recipe':
        return `/recipes/${activity.targetId}`;
      case 'user':
        return `/users/${activity.targetId}`;
      default:
        return '#';
    }
  };

  // Format timestamp
  const timeAgo = activity.createdAt
    ? formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })
    : '';

  // Generate activity message
  const message = ACTIVITY_MESSAGES[activity.type](activity.metadata);

  return (
    <Link
      href={getTargetUrl()}
      className="block px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
    >
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {activity.userPhotoUrl ? (
            <img
              src={activity.userPhotoUrl}
              alt={activity.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {activity.username[0]?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{activity.username}</span>{' '}
                <span className="text-muted-foreground">{message}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
          </div>

          {/* Preview Image (if available) */}
          {(activity.metadata.projectPhotoUrl || activity.metadata.armyPhotoUrl) && (
            <div className="mt-2 ml-7">
              <img
                src={activity.metadata.projectPhotoUrl || activity.metadata.armyPhotoUrl}
                alt="Preview"
                className="w-16 h-16 rounded-md object-cover border border-border"
              />
            </div>
          )}

          {/* Comment Preview (if comment activity) */}
          {activity.type === 'comment_created' && activity.metadata.commentPreview && (
            <div className="mt-2 ml-7 p-2 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                "{activity.metadata.commentPreview}"
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
