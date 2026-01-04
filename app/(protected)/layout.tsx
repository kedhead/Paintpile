'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render protected pages if user is not authenticated
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:block">
      <MobileHeader onOpen={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewProject={() => router.push('/projects/new')}
      />

      <main className="flex-1 lg:pl-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
