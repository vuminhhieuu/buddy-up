import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui/Text/Text';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export type HeroProgressCardProps = {
  streakDays: number;
  weeklyProgress: { completed: number; total: number };
  encouragementMessage?: string;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const HeroProgressCard: React.FC<HeroProgressCardProps> = ({
  streakDays,
  weeklyProgress,
  encouragementMessage,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');
  const safeProgress =
    weeklyProgress.total > 0 ? weeklyProgress.completed / weeklyProgress.total : 0;
  const circumference = 2 * Math.PI * 52;
  const progressAnimated = useRef(new Animated.Value(circumference)).current;

  const flameScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetOffset = circumference * (1 - safeProgress);
    const progressAnimation = Animated.timing(progressAnimated, {
      toValue: targetOffset,
      duration: 700,
      useNativeDriver: false,
    });
    progressAnimation.start();

    const flameAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, {
          toValue: 1.1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(flameScale, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    flameAnimation.start();

    return () => {
      progressAnimation.stop();
      flameAnimation.stop();
    };
  }, [safeProgress, circumference, flameScale, progressAnimated]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary[100],
          ...theme.shadows.lg,
        },
      ]}
    >
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />

      {/* Streak Section */}
      <View style={styles.streakSection}>
        <View style={styles.streakRow}>
          <Text
            variant="h1"
            style={[
              styles.streakNumber,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: '800',
              },
            ]}
          >
            {streakDays} ngày
          </Text>
          <Animated.Text
            style={[
              styles.flameEmoji,
              {
                transform: [{ scale: flameScale }],
              },
            ]}
          >
            🔥
          </Animated.Text>
        </View>
        <Text variant="bodySmall" color="secondary" style={styles.streakLabel}>
          {t('hero.streakLabel')}
        </Text>
      </View>

      {/* Progress Ring */}
      <View style={styles.progressContainer}>
        <Svg width={120} height={120} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={60}
            cy={60}
            r={52}
            stroke={theme.colors.primary[200]}
            strokeWidth={10}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={60}
            cy={60}
            r={52}
            stroke={theme.colors.primary[500]}
            strokeWidth={10}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnimated}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </Svg>
        <View style={styles.progressText}>
          <Text
            variant="h3"
            style={{
              fontFamily: theme.typography.families.display,
              fontWeight: '700',
            }}
          >
            {weeklyProgress.completed}/{weeklyProgress.total}
          </Text>
          <Text variant="caption" color="secondary">
            {t('hero.weekLabel')}
          </Text>
        </View>
      </View>

      {/* Encouragement Text */}
      <Text variant="bodySmall" style={styles.encouragement}>
        {encouragementMessage || t('hero.encouragement')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    lineHeight: 48,
  },
  flameEmoji: {
    fontSize: 40,
    marginLeft: 8,
  },
  streakLabel: {
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  progressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encouragement: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
