'use client';

import { BookOpen, Palette, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function RecipesGuidePage() {
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
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold">Smart Paint Recipes</h1>
                    </div>
                    <p className="text-xl text-muted-foreground">
                        Create, organize, and share your painting recipes.
                    </p>
                </div>

                {/* Quick Start */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">What are Recipes?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Recipes in PaintPile are comprehensive guides for achieving specific paint effects. They include:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <li className="flex items-start gap-2 bg-card p-4 rounded-lg border border-border">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <Palette className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="font-bold block text-foreground">Paint Ingredients</span>
                                <span className="text-sm text-muted-foreground">List specific paints with roles like Base, Highlight, or Shadow.</span>
                            </div>
                        </li>
                        <li className="flex items-start gap-2 bg-card p-4 rounded-lg border border-border">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="font-bold block text-foreground">Step-by-Step Instructions</span>
                                <span className="text-sm text-muted-foreground">Detailed application steps with estimated times.</span>
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Creating Recipes */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Creating a Recipe</h2>
                    <div className="space-y-6">
                        <div className="border-l-4 border-primary pl-6 space-y-2">
                            <h3 className="font-bold text-lg">1. Basic Info</h3>
                            <p className="text-muted-foreground">
                                Give your recipe a descriptive name (e.g., "Vibrant Red Armor") and choose a category
                                (Skin, Armor, NMM, etc.) and difficulty level.
                            </p>
                        </div>
                        <div className="border-l-4 border-primary pl-6 space-y-2">
                            <h3 className="font-bold text-lg">2. Add Ingredients</h3>
                            <p className="text-muted-foreground">
                                Select paints from the database. Assign a role to each paint to explain how it's used:
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {['Base', 'Layer', 'Highlight', 'Shadow', 'Glaze', 'Wash'].map(role => (
                                    <span key={role} className="px-2 py-1 bg-secondary rounded text-xs text-secondary-foreground font-medium border border-border">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="border-l-4 border-primary pl-6 space-y-2">
                            <h3 className="font-bold text-lg">3. Define Steps</h3>
                            <p className="text-muted-foreground">
                                Break down the process. For example: "Apply two thin coats of Mephiston Red to all armor plates."
                            </p>
                        </div>
                    </div>
                </section>

                {/* Organization */}
                <section className="bg-card p-6 rounded-xl border border-border space-y-4">
                    <h2 className="text-xl font-bold">Usage & Sharing</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold mb-2 text-foreground">In Projects</h3>
                            <p className="text-sm text-muted-foreground">
                                Link recipes to your projects to track what you used. You can add notes like "Used an extra highlight layer" for specific projects.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2 text-foreground">Community</h3>
                            <p className="text-sm text-muted-foreground">
                                Make your recipe <strong>Public</strong> to share it with the world. Other users can like and save your recipes to their own library.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="pt-8 flex gap-4 justify-center">
                    <Link href="/recipes">
                        <Button size="lg" className="px-8">
                            Go to My Recipes
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
