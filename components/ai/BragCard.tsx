import { Trophy } from 'lucide-react';

interface BragCardProps {
    score: number;
    grade: string;
    analysis: string;
    projectName: string;
    imageUrl?: string;
    date?: string;
}

export function BragCard({ score, grade, analysis, projectName, imageUrl, date }: BragCardProps) {
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
        <div className="relative w-full aspect-[1.91/1] bg-slate-900 rounded-xl overflow-hidden border border-border shadow-xl group cursor-default">
            {/* Background Image */}
            {imageUrl && (
                <div className="absolute inset-0">
                    <img
                        src={imageUrl}
                        alt="Background"
                        className="w-full h-full object-cover opacity-30 blur-sm scale-110 group-hover:scale-100 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
                </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
                {/* Project Name */}
                <h3 className="text-xl md:text-2xl font-bold text-slate-200 uppercase tracking-widest mb-4 drop-shadow-md">
                    {projectName}
                </h3>

                {/* Score Circle */}
                <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                    <div className="absolute inset-0 rounded-full bg-slate-900/80 backdrop-blur-sm" />
                    <div className={`relative text-5xl md:text-7xl font-black ${getScoreColor(score)}`}>
                        {score}
                    </div>
                </div>

                {/* Grade Badge */}
                <div className={`px-6 py-2 rounded-full text-sm md:text-base font-bold uppercase tracking-wide mb-4 bg-blue-500 text-white shadow-lg transform group-hover:scale-105 transition-transform`}>
                    {grade}
                </div>

                {/* Analysis Quote */}
                <p className="text-sm md:text-lg text-slate-400 italic max-w-lg line-clamp-2 md:line-clamp-2 leading-relaxed">
                    "{analysis}"
                </p>

                {/* Footer */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
                    <span>⚖️</span>
                    <span>AI Paint Critic</span>
                    {date && <span>• {date}</span>}
                </div>
            </div>
        </div>
    );
}
