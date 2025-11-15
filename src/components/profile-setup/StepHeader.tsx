import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/Text/Text';

export interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onSkip: () => void;
  isLoading?: boolean;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  currentStep,
  totalSteps,
  title,
  onSkip,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View>
      {/* Row 1: Skip button (right aligned) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        }}
      >
        <Pressable onPress={onSkip} disabled={isLoading}>
          <Text variant="body" color="tertiary" style={{ fontWeight: '400' as const }}>
            {t('profileSetup.step1.skip')}
          </Text>
        </Pressable>
      </View>

      {/* Row 2: Progress bar (full width with border radius) */}
      <View
        style={{
          height: 4,
          backgroundColor: theme.colors.border,
          overflow: 'hidden',
          borderRadius: theme.radius.base,
          marginHorizontal: theme.spacing[4],
        }}
      >
        <View
          style={{
            height: 4,
            width: `${progressPercentage}%`,
            backgroundColor: theme.colors.primary[500],
            borderRadius: theme.radius.base,
          }}
        />
      </View>

      {/* Row 3: Step text (left) + Title (right) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        }}
      >
        <Text
          variant="body"
          style={{ fontWeight: '600' as const, color: theme.colors.primary[500] }}
        >
          Buớc {currentStep}/{totalSteps}
        </Text>
        <Text
          variant="body"
          style={{ fontWeight: '600' as const, color: theme.colors.primary[500] }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
};
