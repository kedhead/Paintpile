'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getChallenges,
    createChallenge,
    updateChallenge,
    setActiveChallenge,
    deleteChallenge,
    Challenge
} from '@/lib/firestore/challenges';
import { getAllBadges } from '@/lib/firestore/badges';
import { Badge } from '@/types/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card'; // Assuming we have this or similar
import { Plus, Edit, Trash2, CheckCircle, Trophy, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export function ChallengeManager() {
    const { currentUser } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        rewardBadgeId: '',
        coverImageUrl: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [cData, bData] = await Promise.all([
                getChallenges(),
                getAllBadges()
            ]);
            setChallenges(cData);
            setBadges(bData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (isEditing && editId) {
                await updateChallenge(editId, formData);
            } else {
                await createChallenge({
                    ...formData,
                    isActive: false, // Default to inactive
                    startDate: null as any, // TODO: Add date pickers if needed
                    endDate: null as any
                });
            }

            // Reset form
            setIsEditing(false);
            setEditId(null);
            setFormData({ title: '', description: '', rewardBadgeId: '', coverImageUrl: '' });
            loadData();
        } catch (error) {
            console.error('Error saving challenge:', error);
        }
    }

    async function handleToggleActive(id: string, currentStatus: boolean) {
        if (currentStatus) {
            // Deactivate
            await updateChallenge(id, { isActive: false });
        } else {
            // Activate (and deactivate others)
            await setActiveChallenge(id);
        }
        loadData();
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this challenge?')) return;
        await deleteChallenge(id);
        loadData();
    }

    function startEdit(challenge: Challenge) {
        setIsEditing(true);
        setEditId(challenge.id);
        setFormData({
            title: challenge.title,
            description: challenge.description,
            rewardBadgeId: challenge.rewardBadgeId || '',
            coverImageUrl: challenge.coverImageUrl || ''
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                    <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Challenge' : 'Create New Challenge'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Title (Hashtag)</label>
                            <Input
                                placeholder="#Golden_Demon"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                                placeholder="Challenge description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Reward Badge (Optional)</label>
                            <select
                                className="w-full p-2 rounded-md border border-input bg-background"
                                value={formData.rewardBadgeId}
                                onChange={(e) => setFormData({ ...formData, rewardBadgeId: e.target.value })}
                            >
                                <option value="">No Badge Reward</option>
                                {badges.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button type="submit" className="flex-1">
                                {isEditing ? 'Update Challenge' : 'Create Challenge'}
                            </Button>
                            {isEditing && (
                                <Button type="button" variant="outline" onClick={() => {
                                    setIsEditing(false);
                                    setEditId(null);
                                    setFormData({ title: '', description: '', rewardBadgeId: '', coverImageUrl: '' });
                                }}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold mb-4">All Challenges</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : challenges.length === 0 ? (
                    <p className="text-muted-foreground italic">No challenges found.</p>
                ) : (
                    challenges.map(challenge => (
                        <div key={challenge.id} className={`bg-card border ${challenge.isActive ? 'border-green-500 shadow-sm shadow-green-500/10' : 'border-border'} rounded-lg p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold">{challenge.title}</h3>
                                    {challenge.isActive && (
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>

                                {challenge.rewardBadgeId && (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded w-fit">
                                        <Trophy className="w-3 h-3" />
                                        Reward: {badges.find(b => b.id === challenge.rewardBadgeId)?.name || 'Unknown Badge'}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleActive(challenge.id, challenge.isActive)}
                                    title={challenge.isActive ? "Deactivate" : "Set Active"}
                                >
                                    {challenge.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => startEdit(challenge)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(challenge.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
