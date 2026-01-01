'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/lib/firestore/users';
import { User } from '@/types/user';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { Settings, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          variant="primary"
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
              <div className="text-3xl font-bold text-secondary-600">
                {profile.stats?.photoCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Photos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {profile.stats?.pileCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Pile Items</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">
                {profile.stats?.paintCount || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Custom Paints</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-500">
                  Allow others to view your profile and public projects
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.settings?.isPublic
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {profile.settings?.isPublic ? 'Public' : 'Private'}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive updates about your projects and activity
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.settings?.emailNotifications
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {profile.settings?.emailNotifications ? 'On' : 'Off'}
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Theme</p>
                <p className="text-sm text-gray-500">
                  Choose your preferred color scheme
                </p>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 capitalize">
                {profile.settings?.theme || 'Light'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
