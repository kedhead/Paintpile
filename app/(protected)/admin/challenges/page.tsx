'use client';

import { Shield } from 'lucide-react';
import { ChallengeManager } from '@/components/admin/ChallengeManager';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AdminChallengesPage() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-10">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Challenge Manager</h1>
                            <p className="text-muted-foreground">Create and manage weekly painting challenges</p>
                        </div>
                    </div>
                    <Link href="/admin">
                        <Button variant="outline">Back to Admin</Button>
                    </Link>
                </div>

                <ChallengeManager />
            </div>
        </div>
    );
}
