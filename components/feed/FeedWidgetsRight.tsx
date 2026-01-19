'use client';

import Link from 'next/link';
import { Trophy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getUserProjects } from '@/lib/firestore/projects';
import { getActiveChallenge } from '@/lib/firestore/challenges';
import { Challenge } from '@/types/challenge';
import { getBadge } from '@/lib/firestore/badges';
import { Badge } from '@/types/badge';
import { Project } from '@/types/project';
import { Skeleton } from '@/components/ui/Skeleton';

export function FeedWidgetsRight() {
    const { currentUser } = useAuth();
    const [wips, setWips] = useState<Project[]>([]);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [rewardBadge, setRewardBadge] = useState<Badge | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!currentUser) return;
            try {
                const [projects, currentChallenge] = await Promise.all([
                    getUserProjects(currentUser.uid, {
                        status: 'in-progress',
                        limitCount: 3
                    }),
                    getActiveChallenge() // Fetch the single active challenge
                ]);

                setWips(projects);
                setActiveChallenge(currentChallenge);

                // Fetch Badge info if reward exists
                if (currentChallenge?.rewardBadgeId) {
                    const badge = await getBadge(currentChallenge.rewardBadgeId);
                    setRewardBadge(badge);
                }

            } catch (err) {
                console.error('Error loading widget data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentUser]);

    return (
        <div className="space-y-6 sticky top-24">
            {/* Active WIPs */}
            <div className="bg-card/50 border border-border rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                        Your Active WIPs
                    </h3>
                    <Link href="/dashboard" className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold">
                        View All
                    </Link>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                    ) : wips.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-3">No active projects</p>
                            <Link href="/projects/new">
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                    <Plus className="w-3 h-3 mr-1" /> Start Project
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        wips.map(project => (
                            <Link
                                key={project.projectId}
                                href={`/projects/${project.projectId}`}
                                className="block group"
                            >
                                <div className="flex gap-3 mb-2">
                                    <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden border border-border group-hover:border-orange-500/50 transition-colors">
                                        <div className="w-full h-full bg-muted-foreground/10 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-muted-foreground">{project.name[0]}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">
                                            {project.name}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {(project as any).faction || (project.tags && project.tags[0]) || 'Hobby Project'}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500"
                                        style={{ width: `${Math.min(100, Math.max(10, (project.paintCount || 0) * 5))}%` }}
                                    />
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <Link href="/projects/new" className="block mt-4 pt-4 border-t border-border text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-500 transition-colors uppercase tracking-wider">
                        <Plus className="w-3 h-3" />
                        Add Snapshot
                    </div>
                </Link>
            </div>

            {/* Weekly Challenge (Dynamic) */}
            {activeChallenge && (
                <div className="bg-gradient-to-br from-orange-950/20 to-background border border-orange-500/20 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="w-24 h-24 text-orange-500" />
                    </div>

                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                        Weekly Challenge
                    </h3>

                    <Link href={`/challenges/${activeChallenge.id}`}>
                        <h4 className="text-lg font-display font-bold text-foreground mb-2 leading-tight hover:underline decoration-orange-500/50 underline-offset-4">
                            {activeChallenge.title}
                        </h4>
                    </Link>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {activeChallenge.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                        {rewardBadge ? (
                            <div className="flex items-center gap-2 bg-yellow-500/10 px-2.5 py-1.5 rounded-lg border border-yellow-500/20">
                                <span className="text-xl">{rewardBadge.icon}</span>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wider">Reward</span>
                                    <span className="text-xs font-bold text-yellow-500">{rewardBadge.name}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">{activeChallenge.participantCount || 0}</span> participants
                            </div>
                        )}
                    </div>

                    <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider text-xs">
                        Join Challenge
                    </Button>
                </div>
            )}

            {/* Footer Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                <Link href="#" className="hover:text-foreground">About</Link>
                <Link href="#" className="hover:text-foreground">Privacy</Link>
                <Link href="#" className="hover:text-foreground">Terms</Link>
                <span>© 2026 PaintPile</span>
            </div>
        </div>
    );
}
