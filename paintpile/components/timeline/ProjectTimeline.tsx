'use client';

import { useEffect, useState } from 'react';
import { TimelineEvent as TimelineEventType } from '@/types/timeline';
import { TimelineEvent } from './TimelineEvent';
import { getProjectTimeline } from '@/lib/firestore/timeline';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [events, setEvents] = useState<TimelineEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [projectId]);

  async function loadEvents(loadMore = false) {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await getProjectTimeline(
        projectId,
        20,
        loadMore ? lastDoc || undefined : undefined
      );

      if (loadMore) {
        setEvents([...events, ...result.events]);
      } else {
        setEvents(result.events);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.events.length === 20);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    loadEvents(true);
  }

  // Group events by date
  function groupEventsByDate() {
    const grouped: { date: string; events: TimelineEventType[] }[] = [];

    events.forEach((event) => {
      const date = event.timestamp?.toDate?.();
      if (!date) return;

      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const existingGroup = grouped.find((g) => g.date === dateKey);
      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        grouped.push({ date: dateKey, events: [event] });
      }
    });

    return grouped;
  }

  const groupedEvents = groupEventsByDate();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline ({events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No timeline events yet.</p>
            <p className="text-sm mt-2">
              Events will appear here as you work on your project.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedEvents.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Date Header */}
                <div className="sticky top-0 bg-card border border-border px-3 py-2 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.date}
                  </h3>
                </div>

                {/* Events for this date */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                  {/* Events */}
                  <div className="space-y-0">
                    {group.events.map((event) => (
                      <TimelineEvent key={event.eventId} event={event} />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  isLoading={loadingMore}
                  disabled={loadingMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
