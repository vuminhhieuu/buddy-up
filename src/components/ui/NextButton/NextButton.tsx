import React from 'react';
import { Button } from '../Button/Button';
import { useTheme } from '../../../styles';
import { useTranslation } from 'react-i18next';

interface NextButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  style?: object;
}

export const NextButton: React.FC<NextButtonProps> = ({
  onPress,
  loading,
  disabled,
  label,
  style,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Button
      label={label || t('profileSetup.nextButton')}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant="primary"
      size="md"
      style={{ width: '100%', borderRadius: theme.radius.lg, ...style }}
    />
  );
};
