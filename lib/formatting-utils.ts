/**
 * Formatting Utilities
 * Centralized formatting functions to prevent code duplication across pages
 */

/**
 * Format currency amount with proper locale and currency symbol
 * @param amount - Amount to format
 * @param currency - Currency code (KES, USD, EUR, GBP)
 * @param locale - Locale for formatting (default: en-KE)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'KES',
  locale: string = 'en-KE'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currency} ${numAmount.toFixed(2)}`;
  }
}

/**
 * Format date with various output styles
 * @param dateString - ISO date string or Date object
 * @param style - Output style (short, long, medium, time, datetime)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  style: 'short' | 'long' | 'medium' | 'time' | 'datetime' = 'medium',
  locale: string = 'en-US'
): string {
  if (!dateString) return 'N/A';

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {};

  switch (style) {
    case 'short':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.weekday = 'long';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'datetime':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'medium':
    default:
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
  }

  return date.toLocaleDateString(locale, options);
}

/**
 * Format date as relative time (e.g., "2 days ago", "in 3 hours")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string | Date): string {
  if (!dateString) return 'N/A';

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return formatDate(date, 'short');
}

/**
 * Calculate days until or overdue from a date
 * @param dueDate - Due date string
 * @returns Number of days (negative if overdue, positive if upcoming)
 */
export function calculateDaysUntil(dueDate: string | Date): number {
  if (!dueDate) return 0;

  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;

  if (isNaN(date.getTime())) {
    return 0;
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format phone number to international format
 * @param phone - Phone number string
 * @param countryCode - Country code (default: 254 for Kenya)
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string, countryCode: string = '254'): string {
  if (!phone) return 'N/A';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    return `+${countryCode}${cleaned.substring(1)}`;
  }

  // If doesn't start with country code, add it
  if (!cleaned.startsWith(countryCode)) {
    return `+${countryCode}${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Format percentage
 * @param value - Decimal value (0.75 = 75%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with K, M, B suffixes
 * @param num - Number to format
 * @returns Formatted string with suffix
 */
export function formatCompactNumber(num: number): string {
  if (isNaN(num)) return '0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(1)}B`;
  }
  if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(1)}M`;
  }
  if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(1)}K`;
  }

  return `${sign}${absNum}`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Generate initials from name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Parse and validate email
 * @param email - Email string
 * @returns Validated and trimmed email or null
 */
export function parseEmail(email: string): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(trimmed) ? trimmed : null;
}

/**
 * Generate color from string (for avatars, etc.)
 * @param str - Input string
 * @returns Hex color code
 */
export function stringToColor(str: string): string {
  if (!str) return '#6B7280'; // Gray default

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return `hsl(${h}, 65%, 50%)`;
}
