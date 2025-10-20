import { invoke } from '@tauri-apps/api/core';
import API_CONFIG from './config';

const API_BASE_URL = API_CONFIG.BASE_URL || 'http://127.0.0.1:8000';

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  user_role: string;
  subdomain?: string;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh completion
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers when token refresh completes
 */
function onRefreshComplete(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    console.error('❌ No refresh token available');
    return null;
  }

  console.log('🔄 Attempting to refresh access token...');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'desktop',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Token refresh failed with status:', response.status);
      throw new Error('Token refresh failed');
    }

    const data: RefreshTokenResponse = await response.json();

    // Store the new tokens
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    console.log('✅ Token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);

    // Clear tokens and redirect to login
    localStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return null;
  }
}

/**
 * Make an authenticated API request to the backend with automatic token refresh
 * This automatically includes the Authorization Bearer token and X-Client-Type header
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    token?: string;
    skipAuth?: boolean;
    skipRefresh?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token, skipAuth = false, skipRefresh = false } = options;

  // Get token from localStorage if not provided
  let authToken = token || localStorage.getItem('auth_token');

  if (!authToken && !skipAuth) {
    throw new Error('No authentication token found');
  }

  // Construct full URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Serialize body to JSON string if provided
  const bodyString = body ? JSON.stringify(body) : undefined;

  try {
    const response = await invoke<string>('authenticated_request', {
      url,
      method,
      token: authToken || '',
      body: bodyString,
    });

    // Parse JSON response
    return JSON.parse(response) as T;
  } catch (error: any) {
    console.error('API request failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error string:', String(error));

    // Check if error is 401 Unauthorized and token refresh is not skipped
    // Tauri invoke errors can be strings or objects with message property
    const errorString = (typeof error === 'string' ? error : error?.message || String(error)).toLowerCase();
    const isUnauthorized = errorString.includes('401') ||
                          errorString.includes('unauthorized') ||
                          errorString.includes('unauthenticated') ||
                          errorString.includes('revoked');

    if (isUnauthorized && !skipAuth && !skipRefresh) {
      console.log('🔄 Detected unauthorized error, attempting token refresh...');
      // Try to refresh token
      if (!isRefreshing) {
        isRefreshing = true;
        console.log('🔄 Starting token refresh...');

        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshComplete(newToken);
          console.log('✅ Token refreshed, retrying original request...');

          // Retry the original request with new token
          try {
            const retryResponse = await invoke<string>('authenticated_request', {
              url,
              method,
              token: newToken,
              body: bodyString,
            });

            console.log('✅ Request succeeded after token refresh');
            return JSON.parse(retryResponse) as T;
          } catch (retryError) {
            console.error('Retry after token refresh failed:', retryError);
            throw retryError;
          }
        } else {
          throw new Error('Authentication failed - unable to refresh token');
        }
      } else {
        // Wait for the ongoing refresh to complete
        const newToken = await new Promise<string>((resolve) => {
          subscribeTokenRefresh(resolve);
        });

        // Retry with new token
        try {
          const retryResponse = await invoke<string>('authenticated_request', {
            url,
            method,
            token: newToken,
            body: bodyString,
          });

          return JSON.parse(retryResponse) as T;
        } catch (retryError) {
          console.error('Retry after waiting for refresh failed:', retryError);
          throw retryError;
        }
      }
    }

    throw error;
  }
}

/**
 * Logout and clear all stored tokens
 */
export async function logout(): Promise<void> {
  const token = localStorage.getItem('auth_token');

  if (token) {
    try {
      await invoke('logout_user', { token });
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local cleanup even if server request fails
    }
  }

  // Clear all stored data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('username');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/**
 * GET request helper
 */
export async function get<T = any>(endpoint: string, options?: Omit<Parameters<typeof apiRequest>[1], 'method'>): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function post<T = any>(endpoint: string, body?: any, options?: Omit<Parameters<typeof apiRequest>[1], 'method' | 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request helper
 */
export async function put<T = any>(endpoint: string, body?: any, options?: Omit<Parameters<typeof apiRequest>[1], 'method' | 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * PATCH request helper
 */
export async function patch<T = any>(endpoint: string, body?: any, options?: Omit<Parameters<typeof apiRequest>[1], 'method' | 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * DELETE request helper
 */
export async function del<T = any>(endpoint: string, options?: Omit<Parameters<typeof apiRequest>[1], 'method'>): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
