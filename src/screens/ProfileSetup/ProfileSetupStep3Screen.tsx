import React from 'react';
import { ScreenContainer } from '../../components/ui';
import { ProcessHeader } from '../../components/ui/ProcessHeader';
import { useTheme } from '../../styles';
import { Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export type ProfileSetupStep3ScreenProps = {
  onFinish?: () => void;
  onBack?: () => void;
};

export const ProfileSetupStep3Screen: React.FC<ProfileSetupStep3ScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const { theme } = useTheme();
  return (
    <ScreenContainer>
      <ProcessHeader
        leftText={t('profileSetup.step', { current: 3 })}
        rightText={t('profileSetup.progress75')}
        leftColor={theme.colors.primary[500]}
        rightColor={theme.colors.text.tertiary}
        leftFontSize={theme.typography.scale.sm}
        rightFontSize={theme.typography.scale.sm}
        leftFontWeight="700"
        rightFontWeight="normal"
        progress={0.75}
        progressBarColor={theme.colors.primary[500]}
        progressBarBgColor={theme.colors.border}
        containerStyle={{ paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[2] }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
          onPress={onBack || (() => {})}
          style={{
            width: 35,
            height: 35,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: theme.spacing[2],
            alignSelf: 'flex-start',
          }}
        >
          <ArrowLeft size={18} color={theme.colors.text.primary} />
        </Pressable>
      </ProcessHeader>
    </ScreenContainer>
  );
};

export default ProfileSetupStep3Screen;
