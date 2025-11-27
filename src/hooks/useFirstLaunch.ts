import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = '@buddy_up:has_seen_onboarding';

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkFirstLaunch = useCallback(async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      setIsFirstLaunch(hasSeenOnboarding === null);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkFirstLaunch();
  }, [checkFirstLaunch]);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  return {
    isFirstLaunch,
    isLoading,
    completeOnboarding,
  };
};
