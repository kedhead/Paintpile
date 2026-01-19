'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Users, Bookmark } from 'lucide-react';
import { getUserFollowing } from '@/lib/firestore/follows';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';

interface FollowedUser {
    userId: string;
    username: string; // The URL slug
    displayName: string; // The visual name
    photoUrl?: string;
    isOnline?: boolean; // Mock status
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

                // Fetch profiles for the followed users
                const topFollows = follows.slice(0, 5);

                // Dynamic import to avoid circular dep issues
                const { getUserProfile } = await import('@/lib/firestore/users');

                const users = await Promise.all(topFollows.map(async (f) => {
                    const profile = await getUserProfile(f.followingId);
                    return {
                        userId: f.followingId,
                        username: profile?.username || '',
                        displayName: profile?.displayName || 'Unknown',
                        photoUrl: profile?.photoURL,
                        isOnline: Math.random() > 0.5 // Mock status
                    };
                }));

                // Filter out users without valid usernames/profiles
                setFollowedUsers(users.filter(u => u.username));
            } catch (err) {
                console.error('Error loading followed users:', err);
            } finally {
                setLoading(false);
            }
        }
        loadFollowing();
    }, [currentUser]);

    const navItems = [
        { icon: Home, label: 'Global Feed', href: '/feed' },
        { icon: Users, label: 'Followed Artists', href: '/feed?type=following' },

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
                                href={`/users/${user.username}`}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 rounded-lg transition-colors group"
                            >
                                <div className="relative">
                                    <Avatar className="w-8 h-8 border border-border group-hover:border-orange-500/50 transition-colors">
                                        <AvatarImage src={user.photoUrl} />
                                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                                    </Avatar>
                                    {user.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-foreground group-hover:text-orange-500 transition-colors">
                                    {user.displayName}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </div>


        </div>
    );
}
