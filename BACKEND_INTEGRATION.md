# Backend Integration Guide

## Overview

This document explains how the desktop-ui Tauri application integrates with your Kastaem Rust backend.

## Backend Configuration

### Backend Details
- **URL**: `http://127.0.0.1:8000`
- **Port**: `8000`
- **Framework**: Actix Web (Rust)
- **Location**: `/Users/allanlugwiri/RustroverProjects/backend`

### Client Type System

**IMPORTANT**: Your backend differentiates between three client types:

1. **Desktop** (this app): Uses `Authorization: Bearer <token>` header
2. **Mobile**: Uses `Authorization: Bearer <token>` header
3. **Web** (kastaem-ui): Uses HTTP-only cookies

**All desktop app requests MUST include:**
- `X-Client-Type: desktop` header
- `Authorization: Bearer <token>` header (for authenticated requests)

See [CLIENT_TYPES.md](./CLIENT_TYPES.md) for detailed documentation.

### CORS Configuration

Your backend already has CORS configured in `main.rs` (line 345-360):

```rust
let cors = Cors::default()
    .allowed_origin("http://localhost:3000")  // kastaem-ui (browser)
    .allowed_methods(vec!["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"])
    .allowed_headers(vec![
        http::header::AUTHORIZATION,
        http::header::ACCEPT,
        http::header::CONTENT_TYPE,
        http::header::HeaderName::from_static("x-client-type"),
        http::header::HeaderName::from_static("api-key"),
    ])
    .supports_credentials()
    .max_age(3600);
```

**Important**: The desktop app runs on Tauri (not in browser), but if you encounter CORS issues, you may need to add the Tauri origin.

## Authentication Flow

### 1. Desktop App Login

**Endpoint**: `POST /auth/login`

**Headers**:
```
Content-Type: application/json
X-Client-Type: desktop
```

**Request Body**:
```json
{
  "email_or_username": "user@example.com",
  "password": "password123",
  "client_type": "desktop"
}
```

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "message": "Login successful",
    "username": "johndoe",
    "email": "user@example.com",
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "phone_number": "+1234567890",
    "profile_pic_url": "/media-files/profile_pics/...",
    "logo_url": null
  }
}
```

**Error Response (401)**:
```json
{
  "status": "error",
  "message": "Invalid credentials",
  "error": "Account not found"
}
```

### 2. How It Works

1. **User enters credentials** in LoginScreen component
2. **Frontend calls** `invoke('authenticate_user', { email, password })`
3. **Tauri command** (`src-tauri/src/lib.rs`) makes HTTP POST to backend
4. **Backend authenticates** via `/auth/login` endpoint
5. **Backend returns** JWT tokens and user data
6. **Tauri command** simplifies response and returns to frontend
7. **Frontend stores** token in localStorage
8. **User redirected** to dashboard

### 3. Token Storage

Tokens are stored in localStorage:
- `auth_token`: JWT access token (sent as Bearer token)
- `refresh_token`: JWT refresh token
- `user_email`: User's email address
- `username`: User's username
- `profile_pic_url`: Profile picture URL (if available)

**IMPORTANT**: All authenticated requests to the backend must include:
```
Authorization: Bearer <auth_token>
X-Client-Type: desktop
```

This is automatically handled by the `authenticated_request` Tauri command and `apiRequest` utility function.

## Available Backend Endpoints

Based on your backend (`handlers/auth.rs`), here are the available endpoints:

### Authentication
- `POST /auth/register_account` - Register new account
- `POST /auth/register_organization_administrator` - Register org admin
- `POST /auth/register_organization_staff` - Register org staff
- `POST /auth/login` - Login (used by desktop app)
- `POST /auth/logout` - Logout
- `POST /auth/refresh_token` - Refresh JWT token
- `GET /auth/decode_token` - Decode JWT token
- `GET /auth/latest_terms_and_privacy_version` - Get T&C version
- `GET /auth/ws/{user_id}` - WebSocket connection for online status

### GraphQL
- `POST /graphql` - GraphQL endpoint
- `GET /graphql` - GraphQL endpoint (queries)
- `GET /graphql/playground` - GraphiQL playground

### Media
- `POST /media-files/upload_profile_picture` - Upload profile pic
- `POST /media-files/upload_logo` - Upload logo
- `GET /media-files/profile_pics/{user_id}/{filename}` - Serve profile pic
- `POST /media-files/upload_spreang_media` - Upload media
- `POST /media-files/upload_multiple_spreang_media` - Upload multiple media files

### Super User
- `POST /super/create_super_user_handler` - Create super user
- `POST /super/create_terms_and_privacy_policy` - Create T&C

## Desktop vs Browser Separation

### Desktop App (desktop-ui)
- **Technology**: Tauri + Next.js 15 + React 19
- **Runs**: As native desktop application
- **Port**: Uses Tauri's built-in window (no specific port)
- **Dev URL**: `http://localhost:3000` (Next.js dev server for Tauri)
- **Backend Calls**: Direct HTTP via Tauri commands (no CORS issues)
- **Client Type**: Sends `"client_type": "desktop"` to backend

### Browser App (kastaem-ui)
- **Technology**: Next.js 15 + React 19 + Apollo Client
- **Runs**: In web browser
- **Port**: `http://localhost:3000` (configured in backend CORS)
- **Backend Calls**: Uses Apollo Client for GraphQL
- **Client Type**: Sends `"client_type": "web"` (or browser-specific)

**No Interference**: These are completely separate applications. The desktop app doesn't run in the browser, so there's no conflict.

## Adding More Tauri Commands

To call other backend endpoints from the desktop app:

### Example: Logout Command

**1. Add to `src-tauri/src/lib.rs`:**

```rust
#[tauri::command]
async fn logout_user(token: String) -> Result<String, String> {
    let backend_url = "http://127.0.0.1:8000/auth/logout";

    let client = reqwest::Client::new();

    match client
        .post(backend_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                Ok("Logged out successfully".to_string())
            } else {
                Err("Logout failed".to_string())
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}
```

**2. Register the command:**

```rust
.invoke_handler(tauri::generate_handler![
    authenticate_user,
    logout_user  // Add here
])
```

**3. Call from frontend:**

```typescript
import { invoke } from '@tauri-apps/api/core';

const handleLogout = async () => {
  const token = localStorage.getItem('auth_token');
  await invoke('logout_user', { token });
  localStorage.clear();
  router.push('/login');
};
```

### Example: GraphQL Query Command

**1. Add to `src-tauri/src/lib.rs`:**

```rust
#[derive(Debug, Serialize, Deserialize)]
struct GraphQLRequest {
    query: String,
    variables: Option<serde_json::Value>,
}

#[tauri::command]
async fn graphql_query(
    query: String,
    variables: Option<serde_json::Value>,
    token: String
) -> Result<serde_json::Value, String> {
    let backend_url = "http://127.0.0.1:8000/graphql";

    let client = reqwest::Client::new();
    let request = GraphQLRequest { query, variables };

    match client
        .post(backend_url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&request)
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<serde_json::Value>().await {
                Ok(data) => Ok(data),
                Err(e) => Err(format!("Failed to parse response: {}", e)),
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}
```

**2. Call from frontend:**

```typescript
const data = await invoke('graphql_query', {
  query: `
    query GetUser($userId: ID!) {
      user(id: $userId) {
        id
        username
        email
      }
    }
  `,
  variables: { userId: '123' },
  token: localStorage.getItem('auth_token')
});
```

## Running Both Apps

### Start Backend (Required for both)
```bash
cd /Users/allanlugwiri/RustroverProjects/backend
cargo run
# Backend runs on http://127.0.0.1:8000
```

### Start Desktop App
```bash
cd /Users/allanlugwiri/RustroverProjects/desktop-ui
npx tauri dev
# Desktop window opens automatically
```

### Start Browser App (Separate)
```bash
cd /Users/allanlugwiri/RustroverProjects/kastaem-ui
npm run dev
# Browser app runs on http://localhost:3000
```

## Troubleshooting

### Issue: "Connection failed" error
**Solution**: Make sure backend is running on port 8000
```bash
cd backend && cargo run
```

### Issue: "Authentication failed (401)"
**Solution**: Check credentials are correct and user exists in database

### Issue: "Failed to parse response"
**Solution**: Backend response format may have changed. Check console logs and update Rust structs in `lib.rs`

### Issue: CORS errors (unlikely in Tauri)
**Solution**: Tauri apps don't have CORS issues because they make direct HTTP requests, not browser requests

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (consider more secure alternatives for production)
2. **HTTPS**: Use HTTPS in production
3. **Token Refresh**: Implement token refresh logic using `/auth/refresh_token`
4. **Logout**: Clear all stored tokens on logout
5. **Error Handling**: Don't expose sensitive error details to users

## Next Steps

1. ✅ Authentication is working
2. Add token refresh logic
3. Implement other backend endpoints as Tauri commands
4. Add GraphQL integration for complex queries
5. Implement file upload for profile pictures
6. Add WebSocket support for real-time features
7. Build production version with `npx tauri build`
