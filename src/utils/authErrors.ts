import { AuthError } from '@supabase/supabase-js';
import { AUTH_ERROR_CODES, ERROR_MESSAGE_PATTERNS } from '../constants/errors';

export function translateAuthError(
  error: AuthError | Error | null | undefined,
  t: (key: string) => string,
  context: 'login' | 'register' = 'login',
): string {
  if (!error) {
    return context === 'register' ? t('registerFailed') : t('loginFailed');
  }

  const errorMessage = error.message || '';
  const errorCode = 'code' in error ? (error as AuthError).code : null;

  switch (errorCode) {
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return t('invalidCredentials');
    case AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED:
      return t('emailNotConfirmed');
    case AUTH_ERROR_CODES.USER_NOT_FOUND:
      return t('userNotFound');
    case AUTH_ERROR_CODES.WRONG_PASSWORD:
      return t('wrongPassword');
    case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
      return t('tooManyRequests');
    case AUTH_ERROR_CODES.NETWORK_ERROR:
    case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
      return t('networkError');
    default: {
      const lowerMessage = errorMessage.toLowerCase();

      // Check for email already exists patterns
      if (
        ERROR_MESSAGE_PATTERNS.EMAIL_ALREADY_EXISTS.some((pattern) =>
          lowerMessage.includes(pattern),
        ) ||
        errorCode === AUTH_ERROR_CODES.SIGNUP_DISABLED
      ) {
        return t('emailAlreadyExists');
      }

      // Check for invalid credentials patterns
      if (
        ERROR_MESSAGE_PATTERNS.INVALID_CREDENTIALS.some((pattern) => lowerMessage.includes(pattern))
      ) {
        return t('invalidCredentials');
      }

      // Check for email not confirmed patterns
      if (
        ERROR_MESSAGE_PATTERNS.EMAIL_NOT_CONFIRMED.some((pattern) => lowerMessage.includes(pattern))
      ) {
        return t('emailNotConfirmed');
      }

      // Check for user not found patterns
      if (ERROR_MESSAGE_PATTERNS.USER_NOT_FOUND.some((pattern) => lowerMessage.includes(pattern))) {
        return t('userNotFound');
      }

      // Check for wrong password patterns
      if (ERROR_MESSAGE_PATTERNS.WRONG_PASSWORD.some((pattern) => lowerMessage.includes(pattern))) {
        return t('wrongPassword');
      }

      // Check for network error patterns
      if (ERROR_MESSAGE_PATTERNS.NETWORK_ERROR.some((pattern) => lowerMessage.includes(pattern))) {
        return t('networkError');
      }

      return context === 'register' ? t('registerFailed') : t('loginFailed');
    }
  }
}
