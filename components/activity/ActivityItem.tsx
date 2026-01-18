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
        return `/users/${activity.metadata?.targetUsername || activity.targetId}`;
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

  // Determine if this is a "rich" activity (one that should show a big image)
  const isRichActivity = ['project_created', 'army_created', 'recipe_created'].includes(activity.type);
  const heroImage = activity.metadata.projectPhotoUrl || activity.metadata.armyPhotoUrl;

  return (
    <Link
      href={getTargetUrl()}
      className="block bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-4 hover:shadow-md transition-shadow group"
    >
      {/* Header: User & Action */}
      <div className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
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

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <span className="font-bold hover:underline">{activity.username}</span>{' '}
            <span className="text-muted-foreground">{message.replace(`: ${activity.metadata.projectName || activity.metadata.armyName || activity.metadata.recipeName || ''}`, '')}</span>
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>

        <div className="text-muted-foreground opacity-50">
          {getIcon()}
        </div>
      </div>

      {/* Hero Content (for projects/armies) */}
      {isRichActivity && (
        <div className="border-t border-border bg-muted/30">
          {heroImage && (
            <div className="relative aspect-video w-full overflow-hidden">
              <img
                src={heroImage}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-display font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
              {activity.metadata.projectName || activity.metadata.armyName || activity.metadata.recipeName}
            </h3>
            {activity.metadata.status && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-secondary text-secondary-foreground">
                {activity.metadata.status}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Compact Content (for comments/likes/follows) */}
      {!isRichActivity && (
        <div className="px-4 pb-4 pl-16">
          {/* Detailed Context for other types */}
          {(activity.metadata.projectName || activity.metadata.armyName || activity.metadata.recipeName) && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border mt-1">
              <p className="font-medium text-sm text-foreground">
                {activity.metadata.projectName || activity.metadata.armyName || activity.metadata.recipeName}
              </p>
            </div>
          )}

          {/* Comment Preview */}
          {activity.type === 'comment_created' && activity.metadata.commentPreview && (
            <div className="mt-2 text-sm text-muted-foreground italic border-l-2 border-border pl-3">
              "{activity.metadata.commentPreview}"
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
