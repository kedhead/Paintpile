
'use client';

import { useState } from 'react';
import { Sparkles, Trophy, AlertTriangle, CheckCircle2, XCircle, Share2, Download, Facebook, Twitter, Instagram } from 'lucide-react';
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
import { CritiqueDetails, CritiqueResult } from './CritiqueDetails';

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
}

export function MiniatureAnalyzer({ imageUrl, thumbnailUrl, projectName, projectId }: MiniatureAnalyzerProps) {
    const { getAuthToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAuthToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch('/api/ai/analyze-miniature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ imageUrl })
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

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'Competition Level': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'Display Standard': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'Tabletop Plus': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'Tabletop Ready': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-yellow-500';
        if (score >= 80) return 'text-purple-500';
        if (score >= 70) return 'text-blue-500';
        if (score >= 50) return 'text-green-500';
        return 'text-slate-500';
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsOpen(true)}
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
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Initial State / Image Preview */}
                        {!result && !loading && !error && (
                            <div className="text-center space-y-4 py-8">
                                <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden border">
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <p className="text-muted-foreground">
                                    Our AI judge will analyze your painting technique, contrast, and style to give you a grade and constructive feedback.
                                </p>
                                <Button onClick={handleAnalyze} size="lg" className="w-full max-w-xs gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Analyze Paint Job
                                </Button>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12 space-y-4">
                                <Spinner size="lg" className="mx-auto" />
                                <p className="text-muted-foreground animate-pulse">
                                    Analyzing brush strokes... Calculating contrast... Judging highlights...
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
