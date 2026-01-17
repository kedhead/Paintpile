'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { SidebarAd } from '@/components/ads/SidebarAd';
import { getAdSettings, updateAdSettings } from '@/lib/firestore/ads';
import { AdSettings } from '@/types/ads';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch'; // Assuming a switch component exists or use simple checkbox
// If Switch doesn't exist, I'll use a checkbox or simple toggle button logic.
// Checking ui folder content might be needed, but for now I'll stick to standard inputs to be safe or mock it.
// Actually, I'll use a standard checkbox styled as switch if needed, or just a checkbox.

const adSchema = z.object({
    enabled: z.boolean(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    ctaText: z.string().min(1, "CTA Text is required"),
    linkUrl: z.string().url("Must be a valid URL"),
    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

export default function AdManagerPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<AdSettings>({
        resolver: zodResolver(adSchema),
        defaultValues: {
            enabled: true,
            title: '',
            description: '',
            ctaText: '',
            linkUrl: '',
            imageUrl: '',
        }
    });

    const watchedValues = watch();

    useEffect(() => {
        async function load() {
            try {
                const settings = await getAdSettings();
                reset(settings);
            } catch (err) {
                console.error("Failed to load ad settings", err);
                setError("Failed to load settings");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [reset]);

    const onSubmit = async (data: AdSettings) => {
        setSaving(true);
        setSuccess('');
        setError('');
        try {
            await updateAdSettings(data);
            setSuccess('Ad settings updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error("Failed to save settings", err);
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ad Manager</h1>
                    <p className="text-muted-foreground">Manage the sponsored content in the sidebar sidebar.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
                                <input
                                    type="checkbox"
                                    id="enabled"
                                    {...register('enabled')}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="enabled" className="font-medium cursor-pointer">Enable Ad Display</label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input {...register('title')} error={errors.title?.message} placeholder="e.g. Element Games" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    {...register('description')}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                                    placeholder="Ad copy text..."
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CTA Text</label>
                                    <Input {...register('ctaText')} error={errors.ctaText?.message} placeholder="Shop Now" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Link URL</label>
                                    <Input {...register('linkUrl')} error={errors.linkUrl?.message} placeholder="https://..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Image URL (Optional)</label>
                                <Input {...register('imageUrl')} error={errors.imageUrl?.message} placeholder="https://..." />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" disabled={saving} className="w-full">
                                    {saving ? <Spinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>

                            {success && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Preview */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Live Preview</h2>
                    <div className="p-6 border rounded-xl bg-sidebar w-64 mx-auto">
                        <p className="text-xs text-muted-foreground mb-4 text-center border-b pb-2">Sidebar Context</p>

                        {/* Mock Nav Items */}
                        <div className="space-y-2 mb-8 opacity-50 pointer-events-none">
                            <div className="h-8 bg-sidebar-accent/50 rounded w-full"></div>
                            <div className="h-8 bg-sidebar-accent/30 rounded w-3/4"></div>
                            <div className="h-8 bg-sidebar-accent/30 rounded w-5/6"></div>
                        </div>

                        {/* Ad Component Preview - passing raw props to override internal fetch */}
                        {/* Note: SidebarAd is currently fetching internally. I need to modify SidebarAd to accept props for preview mode first.
                           For now, I can't pass props to SidebarAd because I haven't updated it yet.
                           But I'm writing this file knowing I WILL update SidebarAd in the next step to accept optional override props.
                        */}
                        <SidebarAd
                            overrideSettings={watchedValues}
                        />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                        This is how the ad will appear in the sidebar navigation.
                    </p>
                </div>
            </div>
        </div>
    );
}
