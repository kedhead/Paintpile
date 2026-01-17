'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Edit2, Trash2, Plus, RefreshCw, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Badge, BADGE_DEFINITIONS, BadgeCategory, BadgeTier } from '@/types/badge';
import { getAllBadges, createBadge, updateBadge, deleteBadge } from '@/lib/firestore/badges';

const badgeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    category: z.enum(['projects', 'armies', 'recipes', 'social', 'community', 'special', 'time', 'engagement']),
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'legendary']),
    icon: z.string().min(1, "Icon/Emoji is required"),
    color: z.string().regex(/^#/, "Must be a hex code (e.g. #FF0000)"),
    requirement: z.string().min(1, "Requirement is required"),
    points: z.coerce.number().min(0),
    hidden: z.boolean().optional(),
});

type FormData = z.infer<typeof badgeSchema>;

export default function BadgeManagerPage() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(badgeSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: '🏅',
            color: '#FFD700',
            points: 10,
            category: 'projects',
            tier: 'bronze',
            requirement: '',
            hidden: false
        }
    });

    // Load Badges
    const loadBadges = async () => {
        setLoading(true);
        try {
            const data = await getAllBadges();
            setBadges(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBadges();
    }, []);

    // Form handlers
    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await updateBadge(editingId, data);
            } else {
                await createBadge(data);
            }
            setIsFormOpen(false);
            setEditingId(null);
            reset();
            loadBadges();
        } catch (error) {
            console.error("Failed to save badge", error);
        }
    };

    const handleEdit = (badge: Badge) => {
        setEditingId(badge.id);
        setIsFormOpen(true);
        // Set all form values
        setValue('name', badge.name);
        setValue('description', badge.description);
        setValue('category', badge.category);
        setValue('tier', badge.tier);
        setValue('icon', badge.icon);
        setValue('color', badge.color);
        setValue('requirement', badge.requirement);
        setValue('points', badge.points);
        setValue('hidden', badge.hidden);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this badge? Users who earned it will lose it locally.')) return;
        await deleteBadge(id);
        loadBadges();
    };

    const seedDefaults = async () => {
        if (!confirm('This will create duplicates if standard badges already exist. Continue?')) return;
        setLoading(true);
        try {
            for (const [key, def] of Object.entries(BADGE_DEFINITIONS)) {
                await createBadge({
                    ...def,
                    // Fix potential undefined if BADGE_DEFINITIONS types are loose
                    points: def.points || 0,
                } as any);
            }
            loadBadges();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const watchedIcon = watch('icon');
    const watchedColor = watch('color');
    const watchedName = watch('name');

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Badge Manager
                    </h1>
                    <p className="text-muted-foreground">Create and manage gamification badges.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={seedDefaults}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Seed Defaults
                    </Button>
                    <Button onClick={() => { setIsFormOpen(true); setEditingId(null); reset(); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Badge
                    </Button>
                </div>
            </div>

            {isFormOpen && (
                <Card className="border-primary/50 bg-secondary/10 mb-8">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Badge' : 'New Badge'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:col-span-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input {...register('name')} placeholder="e.g. Master Painter" />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Icon (Emoji)</label>
                                        <Input {...register('icon')} placeholder="🏆" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input {...register('description')} placeholder="Awarded for..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <select {...register('category')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="projects">Projects</option>
                                            <option value="armies">Armies</option>
                                            <option value="recipes">Recipes</option>
                                            <option value="social">Social</option>
                                            <option value="community">Community</option>
                                            <option value="special">Special</option>
                                            <option value="time">Time</option>
                                            <option value="engagement">Engagement</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tier</label>
                                        <select {...register('tier')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="bronze">Bronze</option>
                                            <option value="silver">Silver</option>
                                            <option value="gold">Gold</option>
                                            <option value="platinum">Platinum</option>
                                            <option value="legendary">Legendary</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Color (Hex)</label>
                                        <div className="flex gap-2">
                                            <Input type="color" {...register('color')} className="w-12 p-1" />
                                            <Input {...register('color')} placeholder="#FFD700" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Points</label>
                                        <Input type="number" {...register('points')} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Requirement</label>
                                    <Input {...register('requirement')} placeholder="e.g. Complete 50 projects" />
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                    <Button type="submit">{editingId ? 'Save Changes' : 'Create Badge'}</Button>
                                </div>
                            </form>

                            {/* Live Preview */}
                            <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-card">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview</h3>
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md border-2"
                                        style={{
                                            backgroundColor: `${watchedColor}20`,
                                            borderColor: watchedColor
                                        }}
                                    >
                                        {watchedIcon || '🏆'}
                                    </div>
                                    <h4 className="font-bold text-lg">{watchedName || 'Badge Name'}</h4>
                                    <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold">
                                        {watch('tier')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {badges.map(badge => (
                    <Card key={badge.id} className="relative group hover:border-primary/50 transition-colors">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(badge)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(badge.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm border"
                                style={{
                                    backgroundColor: `${badge.color}15`,
                                    borderColor: badge.color
                                }}
                            >
                                {badge.icon}
                            </div>
                            <div>
                                <h3 className="font-bold">{badge.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                            </div>
                            <div className="flex gap-2 text-[10px] text-muted-foreground mt-2">
                                <span className="px-1.5 py-0.5 bg-secondary rounded capitalize">{badge.category}</span>
                                <span className="px-1.5 py-0.5 bg-secondary rounded capitalize">{badge.tier}</span>
                                <span className="px-1.5 py-0.5 bg-secondary rounded">{badge.points} pts</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {badges.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No badges found. Click "Seed Defaults" to start.</p>
                </div>
            )}
        </div>
    );
}
