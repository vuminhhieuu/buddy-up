import React, { useState } from 'react';
import { ScreenContainer, Text, Spacer, Button } from '../components/ui';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signOutState } from '../store/slices/authSlice';
import { resetProfileSetup } from '../store/slices/profileSetupSlice';
import { signOut } from '../services/auth';
import { Alert } from 'react-native';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { email } = useAppSelector((state) => state.auth);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      dispatch(signOutState());
      dispatch(resetProfileSetup());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.signOutFailed');
      Alert.alert(t('auth.signOutFailedTitle'), errorMessage, [{ text: t('auth.ok') }]);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScreenContainer>
      <Text variant="h3">{t('profile')}</Text>
      <Spacer size={4} />
      <Text variant="body">This is a temporary screen to test profile navigation.</Text>
      {email && (
        <>
          <Spacer size={4} />
          <Text variant="body" color="secondary">
            {t('auth.email')}: {email}
          </Text>
        </>
      )}
      <Spacer size={6} />
      <Button
        label={t('auth.signOut')}
        onPress={handleSignOut}
        loading={signingOut}
        variant="danger"
      />
    </ScreenContainer>
  );
};
