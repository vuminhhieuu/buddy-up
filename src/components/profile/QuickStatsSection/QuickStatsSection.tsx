import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { StatCard } from '../../ui/StatCard/StatCard';
import { useTranslation } from 'react-i18next';

export type QuickStatsSectionProps = {
  stats: {
    streak: number;
    totalTime: number;
    xp: number;
  };
  style?: ViewStyle;
};

const QuickStatsSectionComponent: React.FC<QuickStatsSectionProps> = ({ stats, style }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const animatedValues = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      animatedValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, []);

  const cards = useMemo(
    () => [
      {
        id: 'streak',
        value: t('profileScreen.quickStats.days', { count: stats.streak }),
        label: t('profileScreen.quickStats.streak'),
        emoji: '🔥',
      },
      {
        id: 'time',
        value: t('profileScreen.quickStats.hours', { count: stats.totalTime }),
        label: t('profileScreen.quickStats.totalTime'),
        emoji: '📚',
      },
      {
        id: 'xp',
        value: t('profileScreen.quickStats.xpValue', { count: stats.xp }),
        label: t('profileScreen.quickStats.xpLabel'),
        emoji: '⭐',
      },
    ],
    [stats, t],
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing[3],
        },
        style,
      ]}
    >
      <View style={styles.statsGrid}>
        {cards.map((card, index) => (
          <Animated.View
            key={card.id}
            style={[
              styles.statCard,
              {
                opacity: animatedValues[index],
                transform: [
                  {
                    translateY: animatedValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <StatCard value={card.value} label={card.label} emoji={card.emoji} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

export const QuickStatsSection = React.memo(QuickStatsSectionComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: -12,
    marginBottom: 24,
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    width: '100%',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 6,
  },
});
