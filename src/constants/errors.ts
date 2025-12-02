/**
 * Error codes and error message constants
 * Centralized error codes for consistent error handling
 */

// ============================================================================
// Supabase Auth Error Codes
// ============================================================================

/**
 * Supabase authentication error codes
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  USER_NOT_FOUND: 'user_not_found',
  WRONG_PASSWORD: 'wrong_password',
  TOO_MANY_REQUESTS: 'too_many_requests',
  NETWORK_ERROR: 'network_error',
  NETWORK_REQUEST_FAILED: 'network_request_failed',
  SIGNUP_DISABLED: 'signup_disabled',
  OTP_EXPIRED: 'otp_expired',
  OTP_INVALID: 'otp_invalid',
  OTP_RATE_LIMIT: 'otp_rate_limit',
  EMAIL_NOT_REGISTERED: 'email_not_registered',
} as const;

// ============================================================================
// Supabase Postgres Error Codes
// ============================================================================

/**
 * PostgreSQL error codes returned by Supabase
 */
export const POSTGRES_ERROR_CODES = {
  UNIQUE_CONSTRAINT_VIOLATION: '23505', // e.g., duplicate entry
  RLS_POLICY_VIOLATION: '42501', // Row-Level Security policy violation
  POLICY_RECURSION: '42P17', // Infinite recursion in policy (rare)
} as const;

/**
 * PostgREST error codes
 */
export const POSTGREST_ERROR_CODES = {
  NO_ROWS_RETURNED: 'PGRST116', // No rows returned (not really an error)
} as const;

// ============================================================================
// Custom Error Codes
// ============================================================================

/**
 * Custom application error codes
 */
export const APP_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  BADGE_NOT_FOUND: 'BADGE_NOT_FOUND',
  RLS_VIOLATION: 'RLS_VIOLATION',
} as const;

// ============================================================================
// Error Message Patterns
// ============================================================================

/**
 * Error message patterns for matching error messages
 */
export const ERROR_MESSAGE_PATTERNS = {
  // Email already exists patterns
  EMAIL_ALREADY_EXISTS: [
    'user already registered',
    'email already registered',
    'email already exists',
    'user already exists',
    'already registered',
  ],

  // Email not registered patterns
  EMAIL_NOT_REGISTERED: [
    'email not registered',
    'user not registered',
    'no user found',
    'signups not allowed',
    'signup is disabled',
  ],

  // Invalid credentials patterns
  INVALID_CREDENTIALS: ['invalid login credentials', 'invalid credentials'],

  // Email not confirmed patterns
  EMAIL_NOT_CONFIRMED: ['email not confirmed', 'email_not_confirmed'],

  // User not found patterns
  USER_NOT_FOUND: ['user not found'],

  // Wrong password patterns
  WRONG_PASSWORD: ['wrong password', 'incorrect password'],

  // Network error patterns
  NETWORK_ERROR: ['network', 'connection'],

  // OTP error patterns
  OTP_EXPIRED: ['token expired', 'otp expired', 'otp has expired'],
  OTP_INVALID: ['token mismatch', 'invalid token', 'otp invalid', 'invalid otp', 'token invalid'],
  OTP_RATE_LIMIT: ['rate limit', 'too many', 'rate_limit'],

  // Unknown error fallback
  UNKNOWN_ERROR: ['unknown error occurred'],
} as const;

// ============================================================================
// Common Error Messages
// ============================================================================

/**
 * Default error message when error type is unknown
 */
export const UNKNOWN_ERROR_MESSAGE = 'Unknown error occurred';

// ============================================================================
// Error Code Types
// ============================================================================

/**
 * Type for Supabase auth error codes
 */
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/**
 * Type for PostgreSQL error codes
 */
export type PostgresErrorCode = (typeof POSTGRES_ERROR_CODES)[keyof typeof POSTGRES_ERROR_CODES];

/**
 * Type for PostgREST error codes
 */
export type PostgrestErrorCode = (typeof POSTGREST_ERROR_CODES)[keyof typeof POSTGREST_ERROR_CODES];

/**
 * Type for application error codes
 */
export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];
