# PaintPile Mobile App

Thin native wrapper around the PaintPile web app using Expo + WebView.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g eas-cli`
- An [expo.dev](https://expo.dev) account (already set up)

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

## Building with EAS

### 1. Link to your Expo project

```bash
eas init
```

This will populate the `extra.eas.projectId` field in `app.json`.

### 2. Build for Android (APK for testing)

```bash
eas build --platform android --profile preview
```

### 3. Build for iOS (no Mac needed!)

```bash
eas build --platform ios --profile preview
```

EAS builds iOS in the cloud. You'll need an Apple Developer account ($99/year)
and to configure credentials when prompted.

### 4. Build both for production

```bash
eas build --platform all --profile production
```

## App Store Submission

```bash
eas submit --platform android  # Google Play
eas submit --platform ios      # App Store
```

## Assets

Before building, replace the placeholder assets:

- `assets/icon.png` - App icon (1024x1024)
- `assets/splash.png` - Splash screen (1284x2778)
- `assets/adaptive-icon.png` - Android adaptive icon (1024x1024)

## Configuration

The app loads `https://www.paintpile.com` by default. To change this,
update the `WEBAPP_URL` in `app.json` > `expo.extra.WEBAPP_URL`.

## How It Works

The app is a native shell (iOS + Android) that loads the PaintPile
web app inside a WebView. This means:

- All features from the web app work as-is
- Firebase auth sessions persist via DOM storage
- Android back button navigates within the web app
- File uploads (photos) work natively
- The web app can detect it's running in the native shell
  via the "PaintPile-Native" user agent string
