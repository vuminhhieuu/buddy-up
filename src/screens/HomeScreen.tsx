import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Animated, RefreshControl } from 'react-native';
import { ScreenContainer, Spacer, Loading, EmptyState } from '../components/ui';
import {
  HomeHeader,
  HeroProgressCard,
  StudyStatsRow,
  UpcomingSessions,
  QuickActions,
  type StatItem,
} from '../components/home';
import { useTheme } from '../styles';
import { useAppSelector } from '../store/hooks';
import { fetchHomeDashboard, type HomeDashboardData } from '../services/home';
import { useTranslation } from 'react-i18next';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/MainTabsNavigator';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const userId = useAppSelector((state) => state.auth.userId);
  const authDisplayName = useAppSelector((state) => state.auth.displayName);
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadDashboard = useCallback(
    async (showSpinner: boolean) => {
      if (!userId) return;
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchHomeDashboard(userId);
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (userId) {
      void loadDashboard(true);
    } else {
      setLoading(false);
    }
  }, [loadDashboard, userId]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    void loadDashboard(false);
  }, [loadDashboard, userId]);

  const stats: StatItem[] = useMemo(() => {
    const weeklyHours = dashboard?.weeklyStudyHours ?? 0;
    const hoursLabel =
      Number.isFinite(weeklyHours) && weeklyHours % 1 === 0
        ? `${weeklyHours.toFixed(0)}h`
        : `${weeklyHours.toFixed(1)}h`;

    const completedSessions = dashboard?.completedSessions ?? 0;
    const sessionGoal = dashboard?.sessionGoal ?? 0;
    const rewardPoints = dashboard?.xp ?? 0;

    const adjustedCompleted =
      sessionGoal > 0 ? Math.min(completedSessions, sessionGoal) : completedSessions;
    const sessionValue =
      sessionGoal > 0 ? `${adjustedCompleted}/${sessionGoal}` : `${completedSessions}/0`;

    return [
      { icon: '📚', value: hoursLabel, label: t('home.stats.studyHours') },
      {
        icon: '🎯',
        value: sessionValue,
        label: t('home.stats.completedSessions'),
      },
      {
        icon: '⭐',
        value: rewardPoints >= 0 ? `+${rewardPoints}` : String(rewardPoints),
        label: t('home.stats.rewardPoints'),
      },
    ];
  }, [dashboard, t]);

  const streakGoal = dashboard?.weeklyGoalDays ?? 7;
  const streakDays = Math.min(dashboard?.streak ?? 0, streakGoal);
  const weeklyProgress = {
    completed: streakDays,
    total: streakGoal || 1,
  };

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.colors.primary[500]}
    />
  );

  const upcomingSessions = dashboard?.sessions ?? [];

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleAvatarPress = () => {
    console.log('Avatar pressed');
  };

  const handleSessionPress = (sessionId: string) => {
    console.log('Session pressed:', sessionId);
  };

  const handleViewAllPress = () => {
    console.log('View all pressed');
  };

  const handleCreateSessionPress = () => {
    console.log('Create session pressed');
  };

  const handleFindBuddyPress = () => {
    navigation.navigate('Buddy');
  };

  const handleStatPress = (index: number) => {
    console.log('Stat pressed:', index);
  };

  if (!userId) {
    return (
      <ScreenContainer>
        <EmptyState title={t('home.errors.title')} description={t('home.errors.subtitle')} />
      </ScreenContainer>
    );
  }

  if (loading && !dashboard) {
    return (
      <ScreenContainer>
        <Loading fullScreen message={t('buddy.loading')} />
      </ScreenContainer>
    );
  }

  if (error && !dashboard) {
    return (
      <ScreenContainer>
        <EmptyState
          title={t('home.errors.title')}
          description={t('home.errors.subtitle')}
          actionLabel={t('home.errors.retry')}
          onActionPress={() => loadDashboard(true)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <HomeHeader
          name={dashboard?.profileName || authDisplayName || undefined}
          avatarUrl={dashboard?.avatarUrl}
          onNotificationPress={handleNotificationPress}
          onAvatarPress={handleAvatarPress}
        />

        <Spacer size={4} />

        <HeroProgressCard streakDays={dashboard?.streak ?? 0} weeklyProgress={weeklyProgress} />

        <StudyStatsRow stats={stats} onStatPress={handleStatPress} />

        <UpcomingSessions
          sessions={upcomingSessions}
          onSessionPress={handleSessionPress}
          onViewAllPress={handleViewAllPress}
        />

        <QuickActions
          onCreateSessionPress={handleCreateSessionPress}
          onFindBuddyPress={handleFindBuddyPress}
        />

        <Spacer size={8} />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    flex: 1,
  },
});
