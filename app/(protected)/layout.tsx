'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render protected pages if user is not authenticated
  if (!currentUser) {
    return null;
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                Paint<span className="text-primary-500">Pile</span>
              </Link>

              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects/new"
                  className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition"
                >
                  Projects
                </Link>
                <Link
                  href="/pile"
                  className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition"
                >
                  Pile of Shame
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition"
                >
                  Profile
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {currentUser.displayName || currentUser.email}
              </span>
              <Button variant="ghost" onClick={handleSignOut} className="text-sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
