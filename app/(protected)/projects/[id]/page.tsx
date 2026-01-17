import { Metadata, ResolvingMetadata } from 'next';
import ProjectDetailClient from './ProjectDetailClient';
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

    // We try to fetch the project. 
    // Note: This runs on the server. If the project is private, the unauthenticated fetch 
    // might fail or return null depending on Firestore Rules.
    // If it fails, we fall back to generic metadata.
    const project = await getProject(id);

    if (!project || !project.isPublic) {
      return {
        title: 'Project Not Found | PaintPile',
        description: 'This project is private or does not exist.',
      };
    }

    // Fetch photos to find a cover image
    let imageUrl = '/images/og-default.jpg'; // Fallback
    const previousImages = (await parent).openGraph?.images || [];

    try {
      const photos = await getProjectPhotos(id);
      if (photos && photos.length > 0) {
        if (project.featuredPhotoId) {
          const featured = photos.find(p => p.photoId === project.featuredPhotoId);
          imageUrl = featured ? (featured.url || featured.thumbnailUrl || imageUrl) : photos[0].url;
        } else {
          imageUrl = photos[0].url || photos[0].thumbnailUrl || imageUrl;
        }
      }
    } catch (err) {
      console.warn('Error fetching photos for metadata:', err);
    }

    return {
      title: `${project.name} | PaintPile`,
      description: project.description || `Check out ${project.name} on PaintPile!`,
      openGraph: {
        title: `${project.name} | PaintPile`,
        description: project.description || `Check out ${project.name} on PaintPile!`,
        images: [imageUrl, ...previousImages],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${project.name} | PaintPile`,
        description: project.description || `Check out ${project.name} on PaintPile!`,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'PaintPile Project',
      description: 'Check out this project on PaintPile.',
    };
  }
}

export default function Page() {
  return <ProjectDetailClient />;
}
