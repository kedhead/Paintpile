'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export function PublicProjectBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-4xl mx-auto bg-card border border-primary/20 shadow-xl rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 relative">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground md:hidden"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full hidden md:block">
                    <Sparkles className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-lg text-foreground">Inspired by this project?</h3>
                    <p className="text-muted-foreground text-sm">
                        Join PaintPile to track your own miniature painting journey, discover recipes, and share your work.
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Link href="/signup" className="flex-1 md:flex-none">
                        <Button size="lg" className="w-full whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90">
                            Start Your Own Journal
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
