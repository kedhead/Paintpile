'use client';

import { Search, Database, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function PaintDatabaseGuidePage() {
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
                            <Search className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold">Paint Database</h1>
                    </div>
                    <p className="text-xl text-muted-foreground">
                        Search, track, and manage your paint collection.
                    </p>
                </div>

                {/* Overview */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Comprehensive Library</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        PaintPile comes with a built-in database of over 300+ paints from major brands including:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['Citadel', 'Army Painter', 'Vallejo', 'ProAcryl', 'Reaper', 'Scale75'].map(brand => (
                            <span key={brand} className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
                                {brand}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-4">
                            <Database className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Inventory Tracking</h3>
                        <p className="text-sm text-muted-foreground">
                            Mark paints you own to keep track of your collection. Filter searches to only show paints you have.
                        </p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-4">
                            <Upload className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Custom Paints</h3>
                        <p className="text-sm text-muted-foreground">
                            Can't find a paint? Create your own custom paints or mixes. They appear in your lists just like official ones.
                        </p>
                    </div>
                </div>

                {/* Managing Paints */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Managing Your Collection</h2>
                    <ul className="space-y-4 text-muted-foreground">
                        <li className="flex gap-3">
                            <span className="bg-muted px-2 rounded font-mono text-foreground h-fit">/paints</span>
                            <span>
                                Visit the <strong>Paint Library</strong> to browse all available paints. Use the search bar to find specific colors or brands.
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-muted px-2 rounded font-mono text-foreground h-fit">Inventory</span>
                            <span>
                                Click the checkbox next to any paint to add it to your inventory.
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-muted px-2 rounded font-mono text-foreground h-fit">New</span>
                            <span>
                                Use the <strong>"Add Custom Paint"</strong> button to add a paint that isn't in our database.
                            </span>
                        </li>
                    </ul>
                </section>

                <div className="pt-8 flex gap-4 justify-center">
                    <Link href="/paints">
                        <Button size="lg" className="px-8">
                            Browse Paint Library
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
