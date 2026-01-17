'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllBadges, getUserBadges, syncAndAwardBadges } from '@/lib/firestore/badges';
import { Badge, UserBadge, BadgeCategory } from '@/types/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Trophy, Lock, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils'; // Make sure cn utility is available or use clsx

export default function BadgesPage() {
    const { currentUser } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!currentUser) return;
            try {
                const [allBadges, earned] = await Promise.all([
                    getAllBadges(),
                    getUserBadges(currentUser.uid)
                ]);
                setBadges(allBadges);
                setUserBadges(earned);
            } catch (error) {
                console.error("Failed to load badges", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentUser]);

    async function handleSync() {
        if (!currentUser) return;
        setSyncing(true);
        try {
            await syncAndAwardBadges(currentUser.uid);
            // Reload user badges to reflect any newly awarded ones
            const earned = await getUserBadges(currentUser.uid);
            setUserBadges(earned);
        } catch (error) {
            console.error("Sync failed", error);
            alert("Failed to sync badges. Please try again.");
        } finally {
            setSyncing(false);
        }
    }

    if (loading) {
        return <div className="p-12 flex justify-center"><Spinner size="lg" /></div>;
    }

    // Group badges by category
    const categories: BadgeCategory[] = ['projects', 'armies', 'recipes', 'social', 'community', 'special', 'engagement', 'time'];
    const groupedBadges = categories.reduce((acc, cat) => {
        const catBadges = badges.filter(b => b.category === cat);
        if (catBadges.length > 0) acc[cat] = catBadges;
        return acc;
    }, {} as Record<BadgeCategory, Badge[]>);

    const isEarned = (badgeId: string) => userBadges.some(ub => ub.badgeId === badgeId);

    const totalPoints = userBadges.reduce((sum, ub) => {
        const badge = badges.find(b => b.id === ub.badgeId);
        return sum + (badge?.points || 0);
    }, 0);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-2xl border border-yellow-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-yellow-500/20 rounded-full">
                        <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Your Achievements</h1>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSync}
                                disabled={syncing}
                                className="h-8 w-8 p-0 rounded-full"
                                title="Check for missing badges"
                            >
                                <RotateCw className={cn("w-4 h-4 text-muted-foreground", syncing && "animate-spin")} />
                            </Button>
                        </div>
                        <p className="text-muted-foreground">Track your progress and painting milestones</p>
                    </div>
                </div>
                <div className="flex gap-8 text-center">
                    <div>
                        <div className="text-3xl font-bold text-primary">{userBadges.length}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Badges</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Points</div>
                    </div>
                </div>
            </div>

            {/* Badge Grid by Category */}
            {Object.entries(groupedBadges).map(([category, catBadges]) => (
                <div key={category} className="space-y-4">
                    <h2 className="text-xl font-bold capitalize flex items-center gap-2">
                        {category} Badges
                        <span className="text-sm font-normal text-muted-foreground ml-auto">
                            {catBadges.filter(b => isEarned(b.id)).length} / {catBadges.length}
                        </span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {catBadges.map(badge => {
                            const earned = isEarned(badge.id);
                            if (badge.hidden && !earned) return null; // Hide secret badges

                            return (
                                <div
                                    key={badge.id}
                                    className={cn(
                                        "relative flex flex-col items-center p-4 rounded-xl border transition-all text-center h-full",
                                        earned
                                            ? "bg-card border-border shadow-sm"
                                            : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-70 grayscale"
                                    )}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner"
                                        style={{
                                            backgroundColor: earned ? `${badge.color}20` : undefined,
                                            borderColor: badge.color
                                        }}
                                    >
                                        {earned ? badge.icon : <Lock className="w-5 h-5 opacity-50" />}
                                    </div>
                                    <h3 className="font-bold text-sm mb-1">{badge.name}</h3>
                                    <p className="text-[10px] text-muted-foreground line-clamp-3 mb-2">{badge.description}</p>

                                    {!earned && (
                                        <div className="mt-auto pt-2 text-[10px] font-medium text-primary/80 bg-primary/5 px-2 py-0.5 rounded">
                                            {badge.requirement}
                                        </div>
                                    )}

                                    {earned && (
                                        <div className="mt-auto text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                                            Earned!
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
