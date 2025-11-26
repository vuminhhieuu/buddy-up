import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Icon } from '../../ui/Icon/Icon';
import { Card } from '../../ui/Card/Card';
import { Spacer } from '../../ui/Spacer/Spacer';
import type { StudyStats } from '../../../types/profile';
import { useTranslation } from 'react-i18next';

export type StudyStatsSectionProps = {
  stats: StudyStats;
  style?: ViewStyle;
};

const StudyStatsSectionComponent: React.FC<StudyStatsSectionProps> = ({ stats, style }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('profile');

  const maxValue = Math.max(...stats.weeklyActivity.map((a) => a.value), 1);

  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing[3] }, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="chart" size={20} color={theme.colors.primary[500]} />
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
            {t('studyStats.title')}
          </Text>
        </View>
      </View>

      <Spacer size={4} />

      <Card padding={5} elevation="sm">
        {/* Weekly Chart */}
        <View style={styles.chartContainer}>
          {stats.weeklyActivity.map((activity, index) => {
            const heightPercent = maxValue > 0 ? (activity.value / maxValue) * 100 : 0;
            return (
              <View key={index} style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: theme.colors.primary[500],
                      minHeight: heightPercent > 0 ? 8 : 0,
                    },
                  ]}
                />
                <Spacer size={1} />
                <Text variant="caption" color="secondary" style={styles.chartLabel}>
                  {activity.day}
                </Text>
              </View>
            );
          })}
        </View>

        <Spacer size={4} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text
              variant="h3"
              style={[
                styles.statValue,
                {
                  color: theme.colors.primary[500],
                  fontFamily: theme.typography.families.display,
                  fontWeight: theme.typography.weights.bold,
                },
              ]}
            >
              {stats.completedSessions}
            </Text>
            <Text variant="bodySmall" color="secondary" style={styles.statLabel}>
              {t('studyStats.sessions')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text
              variant="h3"
              style={[
                styles.statValue,
                {
                  color: theme.colors.primary[500],
                  fontFamily: theme.typography.families.display,
                  fontWeight: theme.typography.weights.bold,
                },
              ]}
            >
              {stats.averagePerDay}
            </Text>
            <Text variant="bodySmall" color="secondary" style={styles.statLabel}>
              {t('studyStats.average')}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

export const StudyStatsSection = React.memo(StudyStatsSectionComponent);

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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
