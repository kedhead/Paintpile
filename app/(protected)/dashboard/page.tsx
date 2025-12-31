'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {currentUser?.displayName || 'Painter'}!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Ready to conquer your pile of shame?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Start a New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Document your miniature painting journey with photos and notes.
            </p>
            <Link href="/projects/new">
              <Button variant="primary">New Project</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Track Your Pile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Add unpainted miniatures to your pile and track your progress.
            </p>
            <Link href="/pile">
              <Button variant="secondary">View Pile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500">0</div>
                <div className="mt-2 text-sm font-medium text-gray-600">Projects</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-500">0</div>
                <div className="mt-2 text-sm font-medium text-gray-600">Photos</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-rose-500">0</div>
                <div className="mt-2 text-sm font-medium text-gray-600">Unpainted</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Create your first project</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Start documenting your miniature painting with photos and progress updates.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-600 font-bold">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Add to your pile</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Track all your unpainted miniatures and watch your progress over time.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-600 font-bold">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Share your work</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Set projects to public and share your painting journey with the community.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
