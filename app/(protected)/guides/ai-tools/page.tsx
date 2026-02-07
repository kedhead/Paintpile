'use client';

import { Palette, Droplet, Zap, ArrowLeft, Camera } from 'lucide-react';
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
                        Powerful utilities to help you identify colors, mix paints, and find the perfect match.
                    </p>
                </div>

                <Tabs defaultValue="colormatch" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger value="colormatch">Color Matcher</TabsTrigger>
                        <TabsTrigger value="mixer">Paint Mixer</TabsTrigger>
                    </TabsList>

                    {/* Color Matcher Content */}
                    <TabsContent value="colormatch" className="space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Camera className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-bold">Color Matcher</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Identify the closest model paints from a real-world photo or reference image.
                                Upload an image, pick a color, and see which paints from Citadel, Vallejo,
                                Army Painter, and others match best.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-card p-6 rounded-xl border border-border">
                                    <h3 className="font-bold mb-3 text-lg">Features</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Analyzes any uploaded image
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Matches against our database of 300+ paints
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Shows Delta-E (color difference) accuracy
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Suggests complementary colors
                                        </li>
                                    </ul>
                                </div>
                                <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-center items-center text-center space-y-4">
                                    <p className="text-muted-foreground">Ready to try it?</p>
                                    <Link href="/tools/color-match">
                                        <Button className="gap-2">
                                            Launch Color Matcher <Zap className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </TabsContent>

                    {/* Paint Mixer Content */}
                    <TabsContent value="mixer" className="space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Droplet className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-bold">Paint Mixer</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Calculate the result of mixing different paints together, or find out how to
                                mix paints you own to achieve a specific target color.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-card p-6 rounded-xl border border-border">
                                    <h3 className="font-bold mb-3 text-lg">Features</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Simulate mixing ratios (e.g., 2:1 Red to Blue)
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Uses subtractive color mixing theory
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            Save custom mixes to your library
                                        </li>
                                    </ul>
                                </div>
                                <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-center items-center text-center space-y-4">
                                    <p className="text-muted-foreground">Ready to mix?</p>
                                    <Link href="/tools/paint-mixer">
                                        <Button className="gap-2">
                                            Launch Paint Mixer <Zap className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}
