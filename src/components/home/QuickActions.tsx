import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui/Text/Text';
import { Plus, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export type QuickActionsProps = {
  onCreateSessionPress?: () => void;
  onFindBuddyPress?: () => void;
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateSessionPress,
  onFindBuddyPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  return (
    <View style={styles.container}>
      {/* Primary Button - Tạo buổi học */}
      <Pressable
        onPress={onCreateSessionPress || (() => {})}
        style={({ pressed }) => [
          styles.button,
          styles.primaryButton,
          {
            backgroundColor: theme.colors.primary[500],
            ...theme.shadows.md,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('actions.createSession')}
      >
        <Plus size={16} color={theme.colors.text.inverse} strokeWidth={2.5} />
        <Text
          variant="body"
          color="inverse"
          style={[
            styles.buttonText,
            {
              fontFamily: theme.typography.families.display,
              fontWeight: '700',
            },
          ]}
        >
          {t('actions.createSession')}
        </Text>
      </Pressable>

      {/* Secondary Button - Tìm bạn học */}
      <Pressable
        onPress={onFindBuddyPress || (() => {})}
        style={({ pressed }) => [
          styles.button,
          styles.secondaryButton,
          {
            backgroundColor: theme.colors.surface,
            borderWidth: 2,
            borderColor: theme.colors.primary[500],
            ...theme.shadows.sm,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('actions.findBuddy')}
      >
        <Search size={16} color={theme.colors.primary[500]} strokeWidth={2.5} />
        <Text
          variant="body"
          style={[
            styles.buttonText,
            {
              color: theme.colors.primary[500],
              fontFamily: theme.typography.families.display,
              fontWeight: '700',
            },
          ]}
        >
          {t('actions.findBuddy')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  primaryButton: {},
  secondaryButton: {},
  buttonText: {
    fontSize: 14,
  },
});
