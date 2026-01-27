'use client';

import { useState, useRef } from 'react';
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
import { BragCard } from '@/components/ai/BragCard';
import { CritiqueDetails } from '@/components/ai/CritiqueDetails';
import html2canvas from 'html2canvas';

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
    const captureRef = useRef<HTMLDivElement>(null);

    const generateImageBlob = async (): Promise<Blob> => {
        if (!captureRef.current) throw new Error('Capture element not found');

        // Wait a brief moment to ensure images are loaded/rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(captureRef.current, {
            useCORS: true, // Important for loading external images (firebase storage)
            scale: 2, // Higher quality
            backgroundColor: '#0f172a', // Ensure background is dark
            logging: false,
        });

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to generate image blob'));
            }, 'image/png');
        });
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);
            setShareError(null);

            const blob = await generateImageBlob();

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
            try {
                setDownloading(true);
                // Generate the image client-side
                const blob = await generateImageBlob();
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
            } finally {
                setDownloading(false);
            }

            // Fallback: Download + Alert
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
            {/* Hidden Element for Capture */}
            {open && (
                <div style={{ position: 'absolute', top: -9999, left: -9999, width: 900 }}>
                    <div ref={captureRef} className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-slate-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                            <Sparkles className="w-8 h-8 text-purple-500" />
                            <h2 className="text-2xl font-bold uppercase tracking-wide">AI Paint Critic: {projectName}</h2>
                        </div>

                        <CritiqueDetails
                            result={result}
                        // Do not pass share props to hide share button in capture
                        />

                        {/* Footer Branding for Capture */}
                        <div className="mt-8 pt-4 border-t border-slate-900/50 flex items-center justify-between text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⚖️</span>
                                <span className="font-bold">PaintPile.app</span>
                            </div>
                            {/* Optional: Add date? */}
                        </div>
                    </div>
                </div>
            )}

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
                        {/* Preview */}
                        <div className="md:col-span-3">
                            <div className="rounded-xl overflow-hidden border shadow-lg bg-slate-900 group relative">
                                {/* Use BragCard for the small preview, or switch to full view if preferred. 
                                    User asked for download to match. 
                                    Let's keep BragCard here for "card" preview but download gets full details?
                                    Actually user said "It should match the critic completely for the download".
                                    The preview currently shows BragCard.
                                    Maybe we should show the full report in preview too? 
                                    But BragCard is better for "Feed" preview.
                                    Let's keep BragCard in preview as it represents the "Social Card", 
                                    but the Download button explicitly says "Download Image".
                                    Wait, if I download a full report, maybe the preview should reflect that?
                                    Let's just change the capture logic first as requested.
                                */}
                                <BragCard
                                    score={result.score}
                                    grade={result.grade}
                                    analysis={result.analysis}
                                    projectName={projectName}
                                    imageUrl={imageUrl}
                                />
                                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                                    Preview (Feed Card)
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                * Download will include the full critique details.
                            </p>
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
                                    Download Full Report
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
