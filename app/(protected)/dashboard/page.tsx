'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectList } from '@/components/projects/ProjectList';
import { getUserProjects, getProjectsByTag } from '@/lib/firestore/projects';
import { getUserProfile } from '@/lib/firestore/users';
import { Project } from '@/types/project';
import { User } from '@/types/user';
import { TAG_SHAME } from '@/lib/utils/constants';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [unpaintedCount, setUnpaintedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Load all data in parallel
        const [userProjects, profile, shameProjects] = await Promise.all([
          getUserProjects(currentUser.uid, { limitCount: 6 }),
          getUserProfile(currentUser.uid),
          getProjectsByTag(currentUser.uid, TAG_SHAME),
        ]);

        setProjects(userProjects);
        setUserProfile(profile);

        // Calculate unpainted count from shame-tagged projects
        const unpainted = shameProjects
          .filter((p) => p.status === 'not-started')
          .reduce((sum, p) => sum + (p.quantity || 1), 0);
        setUnpaintedCount(unpainted);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser]);

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

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
          <Link href="/projects/new">
            <Button variant="primary" className="text-sm">
              New Project
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <ProjectList projects={projects} emptyMessage="No projects yet. Create your first project to get started!" />
        )}
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-500">
                  {userProfile?.stats?.projectCount || 0}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-600">Projects</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary-50 to-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary-500">
                  {userProfile?.stats?.photoCount || 0}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-600">Photos</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-600">
                  {unpaintedCount}
                </div>
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
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 font-bold">
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
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary-100 text-secondary-600 font-bold">
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
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-success-100 text-success-600 font-bold">
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
