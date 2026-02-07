'use client';

import { Palette, Droplet, Zap, ArrowLeft, Camera, Sparkles, Wand2, ArrowUpCircle, Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AiToolsGuidePage() {
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
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Palette className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold">AI Paint Tools</h1>
                    </div>
                    <p className="text-xl text-muted-foreground">
                        A complete suite of AI-powered utilities to help you identify colors, visualize schemes, and perfect your painting.
                    </p>
                </div>

                <Tabs defaultValue="project-tools" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger value="project-tools">Project AI Agents</TabsTrigger>
                        <TabsTrigger value="standalone-tools">Standalone Utilities</TabsTrigger>
                    </TabsList>

                    {/* Project Tools Content */}
                    <TabsContent value="project-tools" className="space-y-8">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                            <p className="text-sm text-muted-foreground">
                                These tools are available directly inside your projects. Open a project, upload a photo, and click the <Sparkles className="w-3 h-3 inline mx-1" /> icon to access them.
                            </p>
                        </div>

                        {/* How to Use */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold">How to Use Project Agents</h2>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                                <li>Open any Project from your <strong>Dashboard</strong> or <strong>My Gallery</strong>.</li>
                                <li>Upload a photo of your miniature (unpainted or painted).</li>
                                <li>Click the <Sparkles className="w-4 h-4 inline mx-1 text-primary" /> <strong>AI Tools</strong> button on the photo.</li>
                                <li>Choose an agent:
                                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                        <li><strong>Suggest Paints</strong>: Get instant color recommendations.</li>
                                        <li><strong>Visualize Scheme</strong>: Type a prompt (e.g. "red armor") to see it applied.</li>
                                        <li><strong>Enhance/Cleanup</strong>: Remove backgrounds or improve photo quality.</li>
                                    </ul>
                                </li>
                            </ol>
                        </section>

                        <div className="border-t border-border my-8"></div>

                        {/* Scheme Visualizer */}
                        <section className="space-y-4 p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <Palette className="w-6 h-6 text-pink-500" />
                                <h2 className="text-2xl font-bold">Scheme Visualizer</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Instantly test color schemes on your actual miniatures before you paint a single stroke.
                                Describe your idea (e.g., "Dark blue armor with gold trim and glowing red eyes"), and our AI will recolor your photo to match.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                                <li className="flex gap-2"><span className="text-primary">✓</span> Test unlimited variations quickly</li>
                                <li className="flex gap-2"><span className="text-primary">✓</span> Save favorite schemes to your Paint Diary</li>
                                <li className="flex gap-2"><span className="text-primary">✓</span> Works on unpainted or primed minis</li>
                            </ul>
                        </section>

                        {/* Paint Suggestions */}
                        <section className="space-y-4 p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-purple-500" />
                                <h2 className="text-2xl font-bold">Paint Suggestions</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Not sure what paints to use? Upload a reference photo or a picture of your unpainted mini,
                                and the AI will suggest a palette of paints from our database that matches your vision.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                                <li className="flex gap-2"><span className="text-primary">✓</span> Identifies base, layer, and highlight colors</li>
                                <li className="flex gap-2"><span className="text-primary">✓</span> Matches against Citadel, Vallejo, and more</li>
                            </ul>
                        </section>

                        {/* Enhancement & Cleanup */}
                        <section className="space-y-4 p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <Wand2 className="w-6 h-6 text-blue-500" />
                                <h2 className="text-2xl font-bold">Enhance & Cleanup</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Prepare your photos for social media sharing. Remove messy backgrounds or enhance image clarity with a single click.
                            </p>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Sparkle className="w-4 h-4" /> Background Removal
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ArrowUpCircle className="w-4 h-4" /> Image Enhancement
                                </div>
                            </div>
                        </section>
                    </TabsContent>

                    {/* Standalone Tools Content */}
                    <TabsContent value="standalone-tools" className="space-y-8">
                        {/* Color Matcher */}
                        <section className="space-y-4 p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <Camera className="w-6 h-6 text-indigo-500" />
                                <h2 className="text-2xl font-bold">Color Matcher</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Identify the closest model paints from a real-world photo or reference image.
                                Upload an image, pick a color, and see which paints from Citadel, Vallejo,
                                Army Painter, and others match best.
                            </p>
                            <div className="mt-4">
                                <Link href="/tools/color-match">
                                    <Button className="gap-2" variant="secondary">
                                        Launch Color Matcher <Zap className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </section>

                        {/* Paint Mixer */}
                        <section className="space-y-4 p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <Droplet className="w-6 h-6 text-cyan-500" />
                                <h2 className="text-2xl font-bold">Paint Mixer</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Calculate the result of mixing different paints together, or find out how to
                                mix paints you own to achieve a specific target color. Uses real subtractive color mixing theory.
                            </p>
                            <div className="mt-4">
                                <Link href="/tools/paint-mixer">
                                    <Button className="gap-2" variant="secondary">
                                        Launch Paint Mixer <Zap className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
