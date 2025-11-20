import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';
import { Card } from '../Card/Card';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import type { Achievement } from '../../../types/profile';

export type AchievementCardProps = {
  achievement: Achievement;
  style?: ViewStyle;
  onPress?: () => void;
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  style,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, styles.pressableContainer, style]}
      accessibilityRole="button"
      accessibilityLabel={`${achievement.name}: ${achievement.description}`}
    >
      <Card
        padding={4}
        elevation="sm"
        style={[
          styles.card,
          achievement.completed && {
            borderWidth: 2,
            borderColor: '#FFD700',
            shadowColor: '#FFD700',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{achievement.emoji}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text
              variant="bodySmall"
              style={[
                styles.name,
                {
                  fontFamily: theme.typography.families.display,
                  fontWeight: theme.typography.weights.bold,
                },
              ]}
            >
              {achievement.name}
            </Text>
            <Text variant="caption" color="secondary" style={styles.description}>
              {achievement.description}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <ProgressBar progress={achievement.progress} variant="primary" height={4} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    width: 140,
    flexShrink: 0,
  },
  card: {
    height: 160,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
    minHeight: 56,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  description: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
