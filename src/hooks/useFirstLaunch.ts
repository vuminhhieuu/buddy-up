import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { logger } from '../utils/logger';

const LOGGER_SCOPE = 'useFirstLaunch';

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkFirstLaunch = useCallback(async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.onboardingStatus);
      setIsFirstLaunch(hasSeenOnboarding === null);
    } catch (error) {
      logger.error(LOGGER_SCOPE, 'Failed to check onboarding status', error);
      setIsFirstLaunch(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkFirstLaunch();
  }, [checkFirstLaunch]);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.onboardingStatus, 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      logger.error(LOGGER_SCOPE, 'Failed to persist onboarding completion', error);
    }
  }, []);

  return {
    isFirstLaunch,
    isLoading,
    completeOnboarding,
  };
};
