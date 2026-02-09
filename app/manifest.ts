import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PaintPile - Miniature Painting Journal',
        short_name: 'PaintPile',
        description: 'Track your miniature painting pile of opportunity. Manage projects, recipes, paints, and share with the community.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#09090b',
        theme_color: '#09090b',
        categories: ['lifestyle', 'productivity', 'entertainment'],
        icons: [
            {
                src: '/web-app-manifest-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/maskable-icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Dashboard',
                short_name: 'Dashboard',
                url: '/dashboard',
                description: 'View your painting dashboard',
                icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
            },
            {
                name: 'My Pile',
                short_name: 'Pile',
                url: '/pile',
                description: 'Browse your pile of shame',
                icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
            },
            {
                name: 'Paint Recipes',
                short_name: 'Recipes',
                url: '/recipes',
                description: 'Browse and create paint recipes',
                icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
            },
            {
                name: 'Community Feed',
                short_name: 'Feed',
                url: '/feed',
                description: 'See what others are painting',
                icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
            },
        ],
    };
}
