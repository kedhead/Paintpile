'use client';

import { FeedSidebarLeft } from '@/components/feed/FeedSidebarLeft';
import { FeedWidgetsRight } from '@/components/feed/FeedWidgetsRight';
import { ActivityFeed } from '@/components/activity/ActivityFeed';

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        {/* Left Sidebar (Navigation) */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2">
          <FeedSidebarLeft />
        </aside>

        {/* Main Feed */}
        <main className="col-span-1 md:col-span-9 lg:col-span-7">
          {/* Mobile Header (optional, usually handled by main layout but good to have title here) */}
          <div className="mb-6 md:hidden">
            <h1 className="font-display font-bold text-2xl">Community Feed</h1>
          </div>

          <ActivityFeed feedType="following" />
        </main>

        {/* Right Sidebar (Widgets) */}
        <aside className="hidden lg:block lg:col-span-3">
          <FeedWidgetsRight />
        </aside>
      </div>
    </div>
  );
}
