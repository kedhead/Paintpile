'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createNewsPost } from '@/lib/firestore/news';
import { NewsFormData, NewsType } from '@/types/news';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus } from 'lucide-react';

const newsSchema = z.object({
    title: z.string().min(3, 'Title is too short'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    type: z.enum(['update', 'feature', 'announcement', 'maintenance'] as const),
});

interface CreateNewsDialogProps {
    onPostCreated: () => void;
}

export function CreateNewsDialog({ onPostCreated }: CreateNewsDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { currentUser } = useAuth();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<NewsFormData>({
        resolver: zodResolver(newsSchema),
        defaultValues: {
            type: 'update',
        },
    });

    async function onSubmit(data: NewsFormData) {
        if (!currentUser) return;

        try {
            setIsSubmitting(true);
            await createNewsPost(currentUser.uid, data);
            reset();
            setOpen(false);
            onPostCreated();
        } catch (error) {
            console.error('Failed to create news post:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <Button className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" />
                Add News
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create News Post</DialogTitle>
                        <DialogDescription>
                            Share an update, announcement, or new feature with the community.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                {...register('title')}
                                placeholder="e.g., Paint Diary is Live!"
                                error={errors.title?.message}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register('type')}
                            >
                                <option value="update">Update</option>
                                <option value="feature">New Feature</option>
                                <option value="announcement">Announcement</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Write your update here..."
                                {...register('content')}
                            />
                            {errors.content && (
                                <p className="text-sm text-destructive">{errors.content.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                                Post Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
