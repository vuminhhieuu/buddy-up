import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ProcessHeader } from '../ProcessHeader/ProcessHeader';
import { BackButton } from '../../navigation/BackButton';
import { SkipButton } from '../SkipButton/SkipButton';
import { useTheme } from '../../../styles';
import { useTranslation } from 'react-i18next';

export type ProfileSetupHeaderProps = {
  step: number;
  progress: number;
  rightText?: string;
  onBack?: () => void;
  showSkipButton?: boolean;
  containerStyle?: ViewStyle;
};

export const ProfileSetupHeader: React.FC<ProfileSetupHeaderProps> = ({
  step,
  progress,
  rightText,
  onBack,
  showSkipButton = true,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ProcessHeader
      leftText={t('profileSetup.step', { current: step })}
      rightText={rightText || ''}
      leftColor={theme.colors.primary[500]}
      rightColor={theme.colors.text.tertiary}
      leftFontSize={theme.typography.scale.sm}
      rightFontSize={theme.typography.scale.sm}
      leftFontWeight="700"
      rightFontWeight="normal"
      progress={progress}
      progressBarColor={theme.colors.primary[500]}
      progressBarBgColor={theme.colors.border}
      containerStyle={containerStyle}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing[2],
        }}
      >
        {onBack ? (
          <BackButton
            onPress={onBack}
            accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
          />
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}
        {showSkipButton && <SkipButton />}
      </View>
    </ProcessHeader>
  );
};
