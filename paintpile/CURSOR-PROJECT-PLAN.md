# 🎨 PaintPile - Cursor AI Project Plan

**Comprehensive development plan for building PaintPile with Cursor AI assistance**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start with Cursor](#quick-start-with-cursor)
3. [Feature-by-Feature Build Guide](#feature-by-feature-build-guide)
4. [Cursor Prompts Library](#cursor-prompts-library)
5. [Database Schema](#database-schema)
6. [File Structure](#file-structure)
7. [Deployment Guide](#deployment-guide)

---

## 📖 Project Overview

**PaintPile** - Your miniature painting journal. From pile to painted.

**One-Paragraph Synopsis:**
PaintPile is a cross-platform miniature painting journal app (web, iOS, Android) built on Firebase that helps hobbyists conquer their pile of shame by tracking unpainted minis, documenting painting progress with photo-based journals, managing paint inventories with visual color markers on images, and sharing completed projects with the community. Features include a comprehensive paint database (83+ paints), real-time social features, offline-first functionality, Pile of Shame tracker, custom paint mix recording, and technique tagging (OSL, NMM, weathering), all wrapped in a warm orange/amber aesthetic.

**Tech Stack:**
- Next.js 15 + TypeScript
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Vercel hosting

---

## 🚀 Quick Start with Cursor

### 1. Open Your Project

```bash
cd paintpile-project
cursor .
```

### 2. Create `.cursorrules` File

Create this file in your project root to give Cursor context:

```
# PaintPile Development Rules for Cursor AI

## Project Context
- This is PaintPile, a miniature painting journal app
- Tech stack: Next.js 15 + TypeScript + Firebase + Tailwind
- Brand colors: Orange (#FB923C), Amber (#FBBF24), Rose (#FB7185)
- Target: Miniature painters (Warhammer, D&D, etc.)

## Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind for all styling
- Follow Next.js 15 App Router conventions
- Always handle errors with try/catch
- Include loading states for all async operations

## Component Structure
- Place components in /components directory
- Use descriptive names: UserProfileCard.tsx
- Include TypeScript interfaces for props
- Add comments for complex logic

## Firebase Patterns
- Always check auth state before data operations
- Use optimistic updates for better UX
- Implement proper error handling
- Add loading states
- Cache data when appropriate

## File Organization
- Server components by default
- Mark 'use client' only when needed
- Keep API routes in /app/api
- Put utilities in /lib
- Store types in /types

## Security
- Never expose Firebase secrets
- Validate all user inputs
- Sanitize data before storage
- Use Firebase Security Rules
```

### 3. Set Up Environment

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Start Building!

Use Cmd+L in Cursor to chat, or Cmd+K to quick-edit selected code.

---

## 🎯 Feature-by-Feature Build Guide

### Feature 1: User Authentication (Week 1)

**Cursor Prompt:**
```
I need to implement Firebase Authentication for PaintPile. Create:

1. Auth Context Provider:
   - Wrap app with AuthContext
   - Provide currentUser state
   - Handle loading states
   - Provide login/logout/signup functions

2. Login Page (/app/login/page.tsx):
   - Email/password form
   - Google OAuth button
   - Link to signup
   - Form validation with react-hook-form + zod
   - Error message display
   - Redirect to /dashboard after login

3. Signup Page (/app/signup/page.tsx):
   - Email/password form
   - Create user profile in Firestore on signup
   - Form validation
   - Link to login

4. Protected Route wrapper:
   - Redirect unauthenticated users to /login
   - Show loading state while checking auth

5. User Profile Document (Firestore):
   Collection: users/{userId}
   Fields: {
     userId: string
     email: string
     displayName: string
     photoURL: string
     createdAt: timestamp
   }

Use TypeScript, Tailwind CSS, Next.js 15 App Router patterns.
Show complete file structure and implementation.
```

**Files to create:**
- `/contexts/AuthContext.tsx`
- `/app/login/page.tsx`
- `/app/signup/page.tsx`
- `/components/auth/LoginForm.tsx`
- `/components/auth/SignupForm.tsx`
- `/components/auth/ProtectedRoute.tsx`
- `/lib/auth.ts`

**Testing checklist:**
- [ ] Can sign up with email/password
- [ ] Can log in with email/password
- [ ] Can log in with Google
- [ ] Protected routes redirect to login
- [ ] User profile created in Firestore
- [ ] Logout works

---

### Feature 2: Project Creation (Week 1-2)

**Cursor Prompt:**
```
Create project creation functionality for PaintPile:

1. New Project Page (/app/projects/new/page.tsx):
   - Form with fields:
     * name (required, max 100 chars)
     * description (optional, max 500 chars, textarea)
     * type (select: Warhammer, D&D, Historical, Other)
     * status (select: Not Started, In Progress, Completed)
     * startDate (date picker)
   - Validation with react-hook-form + zod
   - Save button (disabled while saving)
   - Cancel button

2. Firestore Structure:
   Collection: projects
   {
     projectId: string
     userId: string
     name: string
     description: string
     type: 'warhammer' | 'd&d' | 'historical' | 'other'
     status: 'not-started' | 'in-progress' | 'completed'
     startDate: timestamp
     createdAt: timestamp
     updatedAt: timestamp
     isPublic: boolean (default false)
     photoCount: number (default 0)
     paintCount: number (default 0)
   }

3. After creation:
   - Redirect to /projects/{projectId}
   - Show success toast

Use TypeScript, Tailwind, proper error handling and loading states.
```

**Testing checklist:**
- [ ] Form validation works
- [ ] Project created in Firestore
- [ ] Redirects after creation
- [ ] Loading state during save
- [ ] Errors displayed properly

---

### Feature 3: Photo Upload & Gallery (Week 2)

**Cursor Prompt:**
```
Build photo upload and gallery for project progress photos:

1. Photo Upload Component:
   - Drag & drop zone (react-dropzone)
   - File picker button
   - Preview uploaded images before upload
   - Accept: jpg, png, webp only
   - Max 5MB per file
   - Max 10 photos per upload
   - Show upload progress bar
   - Compress images client-side before upload (max 1920px wide)

2. Firebase Storage:
   - Path: users/{userId}/projects/{projectId}/photos/{photoId}/
   - Save full size (max 1920px)
   - Save thumbnail (400px)

3. Firestore Structure:
   Collection: projects/{projectId}/photos
   {
     photoId: string
     userId: string
     projectId: string
     url: string
     thumbnailUrl: string
     caption: string
     createdAt: timestamp
     width: number
     height: number
   }

4. Photo Gallery:
   - Responsive grid (1 col mobile, 3 cols desktop)
   - Lightbox on click
   - Delete button with confirmation
   - Lazy loading
   - Sort by date (newest first)

Include TypeScript, error handling, loading states, image compression.
```

**Testing checklist:**
- [ ] Can upload single photo
- [ ] Can upload multiple photos
- [ ] File validation works
- [ ] Photos appear in gallery
- [ ] Lightbox opens
- [ ] Can delete photos
- [ ] Progress bar works

---

### Feature 4: Paint Tracking (Week 2-3)

**Cursor Prompt:**
```
Implement paint color tracking with visual markers:

1. Paint Database:
   Create seed data for paints collection with 83 paints:
   - Citadel (40 paints)
   - Vallejo Model Color (20)
   - Army Painter (10)
   - Reaper (5)
   - Scale75 (3)
   - ProAcryl (2)
   - Kimera (1)
   - AK Interactive (1)
   - P3 (1)
   
   Structure: {
     paintId: string
     brand: string
     name: string
     hexColor: string
     type: 'base' | 'layer' | 'shade' | 'metallic'
   }

2. Add Paint to Project:
   - Search/filter paints by brand or name
   - Click to add to project
   - Store in: projects/{projectId}/paints/{paintId}
   - Show list of used paints

3. Custom Paint Creation:
   - Form: brand, name, hex color
   - Color picker
   - Save to user's custom paints

4. Paint List Component:
   - Group by brand
   - Show color swatch
   - Delete button

Use TypeScript, include color picker, make visually appealing.
```

**Testing checklist:**
- [ ] Can search paints
- [ ] Can add paint to project
- [ ] Can create custom paint
- [ ] Paint list displays correctly
- [ ] Colors accurate

---

### Feature 5: Pile of Shame Tracker (Week 3)

**Cursor Prompt:**
```
Build the Pile of Shame tracker - signature feature:

1. Pile Dashboard (/app/pile/page.tsx):
   - Big number: total unpainted count
   - Monthly progress chart (painted vs added)
   - List of unpainted items
   - Quick add button
   - Sort options: date, name, type

2. Add to Pile Form:
   - Fields: name, type, quantity (default 1)
   - Quick add modal
   - Batch add support

3. Firestore Structure:
   Collection: users/{userId}/pile
   {
     pileId: string
     name: string
     type: string
     quantity: number
     addedDate: timestamp
     status: 'unpainted' | 'painting' | 'painted'
     projectId: string | null
   }

4. Auto-update from Projects:
   - When project status → 'in-progress': mark as 'painting'
   - When project → 'completed': mark as 'painted'

5. Analytics:
   - Total unpainted
   - Total painted this month/year
   - Completion rate
   - Display as cards/charts

Use recharts for charts, make it motivational (not shameful).
```

**Testing checklist:**
- [ ] Can add to pile
- [ ] Pile count updates
- [ ] Chart displays
- [ ] Status updates work
- [ ] Analytics calculate

---

### Feature 6: User Profile & Dashboard (Week 3-4)

**Cursor Prompt:**
```
Create user profile and dashboard:

1. Dashboard (/app/dashboard/page.tsx):
   - Welcome message
   - Pile stats widget
   - Recent projects (last 5)
   - Quick actions: new project, add to pile

2. Profile Page (/app/profile/page.tsx):
   - Avatar (upload to Firebase Storage)
   - Display name (editable)
   - Bio (200 chars max)
   - Stats: projects, photos, pile count
   - Public project gallery

3. Edit Profile (/app/profile/edit/page.tsx):
   - Update display name
   - Update bio
   - Upload avatar with crop
   - Privacy settings

4. User Document Structure:
   users/{userId}: {
     userId: string
     email: string
     displayName: string
     username: string (unique, lowercase)
     bio: string
     photoURL: string
     createdAt: timestamp
     settings: {
       publicProfile: boolean
       showPileStats: boolean
     }
     stats: {
       projectCount: number
       photoCount: number
       pileCount: number
     }
   }

Include avatar upload with crop, auto-update stats.
```

**Testing checklist:**
- [ ] Dashboard displays
- [ ] Can edit profile
- [ ] Avatar upload works
- [ ] Stats display correctly
- [ ] Can view profile

---

## 💬 Cursor Prompts Library

### Quick Actions

**Create Component:**
```
Create a [ComponentName] component that:
- [functionality]
- Uses Tailwind styling
- TypeScript types
- Loading and error states
- Mobile responsive
```

**Fix Error:**
```
Fix this TypeScript error:
[paste error]
```

**Add Tests:**
```
Write tests for this component including:
- Rendering tests
- User interactions
- Edge cases
- Mock Firebase
```

**Optimize Performance:**
```
Optimize this component with:
- React.memo
- useMemo/useCallback
- Lazy loading
```

---

## 🗄 Database Schema

### Core Collections

**users (top-level)**
```typescript
{
  userId: string
  email: string
  displayName: string
  username: string
  bio: string
  photoURL: string
  createdAt: Timestamp
  settings: {
    publicProfile: boolean
    showPileStats: boolean
  }
  stats: {
    projectCount: number
    photoCount: number
    pileCount: number
  }
}
```

**projects (top-level)**
```typescript
{
  projectId: string
  userId: string
  name: string
  description: string
  type: string
  status: 'not-started' | 'in-progress' | 'completed'
  startDate: Timestamp
  createdAt: Timestamp
  isPublic: boolean
  photoCount: number
  paintCount: number
}
```

**projects/{id}/photos (subcollection)**
```typescript
{
  photoId: string
  url: string
  thumbnailUrl: string
  caption: string
  createdAt: Timestamp
}
```

**users/{id}/pile (subcollection)**
```typescript
{
  pileId: string
  name: string
  type: string
  quantity: number
  status: 'unpainted' | 'painting' | 'painted'
  addedDate: Timestamp
}
```

---

## 📂 File Structure

```
paintpile/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── pile/page.tsx
│   └── profile/
│       ├── page.tsx
│       └── edit/page.tsx
│
├── components/
│   ├── auth/
│   ├── projects/
│   ├── photos/
│   ├── paints/
│   ├── pile/
│   └── ui/
│
├── contexts/
│   └── AuthContext.tsx
│
├── lib/
│   ├── firebase.ts
│   ├── auth.ts
│   └── firestore/
│
├── types/
│   ├── project.ts
│   ├── photo.ts
│   └── user.ts
│
└── public/
    └── logo-*.png
```

---

## 🚀 Deployment Guide

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init
# Select: Firestore, Storage, Hosting

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 2. Vercel Deployment

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

### 3. Security Rules

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    match /projects/{projectId} {
      allow read: if resource.data.isPublic || request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## ✅ Launch Checklist

- [ ] All features tested
- [ ] Firebase rules deployed
- [ ] Environment variables set
- [ ] Logo files in /public
- [ ] Mobile responsive
- [ ] SEO metadata complete
- [ ] Domain connected
- [ ] Analytics configured

---

## 🎉 You're Ready!

**To start building:**
1. Open Cursor in your project
2. Pick Feature 1
3. Copy the prompt into Cmd+L
4. Let Cursor generate the code
5. Test and iterate!

**Remember:** Cursor is your coding partner. Ask questions, request changes, and build iteratively!

Good luck building PaintPile! 🎨🚀
