import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

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
