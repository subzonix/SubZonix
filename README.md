# Tapn Tools (Next.js + Firebase)

Tapn Tools is a sales console built with Next.js App Router and Firebase (Auth + Firestore + Storage). It supports **Owner**, **User**, and **Staff** roles, plan-based feature gating, and a public landing + shop.

## Documentation
- Full workflow + what every page does: [APP_WORKFLOW.md](./APP_WORKFLOW.md)
- UI text + animations map (landing/about/how-it-works): [UI_TEXT_AND_ANIMATIONS.md](./UI_TEXT_AND_ANIMATIONS.md)

## Local Setup
### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Create a `.env` file with Firebase public config values:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_OWNER_EMAIL=
```

### 3) Run the dev server
```bash
npm run dev
```

Open http://localhost:3000

## Build
```bash
npm run build
npm run start
```

## Tech Stack
- Next.js App Router
- Tailwind CSS (v4)
- Firebase: Auth, Firestore, Storage
- next-themes for light/dark theme
