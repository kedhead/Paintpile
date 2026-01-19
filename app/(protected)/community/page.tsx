'use client';

import { useState } from 'react';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { ActivityFeed } from '@/components/feed/ActivityFeed';
import { FeedWidgetsRight } from '@/components/feed/FeedWidgetsRight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Grid, Trophy } from 'lucide-react';

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState('gallery');

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
                                <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
                                    <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">Weekly Challenges</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Community painting challenges are launching soon!
                                        Participate, earn badges, and get featured.
                                    </p>
                                </div>
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
