'use client';

import { useEffect, useState } from 'react';
import { getUserProfile, updateLastLogin } from '@/lib/firestore/users';
import { getNotificationsSince } from '@/lib/firestore/notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ArrowRight, PartyPopper, Heart, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface WelcomeBackModalProps {
    userId: string;
    userName: string;
}

export function WelcomeBackModal({ userId, userName }: WelcomeBackModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        newFollowers: 0,
        newLikes: 0,
        newComments: 0,
    });
    const [samples, setSamples] = useState<any[]>([]);

    useEffect(() => {
        async function checkActivity() {
            try {
                // Fetch full user profile to get lastLoginAt
                const userProfile = await getUserProfile(userId);

                if (!userProfile) return;

                // If no last login recorded (first time or legacy user), just update timestamp and exit
                if (!userProfile.lastLoginAt) {
                    await updateLastLogin(userId);
                    return;
                }

                const result = await getNotificationsSince(userId, userProfile.lastLoginAt);

                const hasActivity = result.newFollowers > 0 || result.newLikes > 0 || result.newComments > 0;

                if (hasActivity) {
                    setStats({
                        newFollowers: result.newFollowers,
                        newLikes: result.newLikes,
                        newComments: result.newComments,
                    });
                    setSamples(result.samples);
                    setIsOpen(true);
                } else {
                    // No new activity, update timestamp silently
                    await updateLastLogin(userId);
                }
            } catch (err) {
                console.error('Error checking welcome back activity:', err);
            } finally {
                setLoading(false);
            }
        }

        checkActivity();
    }, [userId]);

    const handleClose = async () => {
        setIsOpen(false);
        // Update last login timestamp so we don't show this again next time
        await updateLastLogin(userId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <PartyPopper className="w-6 h-6 text-primary" />
                        Welcome Back, {userName}!
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-muted-foreground mb-4">
                        Here's what happened while you were away:
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-secondary/10 border border-secondary p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <Users className="w-6 h-6 mb-2 text-blue-500" />
                            <span className="text-2xl font-bold">{stats.newFollowers}</span>
                            <span className="text-xs text-muted-foreground">New Followers</span>
                        </div>

                        <div className="bg-secondary/10 border border-secondary p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <Heart className="w-6 h-6 mb-2 text-red-500" />
                            <span className="text-2xl font-bold">{stats.newLikes}</span>
                            <span className="text-xs text-muted-foreground">New Likes</span>
                        </div>

                        <div className="bg-secondary/10 border border-secondary p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <MessageCircle className="w-6 h-6 mb-2 text-green-500" />
                            <span className="text-2xl font-bold">{stats.newComments}</span>
                            <span className="text-xs text-muted-foreground">New Comments</span>
                        </div>
                    </div>

                    {samples.length > 0 && (
                        <div className="space-y-3 mb-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Latest Updates</h4>
                            {samples.map((notification) => (
                                <div key={notification.notificationId} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm">
                                    <img
                                        src={notification.actorPhotoURL || '/placeholder-user.jpg'}
                                        alt={notification.actorUsername}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <span>{notification.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:justify-between gap-2">
                    <Link href="/notifications" className="w-full">
                        <Button variant="outline" className="w-full" onClick={handleClose}>
                            View All Notifications
                        </Button>
                    </Link>
                    <Button onClick={handleClose} className="w-full">
                        Great, Thanks!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
