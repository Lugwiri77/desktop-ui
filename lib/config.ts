// Backend API configuration
export const API_CONFIG = {
  // Kastaem Rust backend URL
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register_account',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh_token',
  },
  GRAPHQL: '/graphql',
  MEDIA: {
    PROFILE_PIC: '/media-files/profile_pics',
    UPLOAD: '/media-files',
  },
  // Add other API endpoints as needed
};

export default API_CONFIG;
