# Assistify

Chat client dashboard — Next.js app with an authenticated API client.

## Overview

Assistify (this repo: `Assistify-client`) is a Next.js dashboard for a chat system. It talks to a backend API through a shared Axios client with auth handling.

## Stack

- Next.js
- React
- TypeScript
- Axios

## Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## API client

Authenticated requests go through a centralized Axios interceptor at `src/lib/axios.ts` (base URL, auth headers, error handling).

## Getting started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm start
```

## Notes

Keep tokens and API URLs in env files — do not commit secrets.
