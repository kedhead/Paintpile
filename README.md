# PaintPile

Your miniature painting journal. From pile to painted.

## Overview

PaintPile is a cross-platform miniature painting journal application that helps hobbyists track their "Pile of Shame" (unpainted miniatures), document painting progress with photos, manage paint inventories, and share projects with the community.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Hosting:** Vercel
- **Form Handling:** React Hook Form + Zod
- **Charts:** Recharts
- **File Upload:** React Dropzone

## Features

- **User Authentication** - Email/password and Google OAuth
- **Project Tracking** - Document painting projects with photos and metadata
- **Photo Gallery** - Upload and organize progress photos
- **Paint Database** - 83+ paints from major brands (Citadel, Vallejo, Army Painter, etc.)
- **Pile of Shame Tracker** - Track unpainted miniatures and monitor progress
- **User Profiles** - Public profiles with project galleries
- **Responsive Design** - Works on mobile, tablet, and desktop

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account (free tier works)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd paintpile
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project called "PaintPile"
   - Enable Authentication (Email/Password + Google)
   - Create Firestore Database (production mode)
   - Enable Cloud Storage
   - Register a web app and copy the config values

4. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration values from step 3

5. Deploy Firebase Security Rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
paintpile/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (protected)/       # Protected pages (dashboard, projects, pile, profile)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature-specific components
├── contexts/             # React contexts (AuthContext)
├── lib/                  # Utility functions and helpers
│   ├── firebase/        # Firebase initialization
│   ├── firestore/       # Firestore helper functions
│   ├── utils/           # Utility functions
│   └── validation/      # Zod schemas
├── types/               # TypeScript type definitions
├── public/              # Static assets
└── scripts/             # Utility scripts (e.g., seed data)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

Required environment variables (see `.env.example`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PaintPile
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!
5. Update Firebase authorized domains with your Vercel URL

### Firebase Setup

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy rules: `firebase deploy --only firestore:rules,storage`

## Brand Colors

- **Orange:** #FB923C (Primary action color)
- **Amber:** #FBBF24 (Secondary color)
- **Rose:** #FB7185 (Accent color)

## Contributing

This project was built following the comprehensive plan in `CURSOR-PROJECT-PLAN.md`. Please refer to that document for feature implementation guidelines and best practices.

## License

ISC

## Acknowledgments

Built for miniature painting enthusiasts who want to conquer their pile of shame!
