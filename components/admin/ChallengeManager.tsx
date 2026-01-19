'use client';

import { useState, useEffect } from 'react';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge, setActiveChallenge } from '@/lib/firestore/challenges';
import { Challenge, CreateChallengeData, ChallengeType, ChallengeStatus } from '@/types/challenge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { ChallengeEntryList } from '@/components/admin/ChallengeEntryList';
import { Plus, Edit, Trash2, Trophy, Eye, EyeOff, Calendar, Clock, Award } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';

export function ChallengeManager() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [judgingChallengeId, setJudgingChallengeId] = useState<string | null>(null);

    // Edit/Create State
    // We use isDialogOpen to control the visibility of the Inline Form now
    const [isFormOpen, setIsFormOpen] = useState(false);
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
        setIsFormOpen(true);
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
        setIsFormOpen(true);
        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            setIsFormOpen(false);
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
                {!isFormOpen && (
                    <Button onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Challenge
                    </Button>
                )}
            </div>

            {/* Inline Create/Edit Form (Card Style) */}
            {isFormOpen && (
                <Card className="border-primary/50 bg-secondary/10 mb-8 animate-in fade-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Challenge' : 'New Challenge'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Space Marine Heroes"
                                    className="bg-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the challenge rules..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Input
                                        type="datetime-local"
                                        value={formatDateForInput(formData.startDate)}
                                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">End Date</label>
                                    <Input
                                        type="datetime-local"
                                        value={formatDateForInput(formData.endDate)}
                                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Badge Reward ID (Optional)</label>
                                <Input
                                    value={formData.rewardBadgeId || ''}
                                    onChange={(e) => setFormData({ ...formData, rewardBadgeId: e.target.value })}
                                    placeholder="e.g. badge_123"
                                    className="bg-background"
                                />
                                <p className="text-[10px] text-muted-foreground">ID of the badge that will be awarded to the winner.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 justify-end border-t pt-4">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            {editingId ? 'Save Changes' : 'Create Challenge'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* List Grid */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {loading ? (
                    <p>Loading...</p>
                ) : challenges.length === 0 ? (
                    <div className="col-span-full border border-dashed rounded-xl p-12 text-center text-muted-foreground bg-muted/20">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No challenges found.</p>
                        <Button variant="link" onClick={handleCreate} className="mt-2">Create your first challenge</Button>
                    </div>
                ) : (
                    challenges.map(challenge => (
                        <Card key={challenge.id} className="flex flex-col h-full overflow-hidden group hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <CardTitle className="text-xl truncate" title={challenge.title}>
                                            {challenge.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${challenge.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    challenge.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                {challenge.status}
                                            </span>
                                            {challenge.isActive && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> Live
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(challenge)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(challenge.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3em]">
                                    {challenge.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span>End: {challenge.endDate?.toDate().toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>Entries: {challenge.participantCount || 0}</span>
                                    </div>
                                    {challenge.rewardBadgeId && (
                                        <div className="col-span-2 flex items-center gap-2 text-purple-600 font-medium">
                                            <Award className="w-4 h-4" />
                                            <span>Badge Reward Active</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex gap-2 justify-end bg-muted/20 p-4 mt-auto border-t">
                                {challenge.status !== 'completed' && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-purple-600 hover:bg-purple-700 text-white flex-1 transition-all"
                                        onClick={() => setJudgingChallengeId(challenge.id)}
                                    >
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Judge Winner
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant={challenge.isActive ? "secondary" : "outline"}
                                    onClick={() => handleToggleActive(challenge.id, challenge.isActive)}
                                    className="flex-1"
                                >
                                    {challenge.isActive ? (
                                        <>
                                            <EyeOff className="w-4 h-4 mr-2" /> Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4 mr-2" /> Set Live
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
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
        </div>
    );
}
