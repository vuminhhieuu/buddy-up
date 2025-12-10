import { AuthError } from '@supabase/supabase-js';
import { AUTH_ERROR_CODES, ERROR_MESSAGE_PATTERNS } from '../constants/errors';

export function translateAuthError(
  error: AuthError | Error | null | undefined,
  t: (key: string) => string,
  context: 'login' | 'register' | 'passwordReset' | 'passwordChange' = 'login',
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
    case AUTH_ERROR_CODES.OTP_EXPIRED:
      return t('otpExpired');
    case AUTH_ERROR_CODES.OTP_INVALID:
      return t('otpInvalid');
    case AUTH_ERROR_CODES.OTP_RATE_LIMIT:
      return t('tooManyRequests');
    case AUTH_ERROR_CODES.EMAIL_NOT_REGISTERED:
      return t('emailNotRegistered');
    case AUTH_ERROR_CODES.OAUTH_ACCOUNT_NOT_LINKED:
      return t('oauthAccountNotLinked');
    case AUTH_ERROR_CODES.OAUTH_PROVIDER_ERROR:
      return t('oauthProviderError');
    case AUTH_ERROR_CODES.USER_CANCELLED:
      return t('socialLoginCancelled');
    default: {
      const lowerMessage = errorMessage.toLowerCase();

      // Check for OTP invalid patterns first (more specific)
      if (ERROR_MESSAGE_PATTERNS.OTP_INVALID.some((pattern) => lowerMessage.includes(pattern))) {
        return t('otpInvalid');
      }

      // Check for OTP expired patterns
      if (ERROR_MESSAGE_PATTERNS.OTP_EXPIRED.some((pattern) => lowerMessage.includes(pattern))) {
        return t('otpExpired');
      }

      // Check for OTP rate limit patterns
      if (ERROR_MESSAGE_PATTERNS.OTP_RATE_LIMIT.some((pattern) => lowerMessage.includes(pattern))) {
        return t('tooManyRequests');
      }

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

      // Check for email not registered patterns
      if (
        ERROR_MESSAGE_PATTERNS.EMAIL_NOT_REGISTERED.some((pattern) =>
          lowerMessage.includes(pattern),
        )
      ) {
        return t('emailNotRegistered');
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

      // Check for OAuth cancelled patterns
      if (
        ERROR_MESSAGE_PATTERNS.OAUTH_CANCELLED.some((pattern) => lowerMessage.includes(pattern))
      ) {
        return t('socialLoginCancelled');
      }

      // Check for OAuth provider error patterns
      if (
        ERROR_MESSAGE_PATTERNS.OAUTH_PROVIDER_ERROR.some((pattern) =>
          lowerMessage.includes(pattern),
        )
      ) {
        return t('oauthProviderError');
      }

      // Context-specific fallback messages
      if (context === 'register') return t('registerFailed');
      if (context === 'passwordReset') return t('passwordResetFailed') || t('loginFailed');
      if (context === 'passwordChange') return t('passwordChangeFailed') || t('loginFailed');
      return t('loginFailed');
    }
  }
}
