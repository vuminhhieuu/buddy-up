import React from 'react';
import { View, Pressable } from 'react-native';
import { ScreenContainer, Text } from '../../components/ui';
import { ProcessHeader } from '../../components/ui';
import { useTheme } from '../../styles';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export type ProfileSetupStep4ScreenProps = {
  onBack?: () => void;
};

const ProfileSetupStep4Screen: React.FC<ProfileSetupStep4ScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = {
    header: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2],
    },
    center: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  };

  return (
    <ScreenContainer>
      <ProcessHeader
        leftText={t('profileSetup.step', { current: 4 })}
        rightText={''}
        leftColor={theme.colors.primary[500]}
        rightColor={theme.colors.text.tertiary}
        leftFontSize={theme.typography.scale.sm}
        rightFontSize={theme.typography.scale.sm}
        leftFontWeight="700"
        rightFontWeight="normal"
        progress={1}
        progressBarColor={theme.colors.primary[500]}
        progressBarBgColor={theme.colors.border}
        containerStyle={styles.header}
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
      <View style={styles.center}>
        <Text variant="h4" style={{ fontWeight: '700', color: theme.colors.text.primary }}>
          Step 4 đang xử lí
        </Text>
      </View>
    </ScreenContainer>
  );
};

export default ProfileSetupStep4Screen;
