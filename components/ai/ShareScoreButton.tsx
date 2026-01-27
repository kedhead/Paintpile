'use client';

import { useState } from 'react';
import { Share2, Download, Facebook, Twitter, Instagram, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { createActivity } from '@/lib/firestore/activities';
import { getUserProfile } from '@/lib/firestore/users';
import { updateProject } from '@/lib/firestore/projects';
import { Timestamp } from 'firebase/firestore';

interface ShareScoreButtonProps {
    result: {
        score: number;
        grade: string;
        analysis: string;
        colors: string;
        technical_strengths: string[];
        improvements: string[];
    };
    projectName: string;
    projectId: string;
    imageUrl: string;
}

export function ShareScoreButton({ result, projectName, projectId, imageUrl }: ShareScoreButtonProps) {
    const { currentUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [postingToFeed, setPostingToFeed] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Construct OG URL
    const params = new URLSearchParams({
        score: result.score.toString(),
        grade: result.grade,
        project: projectName,
        analysis: result.analysis,
        // image: imageUrl // Disabled to prevent URL length errors
    });
    const ogUrl = `/api/og/critic-card?${params.toString()}`;

    const handleDownload = async () => {
        try {
            setDownloading(true);
            setShareError(null);

            // Explicitly request image/png
            const response = await fetch(ogUrl, {
                headers: {
                    'Accept': 'image/png'
                }
            });

            if (!response.ok) throw new Error('Failed to generate image');

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Generated image is empty');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `paintpile-critic-${result.score}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            setShareError('Failed to download image. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handlePostToFeed = async () => {
        if (!currentUser) return;

        if (!projectId) {
            setShareError('Project ID is missing. Please refresh the page and try again.');
            return;
        }

        try {
            setPostingToFeed(true);
            setShareError(null);

            const userProfile = await getUserProfile(currentUser.uid);

            // 1. Create the activity
            await createActivity(
                currentUser.uid,
                userProfile?.displayName || 'Unknown Artist',
                userProfile?.photoURL,
                'project_critique_shared',
                projectId,
                'project',
                {
                    projectName: projectName,
                    projectPhotoUrl: imageUrl,
                    critiqueScore: result.score,
                    critiqueGrade: result.grade,
                    visibility: 'public'
                }
            );

            // 2. Save the critique to the Project itself for permanent display
            try {
                await updateProject(projectId, {
                    lastCritique: {
                        score: result.score,
                        grade: result.grade,
                        analysis: result.analysis,
                        colors: result.colors,
                        technical_strengths: result.technical_strengths,
                        improvements: result.improvements,
                        createdAt: Timestamp.now()
                    }
                });
            } catch (projectUpdateError) {
                console.error("Failed to update project with critique:", projectUpdateError);
                // We still consider the share successful if the feed post worked, 
                // but we might want to alert if the persistence failed.
            }

            setSuccessMessage('Posted to your activity feed!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Feed post failed:', error);
            setShareError('Failed to post to feed.');
        } finally {
            setPostingToFeed(false);
        }
    };

    const handleSocialShare = async (platform: 'twitter' | 'facebook' | 'reddit' | 'instagram') => {
        const text = `I just got a ${result.score}/100 on my miniature "${projectName}" from the PaintPile AI Critic! 🎨✨`;
        const url = typeof window !== 'undefined' ? window.location.href : 'https://paintpile.app';

        // Special handling for Instagram
        if (platform === 'instagram') {
            // Try native sharing first (best for mobile Instagram Stories)
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                try {
                    // We need the file to share to Instagram properly
                    setDownloading(true);
                    const response = await fetch(ogUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'paintpile-score.png', { type: 'image/png' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'My PaintPile Score',
                            text: text
                        });
                        return;
                    }
                } catch (err) {
                    console.error('Instagram native share failed:', err);
                    // Fallthrough to download fallback
                } finally {
                    setDownloading(false);
                }
            }

            // Fallback for Desktop or if native share fails: Download + Alert
            await handleDownload();
            setSuccessMessage("Image downloaded! You can now post it to Instagram.");
            setTimeout(() => setSuccessMessage(null), 5000);
            return;
        }

        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
                break;
            case 'reddit':
                shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
                break;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <>
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)} className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Result
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Share Your Result</DialogTitle>
                    </DialogHeader>

                    <div className="grid md:grid-cols-5 gap-6">
                        {/* Preview Image */}
                        <div className="md:col-span-3">
                            <div className="rounded-xl overflow-hidden border shadow-lg bg-slate-900 aspect-[1200/630] relative group">
                                <img
                                    src={ogUrl}
                                    alt="Brag Card"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback if OG generation fails
                                        e.currentTarget.src = imageUrl;
                                        e.currentTarget.style.opacity = "0.5";
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Save Image
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">PaintPile Community</h4>
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={handlePostToFeed}
                                    disabled={postingToFeed || !!successMessage}
                                >
                                    {postingToFeed ? (
                                        <Spinner className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                                    )}
                                    {successMessage || 'Post to Activity Feed'}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Social Media</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="w-full justify-start" onClick={() => handleSocialShare('twitter')}>
                                        <Twitter className="w-4 h-4 mr-2 text-sky-500" />
                                        Twitter
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => handleSocialShare('facebook')}>
                                        <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                                        Facebook
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => handleSocialShare('reddit')}>
                                        <div className="w-4 h-4 mr-2 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">r/</div>
                                        Reddit
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => handleSocialShare('instagram')}>
                                        <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                                        Instagram
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Downloads</h4>
                                <Button variant="secondary" className="w-full justify-start" onClick={handleDownload} disabled={downloading}>
                                    {downloading ? (
                                        <Spinner className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    Download Image
                                </Button>
                            </div>

                            {shareError && (
                                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {shareError}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
