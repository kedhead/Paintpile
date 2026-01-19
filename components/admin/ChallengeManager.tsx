'use client';

import { useState, useEffect } from 'react';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge, setActiveChallenge } from '@/lib/firestore/challenges';
import { Challenge, CreateChallengeData, ChallengeType, ChallengeStatus } from '@/types/challenge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { ChallengeEntryList } from '@/components/admin/ChallengeEntryList';
import { Plus, Edit, Trash2, Trophy, Eye, EyeOff, Calendar } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export function ChallengeManager() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [judgingChallengeId, setJudgingChallengeId] = useState<string | null>(null);

    // Edit/Create State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CreateChallengeData>>({
        title: '',
        description: '',
        type: 'painting',
        status: 'draft',
        startDate: undefined,
        endDate: undefined
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getChallenges();
            setChallenges(data);
        } catch (error) {
            console.error("Failed to load challenges", error);
            toast.error("Failed to load challenges");
        } finally {
            setLoading(false);
        }
    }

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            title: '',
            description: '',
            type: 'painting',
            status: 'draft',
            rewardBadgeId: '',
            startDate: Timestamp.now(),
            endDate: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 1 week
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (challenge: Challenge) => {
        setEditingId(challenge.id);
        setFormData({
            title: challenge.title,
            description: challenge.description,
            type: challenge.type,
            status: challenge.status,
            rewardBadgeId: challenge.rewardBadgeId,
            startDate: challenge.startDate,
            endDate: challenge.endDate
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.title || !formData.description) {
                toast.error("Title and Description are required");
                return;
            }

            const data: CreateChallengeData = {
                title: formData.title,
                description: formData.description,
                type: formData.type as ChallengeType || 'painting',
                status: formData.status as ChallengeStatus || 'draft',
                startDate: formData.startDate || Timestamp.now(),
                endDate: formData.endDate || Timestamp.now(),
                rewardBadgeId: formData.rewardBadgeId,
                isActive: formData.status === 'active'
            };

            if (editingId) {
                await updateChallenge(editingId, data);
                toast.success("Challenge updated");
            } else {
                await createChallenge(data);
                toast.success("Challenge created");
            }
            setIsDialogOpen(false);
            loadData();
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save challenge");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this challenge?")) return;
        try {
            await deleteChallenge(id);
            toast.success("Challenge deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete challenge");
        }
    };

    const handleToggleActive = async (id: string, currentIsActive: boolean) => {
        if (currentIsActive) {
            // Deactivate
            await updateChallenge(id, { status: 'completed' });
            toast.success("Challenge deactivated");
        } else {
            // Activate (and deactivate others)
            await setActiveChallenge(id);
            toast.success("Challenge activated");
        }
        loadData();
    };

    const handleWinnerPicked = () => {
        toast.success("Winner picked successfully!");
        setJudgingChallengeId(null);
        loadData();
    };

    // Helper to format date for input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (ts?: Timestamp) => {
        if (!ts) return '';
        const date = ts.toDate();
        return date.toISOString().slice(0, 16);
    };

    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            setFormData(prev => ({ ...prev, [field]: Timestamp.fromDate(date) }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Manage Challenges</h1>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Challenge
                </Button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <p>Loading...</p>
                ) : challenges.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No challenges found.</p>
                ) : (
                    challenges.map(challenge => (
                        <div key={challenge.id} className="bg-card border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-full overflow-hidden">
                            <div className="flex-1 min-w-0 w-full md:w-auto">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-lg truncate max-w-[200px] sm:max-w-[300px] md:max-w-none hover:whitespace-normal transition-all">{challenge.title}</h3>
                                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${challenge.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                        challenge.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-gray-100 text-gray-700 border-gray-200'
                                        }`}>
                                        {challenge.status}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">{challenge.description}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {challenge.endDate?.toDate().toLocaleDateString()}
                                    </span>
                                    <span>{challenge.participantCount || 0} Entries</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto mt-2 md:mt-0">
                                {challenge.status !== 'completed' && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => setJudgingChallengeId(challenge.id)}
                                        title="Judge & Pick Winner"
                                    >
                                        <Trophy className="w-4 h-4" />
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleActive(challenge.id, challenge.isActive)}
                                    title={challenge.isActive ? "Deactivate" : "Set Active"}
                                >
                                    {challenge.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>

                                <Button size="sm" variant="outline" onClick={() => handleEdit(challenge)}>
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

            {/* Judging Dialog */}
            <Dialog open={!!judgingChallengeId} onOpenChange={(open) => !open && setJudgingChallengeId(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Judge Challenge</DialogTitle>
                    </DialogHeader>
                    {judgingChallengeId && (
                        <ChallengeEntryList
                            challengeId={judgingChallengeId}
                            onWinnerPicked={handleWinnerPicked}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Challenge' : 'New Challenge'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label>Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label>Description</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label>Start Date</label>
                                <Input
                                    type="datetime-local"
                                    value={formatDateForInput(formData.startDate)}
                                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label>End Date</label>
                                <Input
                                    type="datetime-local"
                                    value={formatDateForInput(formData.endDate)}
                                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label>Badge Reward ID (Optional)</label>
                            <Input
                                value={formData.rewardBadgeId || ''}
                                onChange={(e) => setFormData({ ...formData, rewardBadgeId: e.target.value })}
                                placeholder="e.g. badge_123"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
