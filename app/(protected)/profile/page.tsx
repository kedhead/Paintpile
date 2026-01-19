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
import { formatDate } from '@/lib/utils/formatters';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { ActivityFeed } from '@/components/activity/ActivityFeed';

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your profile</p>
        </div>
        <Button
          variant="default"
          onClick={() => router.push('/profile/edit')}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile.displayName?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
              {profile.username && (
                <p className="text-gray-600">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
              <p className="text-gray-900">{profile.bio}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {profile.stats?.projectCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Projects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {profile.stats?.armyCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Armies</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">
                {profile.stats?.photoCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Photos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {profile.stats?.recipesCreated || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Recipes</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-blue-500" />
                <div className="text-3xl font-bold text-blue-600">
                  {profile.stats?.followerCount || 0}
                </div>
              </div>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-gray-500" />
                <div className="text-3xl font-bold text-gray-600">
                  {profile.stats?.followingCount || 0}
                </div>
              </div>
              <p className="text-sm text-gray-600">Following</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-accent-500" />
                <div className="text-3xl font-bold text-accent-600">
                  {profile.stats?.likesReceived || 0}
                </div>
              </div>
              <p className="text-sm text-gray-600">Likes Received</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <div className="text-3xl font-bold text-yellow-600">
                  {profile.stats?.badgeCount || 0}
                </div>
              </div>
              <p className="text-sm text-gray-600">Badges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'badges'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Award className="w-4 h-4" />
          Badges {profile.stats?.badgeCount ? `(${profile.stats.badgeCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activity'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Your profile overview. Visit other tabs to see badges and activity.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <Card>
          <CardContent className="pt-6">
            <ProfileBadges userId={currentUser!.uid} isOwnProfile={true} />
          </CardContent>
        </Card>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div>
          <ActivityFeed feedType="user" userId={currentUser!.uid} limitCount={50} />
        </div>
      )}
    </div>
  );
}
