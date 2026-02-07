'use client';

import { Sparkles, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AiCriticGuidePage() {
    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
            <div className="pt-8 mb-8">
                <Link href="/features">
                    <Button variant="ghost" className="pl-0 gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back to Features
                    </Button>
                </Link>
            </div>

            <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4 border-b border-border pb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold">AI Paint Critic</h1>
                    </div>
                    <p className="text-xl text-muted-foreground">
                        Get instant, honest feedback on your miniatures from our AI judge.
                    </p>
                </div>

                {/* How it Works */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">How it Works</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        The AI Paint Critic analyzes photos of your miniatures to provide constructive feedback,
                        technical scores, and actionable advice for improvement. It uses advanced image recognition
                        trained specifically on miniature painting techniques.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mb-4">1</div>
                            <h3 className="font-bold mb-2">Upload Photo</h3>
                            <p className="text-sm text-muted-foreground">Upload a clear, well-lit photo of your miniature to any Project.</p>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mb-4">2</div>
                            <h3 className="font-bold mb-2">Request Critique</h3>
                            <p className="text-sm text-muted-foreground">Click the "AI Critic" button on the project image.</p>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mb-4">3</div>
                            <h3 className="font-bold mb-2">Get Feedback</h3>
                            <p className="text-sm text-muted-foreground">Receive scores on technique, composition, and specific tips.</p>
                        </div>
                    </div>
                </section>

                {/* What it Checks */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">What it Analyzes</h2>
                    <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                        <div className="p-4 flex gap-4">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold">Technique Quality</h3>
                                <p className="text-sm text-muted-foreground">Evaluates smoothness of base coats, neatness, and brush control.</p>
                            </div>
                        </div>
                        <div className="p-4 flex gap-4">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold">Contrast & Definition</h3>
                                <p className="text-sm text-muted-foreground">Checks for dynamic range between shadows and highlights.</p>
                            </div>
                        </div>
                        <div className="p-4 flex gap-4">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold">Color Theory</h3>
                                <p className="text-sm text-muted-foreground">Analyzes color harmony, saturation, and scheme coherence.</p>
                            </div>
                        </div>
                        <div className="p-4 flex gap-4">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold">Special Techniques</h3>
                                <p className="text-sm text-muted-foreground">Recognizes NMM, OSL, blending, and weathering attempts.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips for Best Results */}
                <section className="bg-secondary/20 p-6 rounded-xl border border-border space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h2 className="text-xl font-bold">Tips for Best Results</h2>
                    </div>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                        <li>Ensure your photo is in focus and well-lit.</li>
                        <li>Use a neutral background (black, white, or gray) if possible.</li>
                        <li>Avoid harsh shadows that hide details.</li>
                        <li>Take photos from multiple angles for a complete assessment.</li>
                        <li>The AI works best on single miniatures rather than large groups.</li>
                    </ul>
                </section>

                <div className="pt-8 flex gap-4 justify-center">
                    <Link href="/dashboard">
                        <Button size="lg" className="px-8">
                            Go to Dashboard
                        </Button>
                    </Link>
                    <Link href="/projects/new">
                        <Button variant="outline" size="lg" className="px-8">
                            Create Project
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
