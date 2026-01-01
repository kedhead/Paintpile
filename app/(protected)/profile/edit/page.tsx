'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '@/lib/firestore/users';
import { uploadProfilePhoto } from '@/lib/firebase/storage';
import { User } from '@/types/user';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '@/lib/validation/schemas';
import { ProfileFormData } from '@/lib/validation/schemas';
import { Upload, X, ArrowLeft } from 'lucide-react';

export default function EditProfilePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

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

      // Set form values
      setValue('displayName', userProfile.displayName);
      if (userProfile.username) setValue('username', userProfile.username);
      if (userProfile.bio) setValue('bio', userProfile.bio);

      if (userProfile.photoURL) {
        setAvatarPreview(userProfile.photoURL);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);

      let photoURL = profile?.photoURL;

      // Upload avatar if changed
      if (avatarFile) {
        photoURL = await uploadProfilePhoto(
          currentUser!.uid,
          avatarFile,
          (progress) => setUploadProgress(progress)
        );
      }

      // Update profile
      await updateUserProfile(currentUser!.uid, {
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
        photoURL,
      });

      router.push('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-1">Update your profile information</p>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Photo
              </label>
              <div className="flex items-center gap-6">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 bg-accent-500 text-white rounded-full p-1 hover:bg-accent-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.displayName?.[0]?.toUpperCase() ||
                      profile?.email[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG or WEBP. Max 5MB.
                  </p>
                </div>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Display Name *
              </label>
              <Input
                id="displayName"
                {...register('displayName')}
                placeholder="Your name"
                error={errors.displayName?.message}
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  @
                </span>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="username"
                  className="pl-8"
                  error={errors.username?.message}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bio
              </label>
              <textarea
                id="bio"
                {...register('bio')}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-accent-600">
                  {errors.bio.message}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Privacy & Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Privacy and notification settings will be
                available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/profile')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
