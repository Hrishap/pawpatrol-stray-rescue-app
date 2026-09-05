# PawPatrol — Stray Rescue App

A community stray-animal rescue coordination app for Kochi, Kerala. Reporters spot strays in
distress and file reports in seconds; volunteers get notified, claim cases, and coordinate
rescue; NGOs/shelters manage the case queue and verify outcomes.

Rebuilt as a production app from a Claude Design prototype — see
[`design-reference/PAWPATROL_SPEC.md`](design-reference/PAWPATROL_SPEC.md) for the full screen
inventory, data model, and design tokens the implementation is built from.

## Stack

- **Mobile**: React Native via [Expo](https://expo.dev) (TypeScript, Expo Router)
- **Backend**: [Supabase](https://supabase.com) (Postgres, Auth, Storage, Realtime)
- **Maps**: [Mapbox](https://www.mapbox.com)
- **i18n**: English, Malayalam (മലയാളം), Hindi (हिन्दी) via i18next

## Repository layout

```
apps/mobile/       Expo app
supabase/           Postgres schema (migrations/) + local dev config
design-reference/   Original design spec, screenshots, and source .dc.html
```

## Prerequisites

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- The `supabase` CLI and `gh` CLI (see below — installed as prebuilt binaries in this repo's
  setup since Homebrew requires newer Xcode Command Line Tools than this machine has;
  `brew install supabase/tap/supabase gh` will work fine on a machine with up-to-date CLTs)
- A free [Mapbox](https://www.mapbox.com) account (for map screens, from M2 onward)
- A free [Expo](https://expo.dev) account (for EAS builds, to install the app on a real device —
  this project has no local iOS Simulator/Xcode available)

## Local backend setup

```bash
supabase start
```

This starts Postgres + Auth + Storage + Realtime in Docker, applies every migration in
`supabase/migrations/`, and seeds `supabase/seed.sql` (demo shelters + adoptable animals). Copy
the printed `API_URL` and `ANON_KEY` into `apps/mobile/.env` (see `.env.example`).

Stop it with `supabase stop`. Reset the DB (reapply migrations + reseed) with `supabase db reset`.

To regenerate TypeScript types after a schema change:

```bash
supabase gen types typescript --local > apps/mobile/src/types/database.ts
```

Then re-add the friendly type aliases at the bottom of that file (see git history for the block
to keep — `Profile`, `Case`, `Shelter`, etc.).

## Mobile app setup

```bash
cd apps/mobile
cp .env.example .env   # fill in Supabase + Mapbox values
npm install
npm run start
```

Mapbox (`@rnmapbox/maps`) is a native module, so the map screens require a custom **development
build** — plain Expo Go won't load it. Build one via EAS (no local Xcode/Android Studio needed):

```bash
npx eas login
npx eas build --profile development --platform ios      # or --platform android
```

Install the resulting build on your own device via the link/QR code EAS prints.

## Known follow-ups from the original design

See `design-reference/PAWPATROL_SPEC.md` §4.2 and §7 for the full list of prototype-only gaps
this rebuild fixes for real (verify-resolution actually resolving a case, the location pin
actually being saved, real per-case chat instead of an echo-bot, persisted NGO notes, working
Call/Directions links, computed profile stats). Real push notifications (APNs/FCM) are not wired
yet — the notification data model is realtime/in-app only for now; see the plan for what's needed
to add real push later.
