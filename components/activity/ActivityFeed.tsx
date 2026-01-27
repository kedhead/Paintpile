'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserActivities, getFollowingActivities, getGlobalActivities, getSavedActivities } from '@/lib/firestore/activities';
import { Activity, ActivityType } from '@/types/activity';
import { ActivityItem } from './ActivityItem';
import { Button } from '@/components/ui/Button';

interface ActivityFeedProps {
  feedType: 'user' | 'following' | 'global' | 'saved';
  userId?: string; // Required for 'user' feed type
  limitCount?: number;
}

export function ActivityFeed({ feedType, userId, limitCount = 50 }: ActivityFeedProps) {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ActivityType>('all');

  // Load activities based on feed type
  useEffect(() => {
    async function loadActivities() {
      if (feedType === 'user' && !userId) return;
      if (feedType === 'following' && !currentUser) return;
      if (feedType === 'saved' && !currentUser) return;

      try {
        setLoading(true);
        let loadedActivities: Activity[] = [];

        switch (feedType) {
          case 'user':
            if (userId) {
              loadedActivities = await getUserActivities(userId, limitCount);
            }
            break;
          case 'following':
            if (currentUser) {
              loadedActivities = await getFollowingActivities(currentUser.uid, limitCount);
            }
            break;
          case 'saved':
            if (currentUser) {
              loadedActivities = await getSavedActivities(currentUser.uid, limitCount);
            }
            break;
          case 'global':
            loadedActivities = await getGlobalActivities(limitCount);
            break;
        }

        setActivities(loadedActivities);
      } catch (err) {
        console.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [feedType, userId, currentUser, limitCount]);

  // Filter activities
  const filteredActivities = activities.filter(a => {
    // 1. Visibility Check: Hide private activities if not the owner
    // This handles cases where a project was private when created, or became private later
    // (requires metadata.visibility to be kept in sync via projects.ts)
    if (a.metadata?.visibility === 'private' && a.userId !== currentUser?.uid) {
      return false;
    }

    // 2. Type Filter
    if (filter === 'all') return true;

    if (filter === 'project_liked') {
      return a.type.includes('liked');
    }
    return a.type === filter;
  });

  const handleDelete = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.activityId !== activityId));
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('project_created')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'project_created'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Projects
        </button>
        <button
          onClick={() => setFilter('army_created')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'army_created'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Armies
        </button>
        <button
          onClick={() => setFilter('recipe_created')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'recipe_created'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Recipes
        </button>
        <button
          onClick={() => setFilter('project_liked')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'project_liked'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Likes
        </button>
        <button
          onClick={() => setFilter('comment_created')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'comment_created'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Comments
        </button>
        <button
          onClick={() => setFilter('user_followed')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === 'user_followed'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Follows
        </button>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {loading ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            Loading activities...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="px-4 py-12 text-center bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">
              {filter === 'all'
                ? feedType === 'following'
                  ? 'No activities from people you follow yet. Follow some users to see their updates!'
                  : feedType === 'saved'
                    ? 'You haven\'t saved any projects yet. Bookmark projects to see their updates here!'
                    : 'No activities yet'
                : `No ${filter.replace('_', ' ')} activities`}
            </p>
          </div>
        ) : (
          <div>
            {filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.activityId}
                activity={activity}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More (placeholder for future pagination) */}
      {filteredActivities.length >= limitCount && (
        <div className="text-center py-4">
          <Button variant="ghost" size="sm">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
