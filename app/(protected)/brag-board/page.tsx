'use client';

import { useState, useEffect } from 'react';
import { getBragBoardActivities } from '@/lib/firestore/activities';
import { Activity } from '@/types/activity';
import { ActivityItem } from '@/components/activity/ActivityItem';
import { Spinner } from '@/components/ui/Spinner';
import { Trophy, Sparkles } from 'lucide-react';

export default function BragBoardPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadActivities() {
            try {
                setLoading(true);
                const loadedActivities = await getBragBoardActivities(50);
                setActivities(loadedActivities);
            } catch (err) {
                console.error('Error loading brag board activities:', err);
            } finally {
                setLoading(false);
            }
        }

        loadActivities();
    }, []);

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    <h1 className="text-4xl font-black uppercase tracking-tight">The Brag Board</h1>
                    <Sparkles className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Hall of Fame for the best miniatures analyzed by our AI Critic.
                    See how others are scoring and get inspired!
                </p>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <Spinner size="lg" />
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-muted">
                    <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-muted-foreground">No brag cards yet</h3>
                    <p className="text-muted-foreground/60 mt-2">
                        Be the first to analyze your miniature and share your score!
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {activities.map((activity) => (
                        <ActivityItem
                            key={activity.activityId}
                            activity={activity}
                            onDelete={(id) => setActivities(prev => prev.filter(a => a.activityId !== id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
