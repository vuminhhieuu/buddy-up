import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { signInWithGoogle, signInWithFacebook } from '../services/auth';
import {
  setUser,
  setIsRegistering,
  setProfileSetupInProgress,
  setCurrentProfileStep,
  setProfileData,
} from '../store/slices/authSlice';
import { translateAuthError } from '../utils/authErrors';
import { logger } from '../utils/logger';
import type { AuthError } from '@supabase/supabase-js';

interface UseSocialAuthOptions {
  mode: 'login' | 'register';
  onNavigateToProfileSetup?: (displayName: string) => void;
}

export const useSocialAuth = ({ mode, onNavigateToProfileSetup }: UseSocialAuthOptions) => {
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    const componentName = mode === 'register' ? 'RegisterForm' : 'LoginForm';

    try {
      logger.debug(componentName, `Starting social login with ${provider}`);

      // Set flag to prevent useAuthSession from auto-navigating during social login (only for register)
      if (mode === 'register') {
        dispatch(setIsRegistering(true));
      }

      const result = provider === 'google' ? await signInWithGoogle() : await signInWithFacebook();

      logger.debug(componentName, `Social login result received:`, {
        hasSession: !!result.session,
        hasUser: !!result.session?.user,
        isNewProfile: (result as any).isNewProfile,
      });

      if (result.session?.user) {
        const user = result.session.user;
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User';

        dispatch(
          setUser({
            userId: user.id,
            email: user.email ?? null,
            displayName,
          }),
        );

        // Check if this is a new profile (created by signInWithOAuth)
        const isNewProfile = (result as any).isNewProfile;

        if (isNewProfile && mode === 'register') {
          // New user - trigger profile setup flow (only in register mode)
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

          dispatch(setProfileSetupInProgress(true));
          dispatch(setCurrentProfileStep(1));
          dispatch(
            setProfileData({
              displayName,
              avatarUrl,
            }),
          );

          logger.info(
            componentName,
            `New user from ${provider}, triggering profile setup with avatar: ${!!avatarUrl}`,
          );

          // Clear flag and navigate to profile setup
          setTimeout(() => {
            dispatch(setIsRegistering(false));
            onNavigateToProfileSetup?.(displayName);
          }, 100);
        } else {
          // Existing user - already has profile
          logger.info(componentName, `Existing user from ${provider}, login successful`);
          if (mode === 'register') {
            dispatch(setIsRegistering(false));
          }
        }
      } else {
        // If we reach here, OAuth flow succeeded but no session was returned.
        // Treat as error so the issue is visible instead of silently masking it.
        logger.error(
          componentName,
          'OAuth login succeeded but no session returned - this is a bug',
        );
        throw new Error('Authentication failed - no session returned');
      }
    } catch (err: unknown) {
      logger.error(componentName, `Social login failed with ${provider}:`, err);

      // Clear flag on error (only for register)
      if (mode === 'register') {
        dispatch(setIsRegistering(false));
      }

      const errorMessage = translateAuthError(
        err as AuthError,
        t,
        mode === 'register' ? 'register' : undefined,
      );

      // Check if user cancelled
      const error = err as any;
      if (error?.code === 'user_cancelled') {
        // Don't show alert for user cancellation
        logger.debug(componentName, 'User cancelled social login');
      } else {
        const titleKey = mode === 'register' ? 'registerFailedTitle' : 'loginFailedTitle';
        Alert.alert(t(titleKey), errorMessage, [{ text: t('ok') }], {
          cancelable: true,
        });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return {
    handleSocialLogin,
    socialLoading,
  };
};
