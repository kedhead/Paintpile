import { Metadata, ResolvingMetadata } from 'next';
import ArmyDetailClient from './ArmyDetailClient';
import { getArmy } from '@/lib/firestore/armies';
import { getProject } from '@/lib/firestore/projects';
import { getProjectPhotos } from '@/lib/firestore/photos';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { id } = await params;

    const army = await getArmy(id);

    if (!army || (!army.isPublic)) {
      return {
        title: 'Army Not Found | PaintPile',
        description: 'This army is private or does not exist.',
      };
    }

    let imageUrl = '/images/og-default.jpg'; // Fallback
    const previousImages = (await parent).openGraph?.images || [];

    // Strategy 1: Custom Photo URL
    if (army.customPhotoUrl) {
      imageUrl = army.customPhotoUrl;
    } else if (army.projectIds.length > 0) {
      // Strategy 2: Search for featured photo or use first project's cover
      // We limit to checking the first 5 projects to avoid excessive reads during metadata generation
      const projectsToCheck = army.projectIds.slice(0, 5);

      for (const projectId of projectsToCheck) {
        try {
          // We need to check if we can read the photos (project might be private)
          // If we can't read, we just continue.
          // Note: getProjectPhotos might return empty if no access or no photos
          const photos = await getProjectPhotos(projectId);
          if (photos && photos.length > 0) {
            // If we found the global featured photo, use it and break
            if (army.featuredPhotoId) {
              const featured = photos.find(p => p.photoId === army.featuredPhotoId);
              if (featured) {
                imageUrl = featured.url || featured.thumbnailUrl || imageUrl;
                break;
              }
            }

            // If we haven't set a URL yet (first valid photo found), set it as fallback
            // But keep searching in case we find the *featured* one later in the loop
            if (imageUrl === '/images/og-default.jpg') {
              imageUrl = photos[0].url || photos[0].thumbnailUrl || imageUrl;
            }
          }
        } catch (err) {
          // Ignore errors (likely permission or missing project)
          continue;
        }
      }
    }

    return {
      title: `${army.name} | PaintPile`,
      description: army.description || `Check out ${army.name} on PaintPile!`,
      openGraph: {
        title: `${army.name} | PaintPile`,
        description: army.description || `Check out ${army.name} on PaintPile!`,
        images: [imageUrl, ...previousImages],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${army.name} | PaintPile`,
        description: army.description || `Check out ${army.name} on PaintPile!`,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'PaintPile Army',
      description: 'Check out this army on PaintPile.',
    };
  }
}

export default function Page() {
  return <ArmyDetailClient />;
}
