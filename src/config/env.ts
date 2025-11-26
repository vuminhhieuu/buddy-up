/**
 * Environment configuration
 * Centralized environment variables with validation and defaults
 */

// ============================================================================
// Environment Variables
// ============================================================================

/**
 * Supabase project URL
 * Must be set in .env file as EXPO_PUBLIC_SUPABASE_URL
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

/**
 * Supabase anonymous key
 * Must be set in .env file as EXPO_PUBLIC_SUPABASE_KEY
 */
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validate that required environment variables are set
 * Throws error if any required variable is missing
 */
export const validateEnv = (): void => {
  const missing: string[] = [];

  if (!SUPABASE_URL) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!SUPABASE_ANON_KEY) {
    missing.push('EXPO_PUBLIC_SUPABASE_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file or environment configuration.',
    );
  }
};

/**
 * Check if environment is properly configured
 * Returns true if all required variables are set
 */
export const isEnvConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// ============================================================================
// Environment Info
// ============================================================================

/**
 * Check if running in development mode
 */
export const IS_DEV = __DEV__;

/**
 * Check if running in production mode
 */
export const IS_PRODUCTION = !__DEV__;
