# Client Type System - Desktop, Mobile, and Web

## Overview

Your Kastaem backend uses a **client type system** to differentiate between different types of clients and enforce appropriate authentication mechanisms.

## Client Types

### 1. **Desktop** (This App)
- **Client Type**: `"desktop"`
- **Header**: `X-Client-Type: desktop`
- **Authentication**: Bearer token in `Authorization` header
- **Token Storage**: localStorage
- **Platform**: Tauri desktop application

### 2. **Mobile** (Your Mobile App)
- **Client Type**: `"mobile"`
- **Header**: `X-Client-Type: mobile`
- **Authentication**: Bearer token in `Authorization` header
- **Token Storage**: Device secure storage
- **Platform**: React Native / Flutter / Native apps

### 3. **Web** (kastaem-ui)
- **Client Type**: `"web"` (default)
- **Header**: Not required or `X-Client-Type: web`
- **Authentication**: HTTP-only cookies (`access_token`, `refresh_token`)
- **Token Storage**: Cookies (secure, httpOnly)
- **Platform**: Web browser

## Backend Middleware Logic

From `middleware/jwt_auth.rs:674-712`:

```rust
let is_mobile_or_desktop = req.headers().get("X-Client-Type").map_or(false, |h| {
    h.to_str().unwrap_or("").eq_ignore_ascii_case("mobile") ||
        h.to_str().unwrap_or("").eq_ignore_ascii_case("desktop")
}) || body.as_ref().and_then(|b| b.client_type.as_deref()).map_or(false, |t| {
    t == "mobile" || t == "desktop"
});

if is_mobile_or_desktop {
    // For mobile/desktop clients, only use Authorization header
    if let Some(auth_header) = req.headers().get(header::AUTHORIZATION) {
        if auth_str.starts_with("Bearer ") {
            let token = auth_str.trim_start_matches("Bearer ");
            return validate_and_convert_token(token, token_type, state).await;
        }
    }
    return Err(ErrorUnauthorized("Authorization header with Bearer token required"));
} else {
    // For web clients, use cookies only - no fallback
    if let Some(cookie) = req.cookie(cookie_name) {
        return validate_and_convert_token(cookie.value(), token_type, state).await;
    }
    return Err(ErrorUnauthorized("Token not found in cookies"));
}
```

**Key Points:**
- Desktop/Mobile **MUST** use `Authorization: Bearer <token>` header
- Web **MUST** use cookies (`access_token`, `refresh_token`)
- No fallback mechanism - each client type has its own strict authentication method

## How Desktop App Implements This

### 1. Login Request (`src-tauri/src/lib.rs`)

```rust
client
    .post(backend_url)
    .header("X-Client-Type", "desktop")
    .header("Content-Type", "application/json")
    .json(&auth_data)
    .send()
```

**Request Body:**
```json
{
  "email_or_username": "user@example.com",
  "password": "password123",
  "client_type": "desktop"
}
```

### 2. Authenticated Requests (`src-tauri/src/lib.rs`)

```rust
request = request
    .header("Authorization", format!("Bearer {}", token))
    .header("X-Client-Type", "desktop")
    .header("Content-Type", "application/json");
```

All subsequent API calls include:
- `Authorization: Bearer <access_token>`
- `X-Client-Type: desktop`

### 3. Frontend Usage (`lib/api.ts`)

```typescript
// Automatic Bearer token handling
export async function apiRequest<T>(endpoint: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  token?: string;
}) {
  const authToken = token || localStorage.getItem('auth_token');

  return await invoke<string>('authenticated_request', {
    url: `${API_CONFIG.BASE_URL}${endpoint}`,
    method,
    token: authToken,
    body: bodyString,
  });
}
```

## Token Management

### Desktop App Token Storage

```typescript
// After successful login (LoginScreen.tsx)
localStorage.setItem('auth_token', response.token);          // Access token
localStorage.setItem('refresh_token', response.refresh_token); // Refresh token
localStorage.setItem('username', response.username);
localStorage.setItem('user_email', response.email);
localStorage.setItem('profile_pic_url', response.profile_pic_url);
```

### Token Usage

```typescript
// Example: Make authenticated API call
import { apiRequest } from '@/lib/api';

// Automatically includes Bearer token and X-Client-Type header
const data = await apiRequest('/graphql', {
  method: 'POST',
  body: {
    query: '{ user { id username } }'
  }
});
```

### Logout

```typescript
import { logout } from '@/lib/api';

// Calls backend /auth/logout with Bearer token, then clears local storage
await logout();
```

## Comparison Table

| Feature | Desktop (This App) | Mobile | Web (kastaem-ui) |
|---------|-------------------|--------|------------------|
| **Client Type** | `"desktop"` | `"mobile"` | `"web"` (default) |
| **Header** | `X-Client-Type: desktop` | `X-Client-Type: mobile` | Not required |
| **Auth Method** | Bearer token | Bearer token | HTTP-only cookies |
| **Token Header** | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` | N/A (uses cookies) |
| **Token Storage** | localStorage | Secure storage | Cookies (httpOnly) |
| **Login Body Field** | `client_type: "desktop"` | `client_type: "mobile"` | `client_type: "web"` |
| **CORS Required** | No (direct HTTP) | No (direct HTTP) | Yes (browser) |

## Testing Different Client Types

### Test Desktop Client (This App)
```bash
cd /Users/allanlugwiri/RustroverProjects/desktop-ui
npx tauri dev
# Login with credentials - uses Bearer token automatically
```

### Test Web Client (kastaem-ui)
```bash
cd /Users/allanlugwiri/RustroverProjects/kastaem-ui
npm run dev
# Open http://localhost:3000 - uses cookies
```

### Test with cURL (Simulating Desktop/Mobile)

**Login:**
```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-Type: desktop" \
  -d '{
    "email_or_username": "user@example.com",
    "password": "password123",
    "client_type": "desktop"
  }'
```

**Authenticated Request:**
```bash
curl -X GET http://127.0.0.1:8000/graphql \
  -H "Authorization: Bearer <your_token>" \
  -H "X-Client-Type: desktop" \
  -H "Content-Type: application/json"
```

## Backend CORS Configuration

From `main.rs:345-360`:

```rust
let cors = Cors::default()
    .allowed_origin("http://localhost:3000")  // kastaem-ui only
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

**Important:**
- Desktop and mobile apps don't need CORS (they make direct HTTP requests)
- Only web browser clients need CORS
- `X-Client-Type` header is explicitly allowed in CORS

## Why This Design?

### Security Benefits

1. **Desktop/Mobile Apps**:
   - Use Bearer tokens (more appropriate for native apps)
   - No cookie vulnerabilities
   - Explicit token management
   - Can store tokens securely (desktop: localStorage, mobile: secure storage)

2. **Web Apps**:
   - Use HTTP-only cookies (protected from XSS)
   - Cookies are automatically sent with requests
   - More secure for browser environment
   - Protected by same-origin policy

### Separation of Concerns

- Each platform uses authentication best suited for its environment
- Middleware enforces correct auth method per client type
- No mixing of authentication methods
- Clear security boundaries

## Common Issues and Solutions

### Issue: "Authorization header required for mobile/desktop clients"

**Cause**: Desktop app not sending Bearer token or X-Client-Type header

**Solution**: Ensure all requests include:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Client-Type': 'desktop'
}
```

Our `authenticated_request` Tauri command handles this automatically.

### Issue: "Token not found in cookies" (when testing web client)

**Cause**: Web client (kastaem-ui) trying to use Bearer token instead of cookies

**Solution**: Web clients must use cookies. Check that:
- Login response sets cookies
- Subsequent requests include cookies
- Apollo Client configured for credentials

### Issue: Desktop app being treated as web client

**Cause**: Missing `X-Client-Type` header

**Solution**: All desktop requests must include `X-Client-Type: desktop` header. Already implemented in our Tauri commands.

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh using refresh_token
2. **Token Expiry Handling**: Check token expiry and refresh before API calls
3. **Secure Storage**: Consider using Tauri's secure storage for tokens
4. **Biometric Auth**: Add biometric authentication for desktop app
5. **Session Management**: Track active sessions across devices

## Resources

- Backend Middleware: `/backend/src/middleware/jwt_auth.rs`
- Desktop Tauri Commands: `/desktop-ui/src-tauri/src/lib.rs`
- Desktop API Utility: `/desktop-ui/lib/api.ts`
- Backend Login Handler: `/backend/src/auth/login.rs`
