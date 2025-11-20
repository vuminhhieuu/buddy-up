import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Icon } from '../../ui/Icon/Icon';
import { AchievementCard } from '../../ui/AchievementCard/AchievementCard';
import { Spacer } from '../../ui/Spacer/Spacer';
import type { Achievement } from '../../../types/profile';
import { useTranslation } from 'react-i18next';

export type AchievementsSectionProps = {
  achievements: Achievement[];
  onViewAllPress?: () => void;
  onAchievementPress?: (achievement: Achievement) => void;
  style?: ViewStyle;
};

const AchievementsSectionComponent: React.FC<AchievementsSectionProps> = ({
  achievements,
  onViewAllPress,
  onAchievementPress,
  style,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing[3] }, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="trophy" size={20} color={theme.colors.primary[500]} />
          <Spacer size={2} horizontal />
          <Text
            variant="h4"
            style={[
              styles.title,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: theme.typography.weights.bold,
              },
            ]}
          >
            {t('profileScreen.achievements.title')}
          </Text>
        </View>
        {onViewAllPress && (
          <Pressable onPress={onViewAllPress} accessibilityRole="button">
            <Text variant="bodySmall" color="info" style={styles.viewAll}>
              {t('profileScreen.achievements.viewAll')}
            </Text>
          </Pressable>
        )}
      </View>

      <Spacer size={4} />

      {achievements.length === 0 ? (
        <Text variant="bodySmall" color="secondary">
          {t('profileScreen.achievements.empty')}
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onPress={() => onAchievementPress?.(achievement)}
              style={styles.achievementCard}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export const AchievementsSection = React.memo(AchievementsSectionComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingRight: 20,
    alignItems: 'stretch',
  },
  achievementCard: {
    marginRight: 12,
  },
  achievementCardLast: {
    marginRight: 0,
  },
});
