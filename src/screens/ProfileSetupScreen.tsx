import React from 'react';
import { ScreenContainer, Text, Spacer } from '../components/ui';
import { useTranslation } from 'react-i18next';

export const ProfileSetupScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <Text variant="h3">{t('profileSetup.title')}</Text>
      <Spacer size={4} />
      <Text variant="body">{t('profileSetup.description')}</Text>
    </ScreenContainer>
  );
};
