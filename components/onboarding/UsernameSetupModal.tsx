'use client';

import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, updateUserProfile, getUserByUsername } from '@/lib/firestore/users';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export function UsernameSetupModal({ currentUser }: { currentUser: FirebaseUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    // Check if user needs to set a username
    useEffect(() => {
        async function checkUsername() {
            if (!currentUser) return;
            try {
                const profile = await getUserProfile(currentUser.uid);
                // Open modal if username is missing or empty
                if (!profile?.username) {
                    setIsOpen(true);
                }
            } catch (err) {
                console.error('Error checking username:', err);
            } finally {
                setLoading(false);
            }
        }
        checkUsername();
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation
        // Allow letters, numbers, underscores, hyphens
        const regex = /^[a-zA-Z0-9_-]+$/;
        if (!regex.test(username)) {
            setError('Username can only contain letters, numbers, underscores, and hyphens.');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters.');
            return;
        }

        setSaving(true);

        try {
            // 1. Check Uniqueness
            const existingUser = await getUserByUsername(username);
            if (existingUser && existingUser.userId !== currentUser.uid) {
                setError('This username is already taken.');
                setSaving(false);
                return;
            }

            // 2. Update Profile
            // Store both display/raw username and lowercase for queries
            await updateUserProfile(currentUser.uid, {
                username: username,
                usernameLower: username.toLowerCase()
            });

            // 3. Close Modal
            setIsOpen(false);

            // Optional: Refresh page to update links across the app
            window.location.reload();

        } catch (err: any) {
            console.error('Error saving username:', err);
            setError('Failed to save username. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1e1e1e] border border-orange-500/20 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase text-foreground mb-2">
                        Claim Your <span className="text-orange-500">Identity</span>
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Choose a unique username to be identified across the PaintPile community. This will be used for your profile link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} // No spaces
                                className="w-full bg-black/40 border border-border rounded-lg pl-8 pr-4 py-3 text-foreground focus:border-orange-500 focus:outline-none transition-colors font-mono"
                                placeholder="painter_pro_99"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider py-6"
                        disabled={saving}
                    >
                        {saving ? <Spinner size="sm" className="mr-2" /> : null}
                        {saving ? 'Saving...' : 'Set Username'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
