'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChallengeEntry } from '@/types/challenge';
import { getChallengeEntries } from '@/lib/firestore/challenges';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EntryGalleryProps {
    challengeId: string;
}

export function EntryGallery({ challengeId }: EntryGalleryProps) {
    const [entries, setEntries] = useState<ChallengeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEntries() {
            try {
                const data = await getChallengeEntries(challengeId);
                setEntries(data);
            } catch (err) {
                console.error("Failed to load entries:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchEntries();
    }, [challengeId]);

    if (loading) {
        return <div className="text-center py-10 text-muted-foreground">Loading entries...</div>;
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No entries yet. Be the first!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map((entry) => (
                <Link key={entry.entryId} href={`/projects/${entry.projectId}`} className="block group">
                    <Card className="overflow-hidden border-border/40 bg-card hover:border-primary/50 transition-colors h-full">
                        <div className="aspect-square relative overflow-hidden bg-muted">
                            {entry.photoUrl ? (
                                <img
                                    src={entry.photoUrl}
                                    alt={entry.projectTitle}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                </div>
                            )}

                            {/* Overlay info */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                <p className="text-white text-sm font-medium truncate">{entry.projectTitle}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={entry.userPhotoUrl} />
                                        <AvatarFallback className="text-[8px]">?</AvatarFallback>
                                    </Avatar>
                                    <span className="text-white/80 text-xs truncate">
                                        {entry.userDisplayName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
