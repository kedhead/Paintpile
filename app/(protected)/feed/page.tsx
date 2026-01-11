'use client';

import { ActivityFeed } from '@/components/activity/ActivityFeed';

export default function FeedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Following Feed</h2>
        <p className="text-sm text-muted-foreground mt-1">
          See what people you follow are working on
        </p>
      </div>

      <ActivityFeed feedType="following" limitCount={100} />
    </div>
  );
}
