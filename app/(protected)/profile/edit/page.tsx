'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, getUserByUsername, deleteUserAccount } from '@/lib/firestore/users';
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
import { Upload, X, ArrowLeft, CheckCircle2, XCircle, Lock, Trash2, LogOut, AlertTriangle } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';

export default function EditProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameCheckTimer, setUsernameCheckTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

      if (!userProfile) {
        console.error('User profile not found');
        return;
      }

      setProfile(userProfile);

      // Set form values
      setValue('displayName', userProfile.displayName);
      if (userProfile.username) setValue('username', userProfile.username);
      if (userProfile.bio) setValue('bio', userProfile.bio);

      if (userProfile.photoURL) {
        setAvatarPreview(userProfile.photoURL);
      }

      // Set public profile toggle
      setIsPublic(userProfile.settings?.isPublic ?? true);
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

  async function checkUsernameAvailability(username: string) {
    if (!username || username.length < 3) {
      setUsernameCheckStatus('idle');
      return;
    }

    // Don't check if it's the current user's username
    if (profile?.username && username.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameCheckStatus('available');
      return;
    }

    setUsernameCheckStatus('checking');

    try {
      const existingUser = await getUserByUsername(username);
      if (existingUser && existingUser.userId !== currentUser?.uid) {
        setUsernameCheckStatus('taken');
      } else {
        setUsernameCheckStatus('available');
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameCheckStatus('idle');
    }
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const username = e.target.value;

    // Clear existing timer
    if (usernameCheckTimer) {
      clearTimeout(usernameCheckTimer);
    }

    // Set status to idle while typing
    setUsernameCheckStatus('idle');

    // Debounce the username check
    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    setUsernameCheckTimer(timer);
  }

  const onSubmit = async (data: ProfileFormData) => {
    // Check if username is taken before submitting
    if (data.username && usernameCheckStatus === 'taken') {
      alert('Username is already taken. Please choose another one.');
      return;
    }

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

      // Update profile with usernameLower for case-insensitive lookups
      await updateUserProfile(currentUser!.uid, {
        displayName: data.displayName,
        username: data.username,
        usernameLower: data.username?.toLowerCase(),
        bio: data.bio,
        photoURL,
        settings: {
          ...profile?.settings,
          isPublic,
        },
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

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        currentUser!.email!,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser!, credential);

      // Update password
      await updatePassword(currentUser!, newPassword);

      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    try {
      setIsDeletingAccount(true);

      // Re-authenticate before deletion
      const credential = EmailAuthProvider.credential(
        currentUser!.email!,
        deleteConfirmPassword
      );
      await reauthenticateWithCredential(currentUser!, credential);

      // Delete user data from Firestore
      await deleteUserAccount(currentUser!.uid);

      // Delete Firebase Auth user
      await deleteUser(currentUser!);

      // Redirect to home
      router.push('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      if (err.code === 'auth/wrong-password') {
        alert('Incorrect password');
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
      alert('Failed to sign out');
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
                  {...register('username', {
                    onChange: handleUsernameChange,
                  })}
                  placeholder="username"
                  className="pl-8 pr-10"
                  error={errors.username?.message}
                />
                {usernameCheckStatus !== 'idle' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameCheckStatus === 'checking' && (
                      <Spinner size="sm" />
                    )}
                    {usernameCheckStatus === 'available' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {usernameCheckStatus === 'taken' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {usernameCheckStatus === 'taken' && (
                <p className="text-xs text-red-600 mt-1">
                  This username is already taken
                </p>
              )}
              {usernameCheckStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1">
                  Username is available!
                </p>
              )}
              {usernameCheckStatus === 'idle' && (
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              )}
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

        {/* Account Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Privacy & Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-500">
                  Allow others to view your profile and public projects
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
              className="w-full justify-start"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive mb-3">
                Once you delete your account, there is no going back. This action cannot be undone.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteModal(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="default"
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  isLoading={isChangingPassword}
                  className="flex-1"
                >
                  Change Password
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium mb-2">
                  Warning: This action cannot be undone!
                </p>
                <p className="text-sm text-gray-700">
                  All your projects, photos, recipes, and data will be permanently deleted.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your password to confirm
                </label>
                <Input
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type DELETE to confirm
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                  isLoading={isDeletingAccount}
                  variant="ghost"
                  className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete My Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmPassword('');
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
