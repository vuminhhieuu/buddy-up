import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ProcessHeader } from '../ProcessHeader/ProcessHeader';
import { BackButton } from '../../navigation/BackButton';
import { SkipButton } from '../SkipButton/SkipButton';
import { useTheme } from '../../../styles';
import { useTranslation } from 'react-i18next';

export type ProfileSetupHeaderProps = {
  // New props (preferred)
  currentStep?: number;
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  // Legacy props (for backward compatibility)
  /**
   * @deprecated Use currentStep instead
   */
  step?: number;
  /**
   * @deprecated Use totalSteps instead
   */
  progress?: number;
  /**
   * @deprecated This prop is no longer used
   */
  rightText?: string;
  // Common props
  onBack?: () => void;
  showSkipButton?: boolean;
  containerStyle?: ViewStyle;
};

export const ProfileSetupHeader: React.FC<ProfileSetupHeaderProps> = ({
  currentStep,
  totalSteps,
  title,
  subtitle,
  step,
  progress,
  rightText,
  onBack,
  showSkipButton = true,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Use new props if provided, otherwise fall back to legacy props
  const displayStep = currentStep ?? step ?? 1;
  const displayTotal = totalSteps ?? 4;
  const displayProgress = progress ?? displayStep / displayTotal;
  const displayTitle = title ?? rightText ?? '';

  return (
    <ProcessHeader
      leftText={t('profileSetup.stepProgress', { current: displayStep, total: displayTotal })}
      rightText={displayTitle}
      leftColor={theme.colors.primary[500]}
      rightColor={theme.colors.text.tertiary}
      leftFontSize={theme.typography.scale.sm}
      rightFontSize={theme.typography.scale.sm}
      leftFontWeight="700"
      rightFontWeight="normal"
      progress={displayProgress}
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
