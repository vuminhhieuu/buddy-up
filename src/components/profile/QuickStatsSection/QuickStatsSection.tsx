import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { StatCard } from '../../ui/StatCard/StatCard';
import type { UserProfile } from '../../../types/profile';

export type QuickStatsSectionProps = {
  profile: UserProfile;
  style?: ViewStyle;
};

export const QuickStatsSection: React.FC<QuickStatsSectionProps> = ({ profile, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing[4],
        },
        style,
      ]}
    >
      <View style={styles.statsGrid}>
        <StatCard
          value={`${profile.streak} ngày`}
          label="Streak"
          emoji="🔥"
          style={styles.statCard}
        />
        <StatCard
          value={`${profile.totalTime} giờ`}
          label="Tổng thời gian"
          emoji="📚"
          style={styles.statCard}
        />
        <StatCard
          value={profile.xp.toString()}
          label="Điểm XP"
          emoji="⭐"
          style={styles.statCard}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -40,
    marginBottom: 24,
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  statCard: {
    flexGrow: 0,
    flexShrink: 0,
    width: 110,
    marginHorizontal: 8,
  },
});
