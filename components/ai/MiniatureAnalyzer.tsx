
'use client';

import { useState } from 'react';
import { Sparkles, Trophy, AlertTriangle, CheckCircle2, XCircle, Share2, Download, Facebook, Twitter, Instagram, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { createActivity } from '@/lib/firestore/activities';
import { getUserProfile } from '@/lib/firestore/users';
import { updateProject } from '@/lib/firestore/projects';
import { Timestamp } from 'firebase/firestore';
import { CritiqueDetails, CritiqueResult } from './CritiqueDetails';
import { Photo } from '@/types/photo';

interface AnalysisResult {
    grade: 'Beginner' | 'Tabletop Ready' | 'Tabletop Plus' | 'Display Standard' | 'Competition Level';
    score: number;
    analysis: string;
    technical_strengths: string[];
    improvements: string[];
    colors: string;
}

interface MiniatureAnalyzerProps {
    imageUrl: string;
    thumbnailUrl?: string;
    projectName: string;
    projectId: string;
    projectPhotos?: Photo[];
}

export function MiniatureAnalyzer({ imageUrl, thumbnailUrl, projectName, projectId, projectPhotos = [] }: MiniatureAnalyzerProps) {
    const { getAuthToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Default to the current image if no others, or empty if we want them to pick
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([imageUrl]);

    const togglePhotoSelection = (url: string) => {
        if (selectedPhotos.includes(url)) {
            // Prevent deselecting the last one
            if (selectedPhotos.length > 1) {
                setSelectedPhotos(prev => prev.filter(p => p !== url));
            }
        } else {
            if (selectedPhotos.length < 4) {
                setSelectedPhotos(prev => [...prev, url]);
            }
        }
    };

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAuthToken();
            if (!token) throw new Error('Not authenticated');

            // Format images for API
            // Simple labeling based on order for now (Image 1, Image 2...)
            // Ideally UI would ask "Is this front or back?" but selection is a good MVP step
            const imagesPayload = selectedPhotos.map((url, idx) => ({
                url,
                label: `Angle ${idx + 1}`
            }));

            const response = await fetch('/api/ai/analyze-miniature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    images: imagesPayload
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Analysis failed');

            setResult(data);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                    setIsOpen(true);
                    // Reset selection to current image when opening if empty
                    if (selectedPhotos.length === 0) setSelectedPhotos([imageUrl]);
                }}
            >
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI Critique
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            AI Paint Critic: {projectName}
                        </DialogTitle>
                        <DialogDescription>
                            Select up to 4 angles (Front, Back, Side) for the most accurate critique.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Initial State / Image Selection */}
                        {!result && !loading && !error && (
                            <div className="space-y-6">
                                {/* Selection Grid */}
                                {projectPhotos.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                                        {projectPhotos.map((photo) => {
                                            const isSelected = selectedPhotos.includes(photo.url);
                                            return (
                                                <div
                                                    key={photo.photoId}
                                                    onClick={() => togglePhotoSelection(photo.url)}
                                                    className={`
                                                        relative aspect-square cursor-pointer rounded-md overflow-hidden border-2 transition-all
                                                        ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-transparent opacity-60 hover:opacity-100'}
                                                    `}
                                                >
                                                    <img src={photo.thumbnailUrl || photo.url} alt="" className="w-full h-full object-cover" />
                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-0.5">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden border">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <p className="text-center text-sm text-muted-foreground">
                                    {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected.
                                    Our AI judge will analyze consistency, technique, and contrast.
                                </p>

                                <div className="flex justify-center">
                                    <Button onClick={handleAnalyze} size="lg" className="w-full max-w-sm gap-2" disabled={selectedPhotos.length === 0}>
                                        <Sparkles className="w-4 h-4" />
                                        Analyze Paint Job
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12 space-y-4">
                                <Spinner size="lg" className="mx-auto" />
                                <p className="text-muted-foreground animate-pulse">
                                    Analyzing {selectedPhotos.length} viewing angles...<br />
                                    Checking consistency and technique...
                                </p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5" />
                                <p>{error}</p>
                                <Button variant="ghost" size="sm" onClick={handleAnalyze} className="ml-auto">Retry</Button>
                            </div>
                        )}

                        {/* Result State */}
                        {result && (
                            <CritiqueDetails
                                result={result}
                                projectName={projectName}
                                projectId={projectId}
                                imageUrl={thumbnailUrl || imageUrl}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
