# Craftech Client

A Next.js-based client application for the Craftech chat system.

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## API Configuration

The application uses a centralized axios interceptor located at `src/lib/axios.ts` that:

- Automatically adds bearer token authentication to all requests
- Handles 401 unauthorized responses by redirecting to login
- Uses the base URL from environment variables

## API Endpoints

API endpoints are centralized in `src/lib/constants.ts` for easy maintenance and updates.

## Usage

### Making API Calls

Instead of using `fetch()` directly, use the axios interceptor:

```typescript
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

// GET request
const response = await api.get(`${API_ENDPOINTS.VISITORS}`);

// POST request
const response = await api.post(`${API_ENDPOINTS.LOGIN}`, {
  email: 'user@example.com',
  password: 'password'
});
```

### Authentication

The axios interceptor automatically:
- Reads the bearer token from localStorage
- Adds it to the Authorization header
- Handles token expiration and redirects

### WebSocket Connections

WebSocket URLs are automatically generated from the API base URL:

```typescript
const wsUrl = `${API_ENDPOINTS.WS_BASE}/ws/chat/${sessionId}/agent/${agentId}`;
```

## Development

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run development server: `npm run dev`

## Project Structure

- `src/lib/axios.ts` - Axios interceptor with authentication
- `src/lib/constants.ts` - API endpoint constants
- `src/contexts/auth-context.tsx` - Authentication context
- `src/app/chat/visitors/` - Visitor management components
