import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { ScreenContainer, Spacer } from '../components/ui';
import {
  HomeHeader,
  HeroProgressCard,
  StudyStatsRow,
  UpcomingSessions,
  QuickActions,
  type Session,
  type StatItem,
} from '../components/home';
import { useTheme } from '../styles';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mock data - will be replaced with API calls later
  const mockStats: StatItem[] = [
    {
      icon: '📚',
      value: '12.5h',
      label: 'Giờ học tuần này',
    },
    {
      icon: '🎯',
      value: '3/5',
      label: 'Buổi hoàn thành',
    },
    {
      icon: '⭐',
      value: '+250',
      label: 'Điểm thưởng',
    },
  ];

  const mockSessions: Session[] = [
    {
      id: '1',
      time: '20:00 - 21:30',
      buddyName: 'Linh',
      subject: 'React Native',
      countdown: 'Còn 2 giờ',
    },
    {
      id: '2',
      time: 'Thứ 7 - 09:00',
      buddyName: 'Hùng',
      subject: 'TOEIC',
      countdown: 'Còn 1 ngày',
    },
    {
      id: '3',
      time: 'Chủ nhật - 14:00',
      buddyName: 'Mai',
      subject: 'Data Science',
      countdown: 'Còn 2 ngày',
    },
  ];

  const handleNotificationPress = () => {
    // TODO: Navigate to notifications screen
    console.log('Notification pressed');
  };

  const handleAvatarPress = () => {
    // TODO: Navigate to profile screen
    console.log('Avatar pressed');
  };

  const handleSessionPress = (sessionId: string) => {
    // TODO: Navigate to session details
    console.log('Session pressed:', sessionId);
  };

  const handleViewAllPress = () => {
    // TODO: Navigate to all sessions screen
    console.log('View all pressed');
  };

  const handleCreateSessionPress = () => {
    // TODO: Navigate to create session screen
    console.log('Create session pressed');
  };

  const handleFindBuddyPress = () => {
    // TODO: Navigate to find buddy screen
    console.log('Find buddy pressed');
  };

  const handleStatPress = (index: number) => {
    // TODO: Navigate to stats detail screen
    console.log('Stat pressed:', index);
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <HomeHeader
          onNotificationPress={handleNotificationPress}
          onAvatarPress={handleAvatarPress}
        />

        <Spacer size={4} />

        {/* Hero Progress Card */}
        <HeroProgressCard streakDays={7} weeklyProgress={{ completed: 5, total: 7 }} />

        {/* Study Stats Row */}
        <StudyStatsRow stats={mockStats} onStatPress={handleStatPress} />

        {/* Upcoming Sessions */}
        <UpcomingSessions
          sessions={mockSessions}
          onSessionPress={handleSessionPress}
          onViewAllPress={handleViewAllPress}
        />

        {/* Quick Actions */}
        <QuickActions
          onCreateSessionPress={handleCreateSessionPress}
          onFindBuddyPress={handleFindBuddyPress}
        />

        {/* Bottom padding for safe area */}
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
