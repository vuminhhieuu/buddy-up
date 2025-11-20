import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Card } from '../ui';
import { Text } from '../ui/Text/Text';

export type StatItem = {
  icon: string;
  value: string;
  label: string;
};

export type StudyStatsRowProps = {
  stats: StatItem[];
  onStatPress?: (index: number) => void;
};

export const StudyStatsRow: React.FC<StudyStatsRowProps> = ({ stats, onStatPress }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <Pressable
          key={index}
          onPress={() => onStatPress?.(index)}
          style={styles.statWrapper}
          accessibilityRole="button"
          accessibilityLabel={`${stat.label}: ${stat.value}`}
        >
          <Card padding={4} elevation="sm" style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text
                variant="h5"
                style={[
                  styles.statValue,
                  {
                    fontFamily: theme.typography.families.display,
                    fontWeight: '700',
                  },
                ]}
              >
                {stat.value}
              </Text>
              <Text variant="caption" color="secondary" style={styles.statLabel}>
                {stat.label}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    alignItems: 'stretch',
  },
  statWrapper: {
    flex: 1,
  },
  statCard: {
    alignItems: 'stretch',
    justifyContent: 'center',
    minHeight: 100,
    height: '100%',
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    marginBottom: 4,
    lineHeight: 20,
    textAlign: 'center',
    width: '100%',
  },
  statLabel: {
    textAlign: 'center',
    lineHeight: 14,
    width: '100%',
  },
});
