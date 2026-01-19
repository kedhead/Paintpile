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
        <main className="col-span-1 md:col-span-9 lg:col-span-7 flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex items-end justify-between px-2 md:px-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground">
                My <span className="text-primary/50">Feed</span>
              </h1>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mt-1">
                Updates from users you follow
              </p>
            </div>
            {/* Visual Tabs (logic handled in active component, just placeholder for layout match or we can move tabs here later) */}
            <div className="hidden md:flex border-b border-border gap-6">
              {/* We just show the header here. The actual tabs are inside ActivityFeed component. 
                   We might want to rethink this structure later, but for now let's keep the title here. */}
            </div>
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
