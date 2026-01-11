/**
 * Global Phone Number Utilities
 *
 * Provides phone number normalization, validation, and formatting for all countries
 * in the system. Country calling codes are derived from the database schema
 * (migrations/20241023060408_seed_geo_data.up.sql).
 *
 * Key Features:
 * - Strips leading zeros from local numbers (as backend does in auth/phone_number.rs:62)
 * - Normalizes phone numbers to international format (+{country_code}{local_number})
 * - Formats for display (with/without country code)
 * - Validates phone number structure
 *
 * @see /backend/src/auth/phone_number.rs - Backend phone validation logic
 * @see /backend/migrations/20241023060408_seed_geo_data.up.sql - Country calling codes
 */

/**
 * Mapping of ISO 3166-1 alpha-2 country codes to international calling codes
 * Derived from countries table in database migrations
 */
export const COUNTRY_CALLING_CODES: Record<string, string> = {
  // Africa
  AO: '+244', // Angola
  BW: '+267', // Botswana
  CD: '+243', // Congo (Kinshasa)
  CG: '+242', // Congo (Brazzaville)
  EG: '+20',  // Egypt
  ET: '+251', // Ethiopia
  GH: '+233', // Ghana
  KE: '+254', // Kenya
  MG: '+261', // Madagascar
  MA: '+212', // Morocco
  NG: '+234', // Nigeria
  RW: '+250', // Rwanda
  ZA: '+27',  // South Africa
  TZ: '+255', // Tanzania
  UG: '+256', // Uganda
  ZM: '+260', // Zambia
  ZW: '+263', // Zimbabwe

  // Europe
  DE: '+49',  // Germany
  GB: '+44',  // United Kingdom
  FR: '+33',  // France

  // Asia
  IN: '+91',  // India
  JP: '+81',  // Japan
  CN: '+86',  // China

  // North America
  US: '+1',   // United States
  CA: '+1',   // Canada
} as const;

/**
 * Phone number length validation rules by country
 * Matches backend validation in auth/phone_number.rs (lines 79-96)
 */
export const PHONE_LENGTH_RULES: Record<string, { min: number; max: number }> = {
  KE: { min: 9, max: 9 },   // Kenya: exactly 9 digits (excluding country code)
  // Default for other countries: 9-15 digits
};

const DEFAULT_LENGTH_RULE = { min: 9, max: 15 };

/**
 * Normalizes a phone number to international format
 *
 * Behavior matches backend logic in auth/phone_number.rs:
 * - Removes spaces, dashes, parentheses, dots
 * - Strips leading '+' if present
 * - **Strips leading '0' from local number** (as user requested)
 * - Removes country calling code if already present
 * - Prepends the correct country calling code
 *
 * @param phoneNumber - Raw phone number input (e.g., "0712345678", "+254712345678", "712-345-678")
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "KE", "US", "GB")
 * @returns Normalized phone number in format: +{country_code}{local_number}
 *
 * @example
 * normalizePhoneNumber("0712345678", "KE") // Returns: "+254712345678"
 * normalizePhoneNumber("712345678", "KE")  // Returns: "+254712345678"
 * normalizePhoneNumber("+254712345678", "KE") // Returns: "+254712345678"
 * normalizePhoneNumber("0155291359", "KE") // Returns: "+254155291359" (leading zero stripped)
 */
export function normalizePhoneNumber(phoneNumber: string, countryCode: string): string {
  const callingCode = COUNTRY_CALLING_CODES[countryCode];

  if (!callingCode) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }

  // Step 1: Remove all formatting characters (spaces, dashes, parentheses, dots)
  // Matches backend: phone_number.replace([' ', '-', '(', ')', '.'], "")
  let cleanNumber = phoneNumber.replace(/[\s\-().]/g, '');

  // Step 2: Strip leading '+' if present
  // Matches backend: .trim_start_matches('+')
  cleanNumber = cleanNumber.replace(/^\+/, '');

  // Step 3: Strip leading '0' from local number
  // Matches backend: .trim_start_matches('0') (line 62 in phone_number.rs)
  // This handles cases like "0712345678" → "712345678"
  cleanNumber = cleanNumber.replace(/^0+/, '');

  // Step 4: Extract the calling code digits (e.g., "+254" → "254")
  const callingCodeDigits = callingCode.slice(1); // Remove '+' from calling code

  // Step 5: If number already starts with calling code, remove it to get local number
  // Matches backend: if clean_number.starts_with(primary_calling_code)
  let localNumber = cleanNumber;
  if (cleanNumber.startsWith(callingCodeDigits)) {
    localNumber = cleanNumber.slice(callingCodeDigits.length);
  }

  // Step 6: Format with country calling code
  // Matches backend: format!("+{}{}", primary_calling_code, local_number)
  return `${callingCode}${localNumber}`;
}

/**
 * Validates phone number length for a specific country
 *
 * @param phoneNumber - Phone number in international format (e.g., "+254712345678")
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "KE")
 * @returns true if length is valid, false otherwise
 */
export function validatePhoneLength(phoneNumber: string, countryCode: string): boolean {
  const callingCode = COUNTRY_CALLING_CODES[countryCode];

  if (!callingCode) {
    return false;
  }

  // Extract local number (remove country code)
  const callingCodeDigits = callingCode.slice(1);
  const cleanNumber = phoneNumber.replace(/^\+/, '');

  let localNumber = cleanNumber;
  if (cleanNumber.startsWith(callingCodeDigits)) {
    localNumber = cleanNumber.slice(callingCodeDigits.length);
  }

  // Get length rules for country (or use default)
  const rules = PHONE_LENGTH_RULES[countryCode] || DEFAULT_LENGTH_RULE;

  const length = localNumber.length;
  return length >= rules.min && length <= rules.max;
}

/**
 * Formats phone number for display (without country code for cleaner UX)
 *
 * @param phoneNumber - Phone number in international format (e.g., "+254712345678")
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "KE")
 * @param includeCountryCode - Whether to include country code in display (default: false)
 * @returns Formatted phone number for display
 *
 * @example
 * formatPhoneForDisplay("+254712345678", "KE") // Returns: "712 345 678"
 * formatPhoneForDisplay("+254712345678", "KE", true) // Returns: "+254 712 345 678"
 */
export function formatPhoneForDisplay(
  phoneNumber: string,
  countryCode: string,
  includeCountryCode: boolean = false
): string {
  const callingCode = COUNTRY_CALLING_CODES[countryCode];

  if (!callingCode) {
    return phoneNumber; // Return as-is if country not supported
  }

  // Extract local number
  const callingCodeDigits = callingCode.slice(1);
  const cleanNumber = phoneNumber.replace(/^\+/, '');

  let localNumber = cleanNumber;
  if (cleanNumber.startsWith(callingCodeDigits)) {
    localNumber = cleanNumber.slice(callingCodeDigits.length);
  }

  // Format local number with spaces for readability
  // For 9-digit numbers like Kenya: "712 345 678"
  // For 10-digit numbers like US: "555 123 4567"
  let formattedLocal = localNumber;

  if (localNumber.length === 9) {
    // Format as: XXX XXX XXX
    formattedLocal = localNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (localNumber.length === 10) {
    // Format as: XXX XXX XXXX
    formattedLocal = localNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (localNumber.length >= 11) {
    // Format as: XXX XXXX XXXX...
    formattedLocal = localNumber.replace(/(\d{3})(\d{4})(\d+)/, '$1 $2 $3');
  }

  if (includeCountryCode) {
    return `${callingCode} ${formattedLocal}`;
  }

  return formattedLocal;
}

/**
 * Strips country code from phone number for display
 *
 * @param phoneNumber - Phone number in international format (e.g., "+254712345678")
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "KE")
 * @returns Local phone number without country code (e.g., "712345678")
 */
export function getLocalPhoneNumber(phoneNumber: string, countryCode: string): string {
  const callingCode = COUNTRY_CALLING_CODES[countryCode];

  if (!callingCode) {
    return phoneNumber;
  }

  const callingCodeDigits = callingCode.slice(1);
  const cleanNumber = phoneNumber.replace(/^\+/, '');

  if (cleanNumber.startsWith(callingCodeDigits)) {
    return cleanNumber.slice(callingCodeDigits.length);
  }

  return cleanNumber;
}

/**
 * Checks if a phone number is in valid international format
 *
 * @param phoneNumber - Phone number to check
 * @returns true if starts with '+' and contains only digits after that
 */
export function isInternationalFormat(phoneNumber: string): boolean {
  return /^\+\d+$/.test(phoneNumber.replace(/[\s\-().]/g, ''));
}

/**
 * Gets the country calling code for a country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "KE")
 * @returns Calling code with '+' prefix (e.g., "+254") or undefined if not found
 */
export function getCallingCode(countryCode: string): string | undefined {
  return COUNTRY_CALLING_CODES[countryCode];
}

/**
 * Detects country code from international phone number
 *
 * @param phoneNumber - Phone number in international format (e.g., "+254712345678")
 * @returns ISO 3166-1 alpha-2 country code (e.g., "KE") or undefined if not detected
 */
export function detectCountryFromPhone(phoneNumber: string): string | undefined {
  const cleanNumber = phoneNumber.replace(/[\s\-().]/g, '').replace(/^\+/, '');

  // Find matching country by checking if phone starts with calling code
  for (const [countryCode, callingCode] of Object.entries(COUNTRY_CALLING_CODES)) {
    const callingCodeDigits = callingCode.slice(1);
    if (cleanNumber.startsWith(callingCodeDigits)) {
      return countryCode;
    }
  }

  return undefined;
}
