# Kastaem Desktop UI - Setup Guide

This is your Tauri desktop application with Next.js 15 and React 19, configured to work with your Rust backend.

## Project Structure

```
desktop-ui/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   │   ├── SplashScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   └── page.tsx          # Main page (shows splash screen)
├── lib/                   # Utilities and configuration
│   └── config.ts         # API configuration
├── src-tauri/            # Tauri Rust code
│   ├── src/
│   │   ├── lib.rs       # Tauri commands (authenticate_user)
│   │   └── main.rs      # App entry point
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
└── .env.local           # Environment variables
```

## Features Implemented

✅ **Splash Screen** - Shows on app launch with loading animation
✅ **Login Screen** - Authenticates users via Rust backend
✅ **Dashboard** - Protected route for authenticated users
✅ **Tauri Commands** - Backend communication through `authenticate_user` command
✅ **Separation from Browser UI** - Desktop-only (kastaem-ui remains browser-only)

## Configuration

### 1. Backend URL Configuration

Update the backend URL in two places:

**File: `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**File: `src-tauri/src/lib.rs` (line 20)**
```rust
let backend_url = "http://localhost:8080/api/auth/login"; // Update this
```

### 2. Backend API Requirements

Your Rust backend should have an authentication endpoint that:

- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Success Response (200)**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

- **Error Response (401/400)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Running the Application

### Development Mode

```bash
npx tauri dev
```

This will:
1. Start Next.js dev server on `http://localhost:3000`
2. Launch the Tauri desktop window
3. Enable hot reload for both frontend and Rust code

### Build for Production

```bash
npx tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`

## Application Flow

1. **App Launches** → Shows splash screen (2 seconds)
2. **Splash Completes** → Redirects to login page
3. **User Logs In** → Calls `authenticate_user` Tauri command
4. **Command Executes** → Makes HTTP request to Rust backend
5. **Success** → Stores token in localStorage, redirects to dashboard
6. **Dashboard** → Protected page, checks for auth token

## Adding More Tauri Commands

To add new commands that communicate with your backend:

**1. Add the command in `src-tauri/src/lib.rs`:**

```rust
#[tauri::command]
async fn get_user_data(token: String) -> Result<UserData, String> {
    let backend_url = "http://localhost:8080/api/user";
    let client = reqwest::Client::new();

    match client
        .get(backend_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
    {
        Ok(response) => {
            // Handle response
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}
```

**2. Register the command in the builder:**

```rust
.invoke_handler(tauri::generate_handler![
    authenticate_user,
    get_user_data  // Add new command here
])
```

**3. Call from frontend:**

```typescript
import { invoke } from '@tauri-apps/api/core';

const userData = await invoke('get_user_data', {
  token: localStorage.getItem('auth_token')
});
```

## Security Notes

- Tokens are stored in localStorage (consider more secure storage for production)
- Update CSP in `tauri.conf.json` for production
- Enable CORS on your Rust backend for the desktop app
- Consider implementing refresh tokens for better security

## Troubleshooting

### Issue: "Failed to connect to backend"
- Ensure your Rust backend is running
- Check the backend URL in `.env.local` and `lib.rs`
- Verify CORS is enabled on the backend

### Issue: "Module not found: @tauri-apps/api"
- Run: `npm install @tauri-apps/api`

### Issue: Compilation errors in Rust
- Run: `cd src-tauri && cargo check`
- Ensure all dependencies in `Cargo.toml` are installed

## Next Steps

1. Update backend URL to match your Rust backend
2. Implement the authentication endpoint in your backend
3. Customize the dashboard with your app features
4. Add more Tauri commands as needed
5. Update branding and styling to match your design

## Differences from Browser UI (kastaem-ui)

- **desktop-ui**: Tauri desktop app (this project)
- **kastaem-ui**: Browser-based Next.js app (separate project)
- No interference between the two projects
- Desktop app doesn't use browser features
- Can share components if needed by creating a shared package
