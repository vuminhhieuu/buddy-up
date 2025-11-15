import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  updateStep1,
  setProfileSetupCompleted,
  setSubmitting,
  setError,
} from '../store/slices/profileSetupSlice';
import { updateProfileDisplayName, uploadAvatar } from '../services/profile';
import * as Yup from 'yup';

interface UseProfileSetupStep1Props {
  onSuccess: () => void;
}

export const useProfileSetupStep1 = ({ onSuccess }: UseProfileSetupStep1Props) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.userId);
  const step1Data = useAppSelector((state) => state.profileSetup.step1Data);
  const isSubmitting = useAppSelector((state) => state.profileSetup.isSubmitting);

  const validationSchema = Yup.object().shape({
    displayName: Yup.string()
      .required(t('profileSetup.validation.displayNameRequired'))
      .min(2, t('profileSetup.validation.displayNameMin'))
      .max(50, 'Max 50 characters'),
    primaryGoal: Yup.string()
      .required(t('profileSetup.validation.primaryGoalRequired'))
      .min(2, 'Min 2 characters'),
  });

  const handleSubmit = async (values: {
    displayName: string;
    avatarUri: string | null;
    primaryGoal: string;
  }) => {
    if (!userId) {
      Alert.alert(t('profileSetup.errors.userNotFound'));
      return;
    }

    try {
      dispatch(setSubmitting(true));
      dispatch(setError(null));

      let avatarUrl = values.avatarUri;

      // Upload avatar nếu có
      if (values.avatarUri && !values.avatarUri.startsWith('http')) {
        avatarUrl = await uploadAvatar(userId, values.avatarUri);
      }

      // Update profile display name
      await updateProfileDisplayName(userId, values.displayName, avatarUrl || undefined);

      // Update Redux
      dispatch(updateStep1(values));

      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('profileSetup.errors.updateFailed');
      dispatch(setError(errorMessage));
      Alert.alert(t('profileSetup.errors.updateFailed'), errorMessage);
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  const handleSkip = async () => {
    try {
      dispatch(setSubmitting(true));
      // Just mark setup as completed without updating profile
      dispatch(setProfileSetupCompleted(true));
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('profileSetup.errors.updateFailed');
      Alert.alert(t('profileSetup.errors.updateFailed'), errorMessage);
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  return {
    validationSchema,
    handleSubmit,
    handleSkip,
    step1Data,
    isSubmitting,
  };
};
