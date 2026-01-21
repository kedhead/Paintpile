
'use client';

import { useState } from 'react';
import { Sparkles, Trophy, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

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
    projectName: string;
}

export function MiniatureAnalyzer({ imageUrl, projectName }: MiniatureAnalyzerProps) {
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

                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            {/* Score & Grade Header with Share Button */}
                            <div className="flex flex-col gap-4">
                                <div className={`p-6 rounded-xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 ${getGradeColor(result.grade)}`}>
                                    <div className="text-center md:text-left">
                                        <div className="text-sm uppercase tracking-wider font-semibold opacity-70">Assessed Level</div>
                                        <div className="text-3xl font-bold">{result.grade}</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg backdrop-blur-sm">
                                        <Trophy className={`w-8 h-8 ${getScoreColor(result.score)}`} />
                                        <div>
                                            <div className="text-xs uppercase font-bold opacity-50">Score</div>
                                            <div className={`text-2xl font-black ${getScoreColor(result.score)}`}>{result.score}/100</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <ShareScoreButton result={result} projectName={projectName} imageUrl={imageUrl} />
                                </div>
                            </div>

                            {/* Analysis Summary */}
                            <div className="bg-muted/30 p-4 rounded-lg italic text-muted-foreground border border-border/50">
                                "{result.analysis}"
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2 text-green-500">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Strengths
                                    </h3>
                                    <ul className="space-y-2">
                                        {result.technical_strengths.map((item, i) => (
                                            <li key={i} className="text-sm bg-green-500/5 border border-green-500/10 p-2 rounded">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2 text-amber-500">
                                        <XCircle className="w-5 h-5" />
                                        Areas for Improvement
                                    </h3>
                                    <ul className="space-y-2">
                                        {result.improvements.map((item, i) => (
                                            <li key={i} className="text-sm bg-amber-500/5 border border-amber-500/10 p-2 rounded">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Color Comments */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Color Composition</h3>
                                <p className="text-sm leading-relaxed">{result.colors}</p>
                            </div>
                        </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ShareScoreButton({ result, projectName, imageUrl }: { result: AnalysisResult, projectName: string, imageUrl: string }) {
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Construct OG URL
    const params = new URLSearchParams({
        score: result.score.toString(),
        grade: result.grade,
        project: projectName,
        analysis: result.analysis,
        // We might want to skip image URL here if it's huge/Blob, but for now assuming firestore URL is fine
        // If it's too long, next/og might complain. Let's try it.
        image: imageUrl
    });
    const ogUrl = `/api/og/critic-card?${params.toString()}`;

    const handleShare = async () => {
        try {
            setDownloading(true);
            const response = await fetch(ogUrl);
            const blob = await response.blob();
            const file = new File([blob], 'paintpile-critic-score.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `AI Critic Score: ${result.score}/100`,
                    text: `My miniature "${projectName}" got a ${result.score}/100 from the AI Critic!`,
                    files: [file]
                });
            } else {
                // Fallback to download
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'paintpile-critic-score.png';
                link.click();
            }
        } catch (error) {
            console.error('Sharing failed:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Share Brag Card
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Share Your Result</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="rounded-xl overflow-hidden border shadow-lg bg-slate-900 aspect-[1200/630]">
                            <img src={ogUrl} alt="Brag Card" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                            <Button onClick={handleShare} disabled={downloading} className="gap-2">
                                {downloading ? <Spinner className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                {typeof navigator !== 'undefined' && navigator.canShare ? 'Share Image' : 'Download Image'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
