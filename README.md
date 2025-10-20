# Kastaem Desktop UI

A Tauri desktop application built with Next.js 15, React 19, and TypeScript, integrated with your Kastaem Rust backend.

## Features

✅ **Native Desktop App** - Built with Tauri for native performance
✅ **Splash Screen** - Animated splash screen on launch
✅ **Authentication** - Login with your Kastaem backend
✅ **Protected Routes** - Dashboard with authentication
✅ **Bearer Token Auth** - Proper client type system integration
✅ **API Utilities** - Easy-to-use API wrapper functions
✅ **Separate from Web** - No interference with kastaem-ui browser app
✅ **Business/Institution Only** - Restricted to business and institution accounts
✅ **Role-Based Dashboard** - Different views for administrators and staff
✅ **Permission System** - UI adapts based on user roles and permissions

## Quick Start

### Prerequisites

1. **Backend running** on `http://127.0.0.1:8000`
   ```bash
   cd /Users/allanlugwiri/RustroverProjects/backend
   cargo run
   ```

2. Node.js and npm installed

### Run Desktop App

```bash
npx tauri dev
```

This will:
1. Start Next.js dev server
2. Open desktop window
3. Show splash screen → login → dashboard

## Project Structure

```
desktop-ui/
├── app/                        # Next.js app directory
│   ├── components/            # React components
│   │   ├── SplashScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── dashboard/             # Dashboard page
│   ├── login/                # Login page
│   └── page.tsx              # Home (splash screen)
├── lib/                       # Utilities
│   ├── api.ts                # API helper functions
│   └── config.ts             # Backend configuration
├── src-tauri/                 # Tauri Rust code
│   ├── src/
│   │   ├── lib.rs           # Tauri commands
│   │   └── main.rs          # Entry point
│   └── tauri.conf.json      # Tauri configuration
└── .env.local               # Environment variables
```

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Quick reference guide
- **[ROLE_QUICK_REFERENCE.md](./ROLE_QUICK_REFERENCE.md)** - Role-based access quick reference
- **[ROLE_BASED_ACCESS.md](./ROLE_BASED_ACCESS.md)** - Comprehensive RBAC documentation
- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - Full backend integration
- **[CLIENT_TYPES.md](./CLIENT_TYPES.md)** - Client type system (desktop/mobile/web)
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was implemented

## Key Features

### Authentication
- Login with email/username and password
- Stores access token, refresh token, and user data
- Protected dashboard route

### API Integration
```typescript
import { apiRequest } from '@/lib/api';

// Automatically includes Bearer token and X-Client-Type: desktop
const data = await apiRequest('/graphql', {
  method: 'POST',
  body: { query: '{ currentUser { id } }' }
});
```

### Client Type System

This app uses **desktop** client type:
- Sends `X-Client-Type: desktop` header
- Uses `Authorization: Bearer <token>` for authentication
- Separate from web app (uses cookies) and mobile app

See [CLIENT_TYPES.md](./CLIENT_TYPES.md) for details.

### Role-Based Access Control

**Account Type Restrictions:**
- ✅ Business Administrator - Full access
- ✅ Business Staff - Limited access
- ✅ Institution Administrator - Full access
- ✅ Institution Staff - Limited access
- ❌ Personal Accounts - Blocked
- ❌ Super User Accounts - Not supported

**Dashboard Views:**
- **Administrators**: Full organization management with staff registration, role management, and analytics
- **Staff**: Personal task management with limited organizational access based on assigned permissions

See [ROLE_BASED_ACCESS.md](./ROLE_BASED_ACCESS.md) for full documentation.

## Build for Production

```bash
npx tauri build
```

Output: `src-tauri/target/release/bundle/`

## Tech Stack

- **Tauri 2.x** - Native desktop framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Rust** - Backend integration via Tauri

## Backend Integration

**Backend URL**: `http://127.0.0.1:8000`
**Framework**: Actix Web (Rust)
**Auth Method**: Bearer token with `X-Client-Type: desktop`

All API calls automatically include:
- `Authorization: Bearer <token>`
- `X-Client-Type: desktop`
- `Content-Type: application/json`

## Related Projects

- **Backend**: `/Users/allanlugwiri/RustroverProjects/backend`
- **Web UI**: `/Users/allanlugwiri/RustroverProjects/kastaem-ui` (browser app)
- **Desktop UI**: This project (native app)

## Troubleshooting

### "Connection failed"
Ensure backend is running on port 8000:
```bash
cd backend && cargo run
```

### "Authorization header required"
Token expired. Clear localStorage and login again.

### Module errors
Run `npm install` to install dependencies.

## Learn More

- [Tauri Documentation](https://tauri.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Backend Integration Guide](./BACKEND_INTEGRATION.md)
