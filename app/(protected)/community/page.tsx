'use client';

import { useState, useEffect } from 'react';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { FeedWidgetsRight } from '@/components/feed/FeedWidgetsRight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Grid, Trophy, Calendar, Paintbrush } from 'lucide-react';
import { getActiveChallenge } from '@/lib/firestore/challenges';
import { Challenge } from '@/types/challenge';
import { EntryGallery } from '@/components/challenges/EntryGallery';
import { SubmitEntryDialog } from '@/components/challenges/SubmitEntryDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState('gallery');
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    useEffect(() => {
        async function loadChallenge() {
            try {
                const active = await getActiveChallenge();
                setChallenge(active);
            } catch (err) {
                console.error("Failed to load challenge:", err);
            } finally {
                setLoadingChallenge(false);
            }
        }
        loadChallenge();
    }, []);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Header */}
            <div className="relative h-64 md:h-80 overflow-hidden border-b border-border">
                <div className="absolute inset-0">
                    <img
                        src="/images/header.png"
                        alt="Community Hub"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2 drop-shadow-lg">
                            Community Hub
                        </h2>
                        <p className="text-muted-foreground max-w-xl text-lg font-light">
                            "Explore the Paintpile universe. Discover artists, join challenges, and get inspired."
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 -mt-8 relative z-10">
                <Tabs defaultValue="gallery" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="activity" className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Activity
                            </TabsTrigger>
                            <TabsTrigger value="gallery" className="flex items-center gap-2">
                                <Grid className="w-4 h-4" />
                                Gallery
                            </TabsTrigger>
                            <TabsTrigger value="challenges" className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Challenges
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="activity">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Main Feed Column */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-primary" />
                                        Global Stream
                                    </h3>
                                    <p className="text-muted-foreground mb-6">
                                        Real-time updates from artists around the world.
                                    </p>
                                    <ActivityFeed feedType="global" />
                                </div>
                            </div>

                            {/* Widgets Column */}
                            <div className="lg:col-span-4 space-y-6">
                                <FeedWidgetsRight />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="gallery">
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[500px]">
                            <GalleryGrid />
                        </div>
                    </TabsContent>

                    <TabsContent value="challenges">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8">
                                {loadingChallenge ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-64 w-full rounded-xl" />
                                        <Skeleton className="h-10 w-48" />
                                    </div>
                                ) : challenge ? (
                                    <div className="space-y-8">
                                        {/* Active Challenge Card */}
                                        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm relative">
                                            <div className="absolute top-0 right-0 p-4">
                                                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                                    ACTIVE
                                                </span>
                                            </div>

                                            <div className="p-8 md:p-10 text-center space-y-4">
                                                <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-2" />
                                                <h3 className="text-3xl font-display font-bold">{challenge.title}</h3>
                                                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                                                    {challenge.description}
                                                </p>

                                                import {CountdownTimer} from '@/components/ui/CountdownTimer';

                                                // ... (inside the component return)

                                                <div className="flex justify-center items-center gap-6 py-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs uppercase tracking-widest opacity-70">Time Remaining:</span>
                                                        <CountdownTimer targetDate={challenge.endDate} />
                                                    </div>
                                                    <div className="w-px h-8 bg-border" />
                                                    <div className="flex items-center gap-2">
                                                        <Paintbrush className="w-4 h-4" />
                                                        <span>{challenge.participantCount || 0} Entries</span>
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <SubmitEntryDialog challengeId={challenge.id} onSuccess={() => window.location.reload()}>
                                                        {/* Simple reload to refresh entries grid for now */}
                                                        <Button size="lg" className="px-8 shadow-primary/25 shadow-lg">
                                                            Enter Challenge
                                                        </Button>
                                                    </SubmitEntryDialog>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Entries Gallery */}
                                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                            <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <Grid className="w-5 h-5" />
                                                Community Entries
                                            </h4>
                                            <EntryGallery challengeId={challenge.id} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-card rounded-xl border border-border p-16 text-center shadow-sm">
                                        <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                        <h3 className="text-2xl font-bold mb-2">No Active Challenges</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto">
                                            The paint gods are resting. Check back soon for the next community event!
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="lg:col-span-4 space-y-6">
                                <FeedWidgetsRight />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
