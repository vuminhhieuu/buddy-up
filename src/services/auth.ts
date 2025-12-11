import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { OAUTH_REDIRECT_URI, getSupabaseOAuthUrl, type OAuthProvider } from '../config/oauth';

// Complete OAuth session when browser closes
WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
      },
    },
  });
  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: data.user.id,
      display_name: params.displayName,
    });

    if (profileError) {
      logger.error('createProfile', 'Failed to create profile:', profileError);
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Request password reset OTP
 * Sends OTP to user's email for password reset
 * Uses signInWithOtp with email type for password recovery flow
 */
export async function requestPasswordReset(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    // Check if error is due to user not found
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('signups not allowed') ||
      errorMessage.includes('signup is disabled') ||
      errorMessage.includes('user not found')
    ) {
      const notRegisteredError = new Error('Email not registered');
      (notRegisteredError as any).code = 'email_not_registered';
      throw notRegisteredError;
    }
    throw error;
  }

  logger.info('requestPasswordReset', `OTP sent to ${email}`);
  return data;
}

/**
 * Verify password reset OTP
 * Verifies the OTP sent to user's email
 * Note: Supabase uses 'email' type for OTP verification
 */
export async function verifyPasswordResetOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) {
    logger.error('verifyPasswordResetOTP', 'OTP verification failed:', error);
    throw error;
  }
  logger.info('verifyPasswordResetOTP', 'OTP verified successfully');
  return data;
}

/**
 * Reset password
 * Assumes OTP has been verified already and a temporary session exists.
 * Only updates the user's password without re-verifying OTP here.
 */
export async function resetPassword(email: string, _token: string, newPassword: string) {
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    logger.error('resetPassword', 'Failed to get current user:', getUserError);
    throw getUserError;
  }

  if (!user) {
    const e = new Error('OTP verification required');
    (e as any).code = 'otp_verification_required';
    throw e;
  }

  if (user.email && user.email.toLowerCase() !== email.toLowerCase()) {
    const e = new Error('Email mismatch for reset');
    (e as any).code = 'email_mismatch';
    throw e;
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    logger.error('resetPassword', 'Failed to update password:', error);
    throw error;
  }

  logger.info('resetPassword', 'Password reset successfully');
  return data;
}

/**
 * Verify current password for authenticated user
 * Returns true if password is correct, throws error otherwise
 */
export async function verifyCurrentPassword(currentPassword: string) {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('Current password is incorrect');
  }

  return true;
}

/**
 * Change password for authenticated user
 * Requires current password verification
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  // Verify current password first
  await verifyCurrentPassword(currentPassword);

  // Update password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with Google OAuth provider
 * Opens browser for user authentication, then exchanges code for session
 */
export async function signInWithGoogle() {
  return signInWithOAuth('google');
}

/**
 * Sign in with Facebook OAuth provider
 * Opens browser for user authentication, then exchanges code for session
 */
export async function signInWithFacebook() {
  return signInWithOAuth('facebook');
}

/**
 * Internal function to handle OAuth flow for any provider
 */
async function signInWithOAuth(provider: OAuthProvider) {
  try {
    const authUrl = getSupabaseOAuthUrl(provider);
    const redirectUri = OAUTH_REDIRECT_URI;

    logger.debug('signInWithOAuth', `Starting OAuth flow for ${provider}`);

    // Create OAuth request
    const request = new AuthSession.AuthRequest({
      clientId: '', // Not needed for Supabase OAuth
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.AuthRequestResponseType.Code,
      redirectUri,
      extraParams: {},
    });

    // Open browser for authentication
    const result = await request.promptAsync({
      authorizationEndpoint: authUrl,
      useProxy: false,
      showInRecents: true,
    });

    // Check if user cancelled
    if (result.type === 'cancel' || result.type === 'dismiss') {
      const cancelledError = new Error('User cancelled OAuth flow');
      (cancelledError as any).code = 'user_cancelled';
      throw cancelledError;
    }

    // Check for errors
    if (result.type === 'error') {
      const error = new Error(result.error?.message || 'OAuth authentication failed');
      (error as any).code = 'oauth_provider_error';
      throw error;
    }

    // Extract code from result
    if (result.type !== 'success' || !result.params?.code) {
      const error = new Error('No authorization code received');
      (error as any).code = 'oauth_provider_error';
      throw error;
    }

    const { code } = result.params;

    logger.debug('signInWithOAuth', `Received OAuth code for ${provider}, exchanging for session`);

    // Exchange code for session with Supabase
    const { data, error } = await supabase.auth.exchangeCodeForSession({
      code,
    });

    if (error) {
      logger.error('signInWithOAuth', `Failed to exchange code for session:`, error);
      throw error;
    }

    if (!data.session || !data.user) {
      const error = new Error('No session or user returned from OAuth');
      (error as any).code = 'oauth_provider_error';
      throw error;
    }

    logger.info('signInWithOAuth', `OAuth login successful for ${provider}, user: ${data.user.id}`);

    // Create profile if needed
    await createProfileIfNeeded(data.user.id, {
      display_name:
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0] ||
        'User',
      avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
    });

    return data;
  } catch (error: any) {
    logger.error('signInWithOAuth', `OAuth flow failed for ${provider}:`, error);
    throw error;
  }
}

/**
 * Create profile if user doesn't have one yet
 * Extracts display_name and avatar_url from user metadata
 */
export async function createProfileIfNeeded(
  userId: string,
  userMetadata?: {
    display_name?: string;
    avatar_url?: string | null;
  },
): Promise<void> {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      logger.error('createProfileIfNeeded', 'Failed to check existing profile:', fetchError);
      return;
    }

    // If profile already exists, don't create a new one
    if (existingProfile) {
      logger.debug('createProfileIfNeeded', `Profile already exists for user ${userId}`);
      return;
    }

    // Create new profile
    const displayName = userMetadata?.display_name || 'User';
    const avatarUrl = userMetadata?.avatar_url || null;

    const { error: insertError } = await supabase.from('profiles').insert({
      user_id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
    });

    if (insertError) {
      logger.error('createProfileIfNeeded', 'Failed to create profile:', insertError);
      // Don't throw error - profile creation failure shouldn't block OAuth login
    } else {
      logger.info('createProfileIfNeeded', `Profile created for user ${userId}`);
    }
  } catch (error) {
    logger.error('createProfileIfNeeded', 'Unexpected error creating profile:', error);
    // Don't throw error - profile creation failure shouldn't block OAuth login
  }
}
