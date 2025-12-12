import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setLoading,
  setUser,
  setProfileSetupInProgress,
  setCurrentProfileStep,
  setProfileData,
} from '../store/slices/authSlice';
import { logger } from '../utils/logger';

export const useAuthSession = () => {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((state) => state.auth.userId);
  const isRegistering = useAppSelector((state) => state.auth.isRegistering);
  const isPasswordResetFlow = useAppSelector((state) => state.auth.isPasswordResetFlow);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      dispatch(setLoading(true));
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const displayName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.user_metadata?.display_name ||
            session.user.email?.split('@')[0] ||
            null;
          dispatch(
            setUser({
              userId: session.user.id,
              email: session.user.email ?? null,
              displayName,
            }),
          );
        } else {
          // Avoid wiping user state if we already have a user and Supabase hasn't hydrated yet
          // (can happen right after OAuth redirect before setSession is ready)
          if (currentUserId) {
            logger.debug('useAuthSession', 'Session not ready yet, keeping existing user state');
          } else {
            dispatch(setUser(null));
          }
        }
      } catch (error) {
        logger.error('useAuthSession', 'Failed to sync auth session:', error);
        dispatch(setUser(null));
      } finally {
        if (mounted) {
          dispatch(setLoading(false));
          setInitialized(true);
        }
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Use non-async callback and handle async operations separately
      if (!mounted) return;
      if (isRegistering || isPasswordResetFlow) return;

      logger.debug('useAuthSession', `Auth state changed: ${_event}, session: ${!!session}`);

      if (session?.user) {
        const userId = session.user.id;
        const displayName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.user_metadata?.display_name ||
          session.user.email?.split('@')[0] ||
          null;
        dispatch(
          setUser({
            userId,
            email: session.user.email ?? null,
            displayName,
          }),
        );

        // Check if user has profile (for social login flow)
        // Only check if user just logged in (not on initial session sync)
        if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
          // Handle async operations in a separate async function with proper error handling
          const checkUserProfile = async () => {
            if (!mounted) return; // Double-check mount status

            try {
              const fetchProfile = async () =>
                supabase
                  .from('profiles')
                  .select('user_id, display_name')
                  .eq('user_id', userId)
                  .maybeSingle();

              let { data: profile, error } = await fetchProfile();

              // Check mount status again after async operation
              if (!mounted) return;

              if (error && error.code !== 'PGRST116') {
                logger.error('useAuthSession', 'Failed to check profile:', error);
              } else if (!profile) {
                // Retry once after a short delay to avoid race with profile creation (OAuth flow)
                await new Promise((resolve) => setTimeout(resolve, 300));
                if (!mounted) return;
                const retry = await fetchProfile();
                profile = retry.data;
                error = retry.error;
              }

              if (error && error.code !== 'PGRST116') {
                logger.error('useAuthSession', 'Failed to check profile (retry):', error);
              }

              if (!profile) {
                // Only trigger profile setup if we are in registering flow.
                // In login flow, avoid flipping to Auth navigator while profile creation finishes.
                if (isRegistering) {
                  const displayName =
                    session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    session.user.email?.split('@')[0] ||
                    'User';

                  logger.info('useAuthSession', 'User has no profile, triggering profile setup');
                  dispatch(setProfileSetupInProgress(true));
                  dispatch(setCurrentProfileStep(1));
                  dispatch(
                    setProfileData({
                      displayName,
                    }),
                  );
                } else {
                  logger.info(
                    'useAuthSession',
                    'Profile not found but not in registering flow; leaving setup flag false',
                  );
                  dispatch(setProfileSetupInProgress(false));
                }
              } else {
                // User has profile - ensure profile setup is not in progress
                logger.debug('useAuthSession', 'User has profile, profile setup not needed');
                dispatch(setProfileSetupInProgress(false));
              }
            } catch (error) {
              logger.error('useAuthSession', 'Error checking profile:', error);
            }
          };

          // Execute async function with proper error handling
          void checkUserProfile();
        }
      } else {
        dispatch(setUser(null));
        dispatch(setProfileSetupInProgress(false));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch, isRegistering, isPasswordResetFlow]);

  return { initialized };
};
