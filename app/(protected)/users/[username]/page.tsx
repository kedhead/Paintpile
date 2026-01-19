'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { FollowButton } from '@/components/social/FollowButton';
import { getUserByUsername, getUserPublicProjects } from '@/lib/firestore/users';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { User } from '@/types/user';
import { Project } from '@/types/project';
import { MapPin, Calendar, Lock } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);

        // 1. Look up user by username
        let foundUser = await getUserByUsername(username);

        // 2. If not found, try looking up by User ID (fallback for legacy/migrated URLs)
        if (!foundUser) {
          // We dynamically import here or just use the one we have? 
          // We need getUserProfile. It was imported.
          // However, getUserProfile requires an ID. 'username' param might be an ID.
          const userById = await getUserProfile(username);
          if (userById) {
            foundUser = userById;
          }
        }

        if (!foundUser) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setUser(foundUser);
        setFollowerCount(foundUser.stats.followerCount || 0);

        // Check if profile is public
        if (!foundUser.settings.publicProfile) {
          setLoading(false);
          return;
        }

        // Load user's public projects
        const publicProjects = await getUserPublicProjects(foundUser.userId);
        setProjects(publicProjects);

        // Load cover photos for each project
        const photoMap: Record<string, string> = {};
        await Promise.all(
          publicProjects.map(async (project) => {
            try {
              const photos = await getProjectPhotos(project.projectId);
              if (photos.length > 0) {
                // Use featured photo if set, otherwise use first photo
                let coverPhoto = photos[0];
                if (project.featuredPhotoId) {
                  const featuredPhoto = photos.find(p => p.photoId === project.featuredPhotoId);
                  if (featuredPhoto) {
                    coverPhoto = featuredPhoto;
                  }
                }
                photoMap[project.projectId] = coverPhoto.thumbnailUrl || coverPhoto.url;
              }
            } catch (err) {
              console.error(`Error loading photos for project ${project.projectId}:`, err);
            }
          })
        );
        setCoverPhotos(photoMap);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [username]);

  function handleFollowChange(isFollowing: boolean) {
    // Update local follower count
    setFollowerCount((prev) => (isFollowing ? prev + 1 : prev - 1));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">User Not Found</h1>
          <p className="text-muted-foreground">
            The user @{username} doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  if (user && !user.settings.publicProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            This Profile is Private
          </h1>
          <p className="text-muted-foreground">
            @{username} has chosen to keep their profile private.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="relative border-b border-border bg-card">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-4 border-background shadow-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  {user.displayName[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    {user.displayName}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">@{user.username}</p>
                </div>
                {currentUser && currentUser.uid !== user.userId && (
                  <FollowButton
                    currentUserId={currentUser.uid}
                    targetUserId={user.userId}
                    onFollowChange={handleFollowChange}
                  />
                )}
              </div>

              {user.bio && (
                <p className="text-card-foreground mb-4 max-w-2xl">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-6">
                <div>
                  <div className="text-2xl font-bold text-foreground">{user.stats.projectCount}</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{projects.length}</div>
                  <div className="text-sm text-muted-foreground">Public</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{followerCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{user.stats.followingCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">
          Public Projects
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No public projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                coverPhotoUrl={coverPhotos[project.projectId]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
