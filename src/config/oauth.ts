/**
 * OAuth Configuration
 * Helper functions and constants for OAuth authentication flow
 */

import { makeRedirectUri } from 'expo-auth-session';
import { SUPABASE_URL } from './env';

// ============================================================================
// OAuth Providers
// ============================================================================

export type OAuthProvider = 'google' | 'facebook';

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google' as const,
  FACEBOOK: 'facebook' as const,
} as const;

// ============================================================================
// Redirect URI Configuration
// ============================================================================

/**
 * Creates redirect URI for OAuth flow
 * Uses the app scheme configured in app.json (buddyup://)
 *
 * @param path - Optional path to append to redirect URI (default: '/auth/callback')
 * @returns Redirect URI string (e.g., 'buddyup://auth/callback')
 */
export const makeOAuthRedirectUri = (path: string = '/auth/callback'): string => {
  return makeRedirectUri({
    scheme: 'buddyup',
    path,
  });
};

/**
 * Gets Supabase OAuth authorization URL for a provider
 *
 * @param provider - OAuth provider ('google' | 'facebook')
 * @returns Authorization URL for the provider
 */
export const getSupabaseOAuthUrl = (provider: OAuthProvider): string => {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured');
  }

  return `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}`;
};

// ============================================================================
// OAuth Configuration Constants
// ============================================================================

/**
 * Default redirect URI for OAuth callback
 * This is what Supabase will redirect to after OAuth flow completes
 */
export const OAUTH_REDIRECT_URI = makeOAuthRedirectUri();

/**
 * OAuth scopes requested from providers
 */
export const OAUTH_SCOPES = ['openid', 'profile', 'email'] as const;
