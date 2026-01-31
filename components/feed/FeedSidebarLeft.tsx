'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Users, Bookmark } from 'lucide-react';
import { getUserFollowing } from '@/lib/firestore/follows';
import { getUsersByIds } from '@/lib/firestore/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { OnlineIndicator } from '@/components/social/OnlineIndicator';
import { User } from '@/types/user';

interface FollowedUser extends User {
    // Extends User to include lastActiveAt
}

export function FeedSidebarLeft() {
    const { currentUser } = useAuth();
    const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFollowing() {
            if (!currentUser) return;
            try {
                const follows = await getUserFollowing(currentUser.uid);

                if (follows.length === 0) {
                    setFollowedUsers([]);
                    return;
                }

                // Get IDs of top 5 followed users
                const followingIds = follows.slice(0, 5).map(f => f.followingId);

                // Fetch full profiles efficiently
                const users = await getUsersByIds(followingIds);
                setFollowedUsers(users);

            } catch (err) {
                console.error('Error loading followed users:', err);
            } finally {
                setLoading(false);
            }
        }
        loadFollowing();
    }, [currentUser]);

    const navItems = [
        { icon: Home, label: 'Activity', href: '/feed' },
        { icon: Bookmark, label: 'Saved Projects', href: '/feed?type=saved' },
    ];

    return (
        <div className="space-y-8 sticky top-24">
            {/* Navigation */}
            <div className="space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted/10 hover:text-orange-500 rounded-lg transition-colors group"
                    >
                        <item.icon className="w-5 h-5 group-hover:text-orange-500 transition-colors" />
                        <span className="font-display uppercase tracking-wider text-sm font-bold">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Followed Artists */}
            <div>
                <h3 className="px-4 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-4">
                    Followed Artists
                </h3>
                <div className="space-y-2">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="px-4 flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))
                    ) : followedUsers.length === 0 ? (
                        <p className="px-4 text-xs text-muted-foreground italic">No followed artists yet.</p>
                    ) : (
                        followedUsers.map((user) => (
                            <Link
                                key={user.userId}
                                href={`/users/${user.username || user.userId}`}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 rounded-lg transition-colors group"
                            >
                                <div className="relative">
                                    <Avatar className="w-8 h-8 border border-border group-hover:border-orange-500/50 transition-colors">
                                        <AvatarImage src={user.photoURL} />
                                        <AvatarFallback>{(user.displayName || user.email || '?')[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <OnlineIndicator lastActiveAt={user.lastActiveAt} />
                                </div>
                                <span className="text-sm font-medium text-foreground group-hover:text-orange-500 transition-colors truncate max-w-[140px]">
                                    {user.displayName || 'Unknown Artist'}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
