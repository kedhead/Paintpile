'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicProjectBanner } from '@/components/marketing/PublicProjectBanner';
import ProjectDetailClient from './ProjectDetailClient';
import { Spinner } from '@/components/ui/Spinner';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface HybridProjectLayoutProps {
    projectId: string;
    initialProject: Project | null;
}

export function HybridProjectLayout({ projectId, initialProject }: HybridProjectLayoutProps) {
    const { currentUser, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSidebarOpen = useCallback(() => setSidebarOpen(true), []);
    const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

    // While checking auth, show a spinner (or skeleton)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner size="lg" />
            </div>
        );
    }

    // CASE 1: Authenticated User
    // Render the full app shell with sidebar
    if (currentUser) {
        return (
            <div className="min-h-screen bg-background flex flex-col lg:block">
                <MobileHeader onOpen={handleSidebarOpen} />
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={handleSidebarClose}
                    onNewProject={() => { }} // We might not have router here easily or just pass logic
                />
                <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 transition-all duration-300">
                    <ProjectDetailClient />
                </main>
            </div>
        );
    }

    // CASE 2: Public Visitor
    // Check if project is public
    if (initialProject && initialProject.isPublic) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <PublicHeader />
                <main className="flex-1">
                    {/* Pass a prop to ProjectDetailClient to indicate read-only/public mode if needed, 
               though it likely checks currentUser itself. */}
                    <ProjectDetailClient />
                </main>
                <PublicProjectBanner />
            </div>
        );
    }

    // CASE 3: Private Project & Unauthenticated
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">Private Project</h1>
            <p className="text-muted-foreground mb-6">
                This project is private. You need to log in to view it.
            </p>
            <div className="flex gap-4">
                <Link href={`/login?redirect=/projects/${projectId}`}>
                    <Button>Log In</Button>
                </Link>
                <Link href="/">
                    <Button variant="outline">Go Home</Button>
                </Link>
            </div>
        </div>
    );
}
