import React from 'react';
import { ViewStyle } from 'react-native';
import { Button } from '../Button/Button';
import { useTranslation } from 'react-i18next';

export type ProfileSetupNextButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  label?: string;
};

export const ProfileSetupNextButton: React.FC<ProfileSetupNextButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
  label,
}) => {
  const { t } = useTranslation();

  return (
    <Button
      label={label || t('profileSetup.nextButton')}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant="primary"
      size="md"
      style={style || { width: '100%' }}
    />
  );
};

export default ProfileSetupNextButton;
