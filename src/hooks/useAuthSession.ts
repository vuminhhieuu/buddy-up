import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLoading, setUser } from '../store/slices/authSlice';

export const useAuthSession = () => {
  const dispatch = useAppDispatch();
  const isRegistering = useAppSelector((state) => state.auth.isRegistering);
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
          dispatch(
            setUser({
              userId: session.user.id,
              email: session.user.email ?? null,
            }),
          );
        } else {
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Failed to sync auth session:', error);
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
      if (!mounted) return;
      if (isRegistering) return;

      if (session?.user) {
        dispatch(
          setUser({
            userId: session.user.id,
            email: session.user.email ?? null,
          }),
        );
      } else {
        dispatch(setUser(null));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch, isRegistering]);

  return { initialized };
};
