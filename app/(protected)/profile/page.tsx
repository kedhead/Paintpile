'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/lib/firestore/users';
import { User } from '@/types/user';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { Settings, Mail, Calendar, User as UserIcon, Heart, Users as UsersIcon, Award, MessageCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils/formatters';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { usePWA } from '@/contexts/PWAContext';
import { Download } from 'lucide-react';

function InstallButton() {
  const { isInstallable, install } = usePWA();
  if (!isInstallable) return null;
  return (
    <Button
      variant="outline"
      onClick={install}
      className="flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/10"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'activity'>('overview');

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  async function loadProfile() {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(currentUser!.uid);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-accent-600">
          <p>Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">View and manage your profile</p>
        </div>
        <div className="flex gap-2">
          <InstallButton />
          <Button
            variant="default"
            onClick={() => router.push('/profile/edit')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {profile.displayName?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{profile.displayName}</h2>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
              <p className="text-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium text-foreground">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Data Privacy Section */}
          <div className="pt-8 border-t">
            <h2 className="text-lg font-semibold mb-4">Privacy & Data</h2>
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground">Download a copy of all your personal data (GDPR compliant).</p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const token = await import('@/lib/firebase/firebase').then(m => m.auth.currentUser?.getIdToken());
                      if (!token) throw new Error("Not authenticated");

                      const res = await fetch('/api/user/export-data', {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (!res.ok) throw new Error('Export failed');

                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `paintpile-data-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Export error:', err);
                      alert('Failed to export data. Please try again.');
                    }
                  }}
                >
                  Download Data (JSON)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {profile.stats?.projectCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Projects</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-500">
                {profile.stats?.armyCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Armies</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                {profile.stats?.photoCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Photos</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-500">
                {profile.stats?.recipesCreated || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Recipes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Community</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-blue-500" />
                <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                  {profile.stats?.followerCount || 0}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-muted-foreground" />
                <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                  {profile.stats?.followingCount || 0}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div className="text-2xl sm:text-3xl font-bold text-red-500">
                  {profile.stats?.likesReceived || 0}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Likes Received</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <div className="text-2xl sm:text-3xl font-bold text-yellow-500">
                  {profile.stats?.badgeCount || 0}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Badges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'badges' | 'activity')}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Badges {profile.stats?.badgeCount ? `(${profile.stats.badgeCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Your profile overview. Visit other tabs to see badges and activity.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardContent className="pt-6">
              <ProfileBadges userId={currentUser!.uid} isOwnProfile={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed feedType="user" userId={currentUser!.uid} limitCount={50} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
