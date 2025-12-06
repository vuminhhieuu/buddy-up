import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card/Card';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import type { Subject } from '../../../types/profile';

export type SubjectCardProps = {
  subject: Subject;
  style?: ViewStyle;
  onPress?: () => void;
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, style, onPress }) => {
  const { theme } = useTheme();

  const getBadgeColor = (): string => {
    switch (subject.badgeColor) {
      case 'blue':
        return theme.colors.secondary[500];
      case 'orange':
        return theme.colors.semantic.warning;
      case 'green':
        return theme.colors.primary[500];
      default:
        return theme.colors.text.primary;
    }
  };

  const getBadgeBackgroundColor = (): string => {
    switch (subject.badgeColor) {
      case 'blue':
        return theme.colors.secondary[50];
      case 'orange':
        return '#FFF5E6';
      case 'green':
        return theme.colors.primary[100];
      default:
        return theme.colors.neutral[100];
    }
  };

  const getBadgeBorderColor = (): string => {
    switch (subject.badgeColor) {
      case 'blue':
        return 'rgba(28, 176, 246, 0.2)';
      case 'orange':
        return 'rgba(255, 150, 0, 0.2)';
      case 'green':
        return 'rgba(88, 204, 2, 0.2)';
      default:
        return theme.colors.border;
    }
  };

  const getProgressVariant = (): 'blue' | 'orange' | 'green' => {
    return subject.badgeColor;
  };

  const { t } = useTranslation('session');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={`${subject.name}: ${subject.progress}% hoàn thành`}
    >
      <Card padding={4} elevation="sm">
        <View style={styles.header}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: getBadgeBackgroundColor(),
                borderWidth: 1.5,
                borderColor: getBadgeBorderColor(),
                paddingHorizontal: theme.spacing[3],
                paddingVertical: theme.spacing[1],
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: getBadgeColor(),
                  fontFamily: theme.typography.families.display,
                  fontWeight: theme.typography.weights.bold,
                },
              ]}
            >
              {subject.name}
            </Text>
          </View>
          <Text
            variant="bodySmall"
            color="secondary"
            style={[styles.hours, { flexShrink: 0 }]}
            numberOfLines={1}
          >
            {/* Format hours consistently and prevent unit wrapping by using a non-breaking space */}
            {Number.isInteger(subject.totalHours)
              ? `${subject.totalHours}`
              : subject.totalHours.toFixed(1)}
            {'\u00A0'}
            {t('hours')}
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar progress={subject.progress} variant={getProgressVariant()} height={8} />
        </View>
        <Text variant="caption" color="secondary" style={styles.progressText}>
          {subject.progress}% hoàn thành
        </Text>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 14,
  },
  hours: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ translateY: -2 }],
  },
});
