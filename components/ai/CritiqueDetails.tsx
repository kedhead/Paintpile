'use client';

import { Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { ShareScoreButton } from '@/components/ai/ShareScoreButton';

export interface CritiqueResult {
    score: number;
    grade: string;
    analysis: string;
    colors: string;
    technical_strengths: string[];
    improvements: string[];
}

interface CritiqueDetailsProps {
    result: CritiqueResult;
    // Optional props used for Sharing. If omitted, Share button is hidden.
    projectName?: string;
    projectId?: string;
    imageUrl?: string;
}

export function CritiqueDetails({ result, projectName, projectId, imageUrl }: CritiqueDetailsProps) {
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

                {/* Optional Share Button */}
                {projectName && projectId && imageUrl && (
                    <div className="flex justify-end">
                        <ShareScoreButton
                            result={result}
                            projectName={projectName}
                            projectId={projectId}
                            imageUrl={imageUrl}
                        />
                    </div>
                )}
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
    );
}
