'use client';

import { useState, useEffect } from 'react';
import { ChallengeEntry } from '@/types/challenge';
import { getChallengeEntries, pickChallengeWinner } from '@/lib/firestore/challenges';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChallengeEntryListProps {
    challengeId: string;
    onWinnerPicked: () => void;
}

export function ChallengeEntryList({ challengeId, onWinnerPicked }: ChallengeEntryListProps) {
    const [entries, setEntries] = useState<ChallengeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [pickingWinner, setPickingWinner] = useState<string | null>(null);

    useEffect(() => {
        loadEntries();
    }, [challengeId]);

    async function loadEntries() {
        setLoading(true);
        try {
            const data = await getChallengeEntries(challengeId);
            setEntries(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load entries");
        } finally {
            setLoading(false);
        }
    }

    async function handlePickWinner(entry: ChallengeEntry) {
        if (!confirm(`Are you sure you want to select "${entry.projectTitle}" by ${entry.userDisplayName} as the WINNER?
        
This will:
1. End the challenge
2. Award the badge to the user
3. Post a notification`)) {
            return;
        }

        setPickingWinner(entry.entryId);
        try {
            await pickChallengeWinner(challengeId, entry.entryId);
            toast.success("Winner selected successfully!");
            onWinnerPicked();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to pick winner");
        } finally {
            setPickingWinner(null);
        }
    }

    if (loading) return <div>Loading entries...</div>;

    if (entries.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border border-dashed rounded bg-muted/20">No entries yet.</div>;
    }

    // Sort by votes? Or just random/date for now. Default is date desc.
    return (
        <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Select a Winner ({entries.length} Entries)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {entries.map(entry => (
                    <div key={entry.entryId} className="flex gap-4 p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                        <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                            {entry.photoUrl && (
                                <img src={entry.photoUrl} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate" title={entry.projectTitle}>{entry.projectTitle}</p>
                            <p className="text-sm text-muted-foreground truncate">by {entry.userDisplayName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(entry.submittedAt.toDate()).toLocaleDateString()}
                            </p>

                            <Button
                                size="sm"
                                className="mt-2 w-full"
                                variant="outline"
                                onClick={() => handlePickWinner(entry)}
                                disabled={!!pickingWinner}
                            >
                                {pickingWinner === entry.entryId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Select as Winner
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
