# SEVAK Web

Civic issue-tracking web app for Nashik Municipal Corporation: citizens report problems with a
photo + GPS location, track them on a public map and feed, and escalated issues (50+ upvotes)
are surfaced for corporator follow-up.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open http://localhost:3000

## Pages

- `/` — landing page with live stats
- `/feed` — filterable issue feed (For You / Nearby / My Ward / Most Voted / Recent)
- `/report` — citizen issue submission (photo, GPS location, category)
- `/map` — ward map with issue markers and ward-wise details
- `/issue/[id]` — issue detail, timeline, comments
- `/escalated` — issues past the 50-vote threshold + ward-wise analytics
- `/sevaks`, `/sevaks/[id]` — corporator directory and profiles
- `/login`, `/admin`, `/admin/issue/[id]` — sevak login and issue management

## Deployment

Deploys as a standard Next.js 14 app (e.g. Vercel). Set these environment variables on the
hosting platform:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply any new SQL files under `supabase/migrations/` in the Supabase SQL editor before deploying
a release that depends on them.

See `PROMPT.md` for the original design spec / data model.
