# CineTrack Frontend

Frontend admin dashboard built with Next.js.

## Local Setup

### Requirements

- Node.js 20+ recommended
- npm 10+ recommended
- Internet access to `https://capstone-project-api-cinetrack.vercel.app`

### Environment

Create `.env.local` from [`.env.local.example`](/C:/Users/user/Documents/KADA%20BATCH%203%202026/kada-fp/.env.local.example):

```env
NEXT_PUBLIC_CINETRACK_API_BASE_URL=https://capstone-project-api-cinetrack.vercel.app
```

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

App URL:

```text
http://localhost:6000
```

## Current API Integration

Dashboard page at [app/dashboard/page.tsx](/C:/Users/user/Documents/KADA%20BATCH%203%202026/kada-fp/app/dashboard/page.tsx) is already connected to:

- `GET /stats/summary`
- `GET /cinemas`
- `GET /stats/trends`
- `GET /stats/occupancy`
- `GET /stats/movie`
- `GET /movie?top10=true`
- `GET /system/health`

Shared API helpers live in [lib/cinetrack-api.ts](/C:/Users/user/Documents/KADA%20BATCH%203%202026/kada-fp/lib/cinetrack-api.ts).

## Dashboard Access

The dashboard can be accessed at:
👉 https://kada-fp.vercel.app/dashboard
