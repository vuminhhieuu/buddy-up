import { AuthError } from '@supabase/supabase-js';

export function translateAuthError(
  error: AuthError | Error | null | undefined,
  t: (key: string) => string,
): string {
  if (!error) {
    return t('auth.loginFailed');
  }

  const errorMessage = error.message || '';
  const errorCode = 'code' in error ? (error as AuthError).code : null;

  switch (errorCode) {
    case 'invalid_credentials':
      return t('auth.invalidCredentials');
    case 'email_not_confirmed':
      return t('auth.emailNotConfirmed');
    case 'user_not_found':
      return t('auth.userNotFound');
    case 'wrong_password':
      return t('auth.wrongPassword');
    case 'too_many_requests':
      return t('auth.tooManyRequests');
    case 'network_error':
    case 'network_request_failed':
      return t('auth.networkError');
    default: {
      const lowerMessage = errorMessage.toLowerCase();
      if (
        lowerMessage.includes('invalid login credentials') ||
        lowerMessage.includes('invalid credentials')
      ) {
        return t('auth.invalidCredentials');
      }
      if (
        lowerMessage.includes('email not confirmed') ||
        lowerMessage.includes('email_not_confirmed')
      ) {
        return t('auth.emailNotConfirmed');
      }
      if (lowerMessage.includes('user not found')) {
        return t('auth.userNotFound');
      }
      if (lowerMessage.includes('wrong password') || lowerMessage.includes('incorrect password')) {
        return t('auth.wrongPassword');
      }
      if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
        return t('auth.networkError');
      }
      return t('auth.loginFailed');
    }
  }
}
