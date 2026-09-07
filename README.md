# KIKY

A social platform to find like-minded people nearby and do activities together — meet people through shared interests (cricket, coffee, gym, movies, gaming, food...) without dating pressure.

**Backend:** Node.js + Express + MongoDB + Socket.io. **Frontend:** React + Vite + Tailwind.

## Quick Start (development)

```bash
git clone <repo> kiky && cd kiky

# 1. Install both workspaces
npm run install:all

# 2. Configure the backend
cp server/.env.example server/.env
#    -> fill in MONGODB_URI, JWT_SECRET, and (optional) Google OAuth creds

# 3. Run the backend (http://localhost:5001)
npm run dev:server

# 4. In another terminal, run the frontend (http://localhost:5173)
npm run dev
```

Production: `npm run build && npm start` serves the built frontend from the Express server on `http://localhost:5001`.

## Environment Variables (`server/.env`)

| Variable | Description |
| --- | --- |
| `PORT` | Backend port (`5001`) |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (`7d`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials (optional) |
| `GOOGLE_CALLBACK_URL` | OAuth callback, e.g. `http://localhost:5001/auth/google/callback` |
| `FRONTEND_URL` | CORS/redirect target, e.g. `http://localhost:5173` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web push credentials (generate with `node -e "console.log(require('web-push').generateVAPIDKeys())"`). Only needed for PWA push notifications. |

## Tech & Architecture

```
kiky/
├── server/           # Express API + Socket.io + Mongo models
│   ├── config/       # DB + passport
│   ├── middleware/   # auth (JWT) guards
│   ├── models/       # User, Activity, Message, Notification, Community, ...
│   ├── routes/       # auth, activities, users, messages, notifications, ...
│   ├── socket/       # real-time: chat, typing, read receipts, live map
│   └── utils/        # notify, lifecycle (status sweeps), haversine nearby
├── src/
│   ├── components/   # layout, map (Leaflet), common UI
│   ├── pages/        # 34 curated, lazy-loaded routes
│   ├── context/      # Auth, Socket, Theme
│   └── utils/        # normalize, location helpers
└── vite.config.js    # dev proxy: /api, /auth, /uploads, /socket.io -> :5001
```

## Feature Map

**Accounts** — Email/password register + login, Google OAuth (auto-creates accounts, skips onboarding), JWT sessions, profile editing with avatar upload, privacy controls, delete account.

**Activities** — Create (with location + geolocation), browse, save/bookmark, join/leave, photos, expenses split, check-ins, feedback/rating, flag/report. Nearby activities computed with haversine distance and sorted by distance; address-only activities are kept.

**Discovery** — Dashboard "Happening near you" (uses saved location, falls back to browser geolocation), Explore with categories + "Near me" sort, Smart Matching (people by shared interests), People discovery.

**Matching & Friends** — Like someone → notification; a mutual like becomes a **match** (both become connections) with instant notification. Unfriend, block, connections list.

**Chat** — Direct + activity group chat over Socket.io with typing indicators, live read receipts (double check), online status, unread counts.

**Lifecycle** — Past activities automatically roll `upcoming → ongoing (live) → completed` (sweep on server start, every 10 min, and lazily on list/detail reads). Completion bumps streaks and notifies hosts/participants to rate the experience.

**Gamification** — Profile badges computed from real stats (activities, streaks, connections, gallery photos) with progress bars.

**PWA & Push** — Installable progressive web app (manifest + icons + service worker) with web push notifications delivered even when the app is closed; enable/disable on the Notifications page.

**Profile** — Bio, interests, joined date, gallery (upload/remove photos + photos from your activities), stats, badges.

**Notifications** — In-app notifications for likes/matches, messages, connections, activity completion, invitations, achievements.

**Infrastructure** — React.lazy code splitting (~315 KB main bundle), keyless OpenStreetMap tiles with a dark-theme filter, helmet security headers, rate limiting on API + auth routes, input validation, single-command production deploy.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Frontend dev server (Vite, :5173) |
| `npm run dev:server` | Backend dev server (node --watch, :5001) |
| `npm run build` | Production build of the frontend |
| `npm start` | Serve the built app from Express (:5001) |
| `npm --prefix server run check` | Verify the MongoDB connection |

## Notes

- Demo data: two seed users and six activities seeded around Vadodara for the nearby/location demo.
- The map uses public OpenStreetMap tiles (fine for demos; for large-scale use, swap in a keyed provider).
- License: MIT