'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export function PublicHeader() {
    return (
        <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/paintpile-logo.png"
                            alt="PaintPile"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-xl font-bold font-display text-foreground">
                        PaintPile
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost">Log In</Button>
                    </Link>
                    <Link href="/signup">
                        <Button variant="default">Sign Up</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
