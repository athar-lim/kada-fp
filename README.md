# CineTrack Frontend

Admin analytics dashboard for CineTrack, built with Next.js and TypeScript.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts for visualization

## Prerequisites

- Node.js 20+
- npm 10+
- Running CineTrack API instance

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_CINETRACK_API_BASE_URL=https://capstone-project-api-cinetrack.vercel.app
```

## Getting Started

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:6000
```

## Build

```bash
npm run build
```

## Key Directories

- `app/dashboard` - dashboard pages and layouts
- `components` - reusable UI and chart components
- `hooks` - shared dashboard filter/state hooks
- `lib/cinetrack-api.ts` - typed API client helpers

## API Integration

Main dashboard relies on:

- `GET /stats/summary`
- `GET /stats/cinema`
- `GET /stats/occupancy`
- `GET /movies/rankings`
- `GET /system/health`
- `GET /ai/insights/latest`
- `GET /dashboard/notifications`

## Deployment

The project is configured for Vercel deployment. Ensure `NEXT_PUBLIC_CINETRACK_API_BASE_URL` is set in the deployment environment.
