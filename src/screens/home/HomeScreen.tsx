import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Animated, RefreshControl } from 'react-native';
import { ScreenContainer, Spacer, Loading, EmptyState } from '../../components/ui';
import {
  HomeHeader,
  HeroProgressCard,
  StudyStatsRow,
  UpcomingSessions,
  QuickActions,
  type StatItem,
} from '../../components/home';
import { useTheme } from '../../styles';
import { useAppSelector } from '../../store/hooks';
import { fetchHomeDashboard, type HomeDashboardData } from '../../services/home';
import { useTranslation } from 'react-i18next';
import { useNavigation, type NavigationProp, useFocusEffect } from '@react-navigation/native';
import { useInvitations } from '../../hooks/useInvitations';
import type { MainTabParamList } from '../../navigation/MainTabsNavigator';
import { logger } from '../../utils/logger';

export const HomeScreen: React.FC = () => {
  const { pendingCount, loadPendingCount } = useInvitations();
  const { theme } = useTheme();
  const { t } = useTranslation('home');
  const userId = useAppSelector((state) => state.auth.userId);
  const authDisplayName = useAppSelector((state) => state.auth.displayName);
  const profileData = useAppSelector((state) => state.auth.profileData);
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
      void loadPendingCount();
    } else {
      setLoading(false);
    }
  }, [loadDashboard, loadPendingCount, userId]);

  // Reload dashboard when screen comes back into focus (e.g., after deleting a session)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        void loadDashboard(false);
        void loadPendingCount();
      }
    }, [loadDashboard, loadPendingCount, userId]),
  );

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
      { icon: '📚', value: hoursLabel, label: t('stats.studyHours') },
      {
        icon: '🎯',
        value: sessionValue,
        label: t('stats.completedSessions'),
      },
      {
        icon: '⭐',
        value: rewardPoints >= 0 ? `+${rewardPoints}` : String(rewardPoints),
        label: t('stats.rewardPoints'),
      },
    ];
  }, [dashboard, t]);

  const streakGoal = dashboard?.weeklyGoalDays ?? 7;
  const weeklyCompleted = Math.min(dashboard?.weeklyActiveDays ?? 0, streakGoal);
  const weeklyProgress = {
    completed: weeklyCompleted,
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
    logger.debug('HomeScreen', 'Notification pressed');
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('Notifications');
    }
  };

  const handleAvatarPress = () => {
    logger.debug('HomeScreen', 'Avatar pressed');
  };

  const handleSessionPress = (sessionId: string) => {
    logger.debug('HomeScreen', 'Session pressed:', sessionId);
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('SessionDetail', { sessionId });
    }
  };

  const handleViewAllPress = () => {
    logger.debug('HomeScreen', 'View all pressed');
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('UpcomingSessionsAll');
    }
  };

  const handleCreateSessionPress = () => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('CreateSession');
    } else {
      logger.debug('HomeScreen', 'Create session pressed');
    }
  };

  const handleFindBuddyPress = () => {
    navigation.navigate('Buddy');
  };

  const handleStatPress = (index: number) => {
    logger.debug('HomeScreen', 'Stat pressed:', index);
  };

  if (!userId) {
    return (
      <ScreenContainer>
        <EmptyState title={t('errors.title')} description={t('errors.subtitle')} />
      </ScreenContainer>
    );
  }

  if (loading && !dashboard) {
    return (
      <ScreenContainer>
        <Loading fullScreen />
      </ScreenContainer>
    );
  }

  if (error && !dashboard) {
    return (
      <ScreenContainer>
        <EmptyState
          title={t('errors.title')}
          description={t('errors.subtitle')}
          actionLabel={t('errors.retry')}
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
          avatarUrl={profileData?.avatarUrl || dashboard?.avatarUrl}
          notificationsCount={pendingCount}
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
