# Quick Start Guide - Desktop UI

## Prerequisites

1. **Backend running** on `http://127.0.0.1:8000`
   ```bash
   cd /Users/allanlugwiri/RustroverProjects/backend
   cargo run
   ```

2. **Node.js and npm** installed

3. **Rust and Tauri CLI** (already installed)

## Running the Desktop App

```bash
cd /Users/allanlugwiri/RustroverProjects/desktop-ui
npx tauri dev
```

The app will:
1. Start Next.js dev server on `http://localhost:3000`
2. Open a desktop window
3. Show splash screen for 2 seconds
4. Navigate to login page

## Login

Use your existing backend credentials:
- Email or username
- Password

The app will:
- Send `X-Client-Type: desktop` header
- Receive JWT tokens
- Store tokens in localStorage
- Redirect to dashboard

## Making API Calls

### Simple Way (Recommended)

```typescript
import { apiRequest } from '@/lib/api';

// Automatically includes Bearer token and X-Client-Type header
const data = await apiRequest('/graphql', {
  method: 'POST',
  body: {
    query: '{ user { id username } }'
  }
});
```

### Direct Tauri Command

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('authenticated_request', {
  url: 'http://127.0.0.1:8000/graphql',
  method: 'POST',
  token: localStorage.getItem('auth_token'),
  body: JSON.stringify({ query: '...' })
});
```

## Project Structure

```
desktop-ui/
├── app/
│   ├── components/
│   │   ├── SplashScreen.tsx    # Splash screen (2s)
│   │   └── LoginScreen.tsx     # Login with backend
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard
│   ├── login/
│   │   └── page.tsx            # Login route
│   └── page.tsx                # Home (shows splash)
├── lib/
│   ├── api.ts                  # API utilities
│   └── config.ts               # Backend config
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs             # Tauri commands
│   │   └── main.rs            # Entry point
│   └── tauri.conf.json        # Tauri config
├── .env.local                 # Backend URL
├── BACKEND_INTEGRATION.md     # Full integration docs
├── CLIENT_TYPES.md            # Client type system
└── SETUP.md                   # Setup guide
```

## Key Files

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### API Config (`lib/config.ts`)
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh_token',
  },
  GRAPHQL: '/graphql',
};
```

### Tauri Commands (`src-tauri/src/lib.rs`)
- `authenticate_user(email, password)` - Login
- `authenticated_request(url, method, token, body)` - Authenticated API call
- `logout_user(token)` - Logout

## Common Tasks

### Add a New Protected Route

1. Create route: `app/my-route/page.tsx`
2. Check auth:
   ```typescript
   import { isAuthenticated } from '@/lib/api';

   useEffect(() => {
     if (!isAuthenticated()) {
       router.push('/login');
     }
   }, []);
   ```

### Call Backend API

```typescript
import { apiRequest } from '@/lib/api';

const fetchUserData = async () => {
  try {
    const data = await apiRequest('/graphql', {
      method: 'POST',
      body: {
        query: '{ currentUser { id username email } }'
      }
    });
    console.log(data);
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

### Logout

```typescript
import { logout } from '@/lib/api';

const handleLogout = async () => {
  await logout();
  router.push('/login');
};
```

## Important Headers

All desktop app requests automatically include:

```
Authorization: Bearer <token>
X-Client-Type: desktop
Content-Type: application/json
```

This differentiates desktop requests from:
- **Web** (kastaem-ui): Uses cookies
- **Mobile**: Uses Bearer token with `X-Client-Type: mobile`

## Build for Production

```bash
# Build the desktop app
npx tauri build

# Output location:
# src-tauri/target/release/bundle/
```

## Troubleshooting

### "Connection failed"
- Ensure backend is running on port 8000
- Check `.env.local` has correct URL

### "Authorization header required"
- Token expired or invalid
- Clear localStorage and login again

### "Module not found: @tauri-apps/api"
- Run `npm install`

### Hot reload not working
- Restart with `npx tauri dev`

## Documentation

- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Full backend integration guide
- [CLIENT_TYPES.md](./CLIENT_TYPES.md) - Client type system (desktop/mobile/web)
- [SETUP.md](./SETUP.md) - Detailed setup instructions

## Support

- Backend: `/Users/allanlugwiri/RustroverProjects/backend`
- Desktop UI: `/Users/allanlugwiri/RustroverProjects/desktop-ui`
- Web UI: `/Users/allanlugwiri/RustroverProjects/kastaem-ui`

Backend runs on: `http://127.0.0.1:8000`
Desktop app: Native window (Tauri)
Web app: `http://localhost:3000` (browser)
