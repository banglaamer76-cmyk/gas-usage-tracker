# GasMate

Track how long everyone in a shared home uses the gas stove, and split the bill fairly.
Tap **Start timer** when the burner goes on and **Stop timer** when it's off. GasMate
records the session and shows each person's share of the total for any period.

It's a Progressive Web App: install it on a phone's home screen and it opens full screen
like a native app.

## Features

- One-tap stove timer that stays in sync across devices and survives app restarts
- Your usage and the household's for the current gas cylinder, today, the last 7 days, this or last month, all time, or a custom range
- The current cylinder's usage counts from the day it was connected. Only chosen accounts can change that date; anyone can pick the end date to check usage up to then
- Household leaderboard with each person's share of the total
- Sessions grouped by day, with daily totals
- Installable on Android and iPhone, with app icons and iOS launch screens
- Launches offline and recovers on its own once the connection returns
- Google sign-in, with an optional allow-list of accounts

## Getting started

Requirements: Node.js 20+, a MongoDB database (for example MongoDB Atlas) and a Google OAuth client.

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_URL` | The app's public URL, e.g. `http://localhost:3000` locally or `https://your-domain.com` in production |
| `NEXTAUTH_SECRET` | A long random string, e.g. from `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | From a Google Cloud OAuth client. Add `<NEXTAUTH_URL>/api/auth/callback/google` as an authorized redirect URI |
| `ALLOWED_EMAILS` | Optional. Comma-separated Google accounts allowed to use the app. Leave empty to allow any Google account |
| `CYLINDER_EDITORS` | Comma-separated Google accounts that can change the cylinder change date. Everyone else can only see it. Leave empty and nobody can change it |

## Installing on a phone

The app must be served over HTTPS (any production host such as Vercel does this).

- **Android (Chrome, Edge, Samsung Internet):** tap **Install** on the banner in the app,
  or use **Install app** in the account menu.
- **iPhone / iPad (Safari):** tap **Share**, then **Add to Home Screen**. The app shows these
  steps when you tap **Install**. iOS keeps the installed app's login separate from Safari,
  so sign in once inside the installed app.

## Changing the name or logo

The app name, colours and launch screen sizes live in `src/app/lib/brand.ts`, and the logo
artwork in `src/app/lib/logo.ts`. After editing them, regenerate every icon and iOS launch
image:

```bash
npm run icons
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Serve the production build |
| `npm run lint` | Lint with ESLint |
| `npm run icons` | Regenerate app icons and iOS launch images from the logo |

The service worker (`public/sw.js`) only registers in production builds. To try offline
support locally, use `npm run build && npm start`.

## Project structure

```
src/app/
  page.tsx               Signed-in check: splash, sign-in, offline or dashboard
  layout.tsx             Fonts, metadata and PWA tags
  manifest.ts            Web app manifest
  api/gas/               Timer and usage API (all routes require sign-in)
  components/            UI: dashboard, sign-in, install prompts, toasts, icons
  hooks/                 Live clock, current day, online status, install prompt
  lib/                   Auth, database, API helpers, formatting, brand and logo
  models/                Mongoose models: timer sessions and the current cylinder
public/
  sw.js                  Service worker (offline app shell)
  icons/, splash/        Generated app icons and iOS launch images
scripts/generate-icons.mjs
```

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, NextAuth.js (Google), MongoDB with
Mongoose, and SWR.
