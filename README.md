# Assistify Dashboard

Next.js operator dashboard for Hailou Chat: live visitor chat, history, tickets, customers, organizations, and reporting.

## Overview

Authenticated agents and client admins work from a role-gated UI. The app talks to the Hailou Chat HTTP API with Axios (Bearer access token + refresh), and uses a singleton SSE manager for agent notification streams. Global chat context keeps live conversation UI available across routes.

## Features

- Login with token refresh and `/auth/me` session restore
- Role guards: `client_admin` and `client_agent`
- Live chat workspace: visitors, conversation history, personal and agent settings
- Dashboard: customers, organizations, tickets, reporting
- Real-time notifications via SSE (`/notifications/stream/{agentId}`)
- Protected routes and shared UI primitives (Radix-based)

## Stack

- Next.js 15 (Turbopack), React 19, TypeScript
- Axios, Tailwind CSS, Lucide / react-icons
- SSE for notifications; emoji picker for chat compose

## Structure

```
src/app/
  login/           # Auth
  chat/            # Visitors, history, settings (agents / personal)
  dashboard/       # Customers, organizations, tickets, reporting
src/contexts/      # Auth, global chat, visitor actions/requests
src/lib/           # Axios client, SSE manager, storage helpers
src/components/    # Protected route, role guard, UI kit
```

## How to run

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm start
```

The API client in `src/lib/axios.ts` targets the Hailou Chat API base URL. Point it at your own backend if you run a local API. Keep tokens in browser storage / env only — do not commit secrets.
