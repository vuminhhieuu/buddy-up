import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../components/ui';
import {
  ProfileHeader,
  QuickStatsSection,
  AchievementsSection,
  StudyStatsSection,
  SubjectsSection,
  SettingsSection,
} from '../components/profile';
import type { UserProfile, Achievement, Subject, StudyStats, SettingsItem } from '../types/profile';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signOutState } from '../store/slices/authSlice';
import { signOut } from '../services/auth';
import { useTranslation } from 'react-i18next';

const MOCK_PROFILE: UserProfile = {
  id: '1',
  name: 'Minh',
  level: 12,
  subtitle: 'Học viên tận tâm',
  streak: 7,
  totalTime: 45,
  xp: 1250,
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    name: 'Streak Master',
    description: 'Học 7 ngày liên tục',
    emoji: '🔥',
    progress: 100,
    completed: true,
    completedAt: new Date(),
  },
  {
    id: '2',
    name: 'Night Owl',
    description: '10 buổi học ban đêm',
    emoji: '🦉',
    progress: 100,
    completed: true,
    completedAt: new Date(),
  },
  {
    id: '3',
    name: 'Team Player',
    description: '5 buổi học nhóm',
    emoji: '🤝',
    progress: 100,
    completed: true,
    completedAt: new Date(),
  },
  {
    id: '4',
    name: 'Speed Learner',
    description: '20 giờ trong tuần',
    emoji: '⚡',
    progress: 65,
    completed: false,
  },
];

const MOCK_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'React Native',
    badgeColor: 'blue',
    progress: 75,
    totalHours: 18.5,
  },
  {
    id: '2',
    name: 'JLPT N3',
    badgeColor: 'orange',
    progress: 60,
    totalHours: 15,
  },
  {
    id: '3',
    name: 'TOEIC',
    badgeColor: 'green',
    progress: 45,
    totalHours: 11.5,
  },
];

const MOCK_STUDY_STATS: StudyStats = {
  weeklyActivity: [
    { day: 'T2', value: 60 },
    { day: 'T3', value: 80 },
    { day: 'T4', value: 45 },
    { day: 'T5', value: 90 },
    { day: 'T6', value: 70 },
    { day: 'T7', value: 55 },
    { day: 'CN', value: 40 },
  ],
  completedSessions: 28,
  averagePerDay: '1.5h',
};

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { email } = useAppSelector((state) => state.auth);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      dispatch(signOutState());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.signOutFailed');
      Alert.alert(t('auth.signOutFailedTitle'), errorMessage, [{ text: t('auth.ok') }]);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSettingsPress = () => {
    Alert.alert('Settings', 'Settings screen coming soon');
  };

  const handleEditAvatarPress = () => {
    Alert.alert('Edit Avatar', 'Avatar picker coming soon');
  };

  const handleViewAllAchievements = () => {
    Alert.alert('Achievements', 'View all achievements coming soon');
  };

  const handleAchievementPress = (achievement: Achievement) => {
    Alert.alert(achievement.name, achievement.description);
  };

  const handleSubjectPress = (subject: Subject) => {
    Alert.alert(subject.name, `${subject.progress}% hoàn thành`);
  };

  const settingsItems: SettingsItem[] = [
    {
      id: 'edit-profile',
      label: 'Chỉnh sửa hồ sơ',
      icon: 'userEdit',
      onPress: () => Alert.alert('Edit Profile', 'Edit profile screen coming soon'),
    },
    {
      id: 'manage-friends',
      label: 'Quản lý bạn bè',
      icon: 'buddy',
      onPress: () => Alert.alert('Manage Friends', 'Manage friends screen coming soon'),
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: 'bell',
      onPress: () => Alert.alert('Notifications', 'Notifications screen coming soon'),
    },
    {
      id: 'security',
      label: 'Bảo mật',
      icon: 'lock',
      onPress: () => Alert.alert('Security', 'Security screen coming soon'),
    },
    {
      id: 'language',
      label: 'Ngôn ngữ',
      icon: 'globe',
      onPress: () => Alert.alert('Language', 'Language settings coming soon'),
    },
    {
      id: 'help',
      label: 'Trợ giúp',
      icon: 'help',
      onPress: () => Alert.alert('Help', 'Help screen coming soon'),
    },
    {
      id: 'logout',
      label: 'Đăng xuất',
      icon: 'logout',
      variant: 'danger',
      onPress: () => {
        Alert.alert(t('auth.signOut'), 'Bạn có chắc chắn muốn đăng xuất?', [
          { text: 'Hủy', style: 'cancel' },
          {
            text: t('auth.signOut'),
            style: 'destructive',
            onPress: handleSignOut,
          },
        ]);
      },
    },
  ];

  return (
    <ScreenContainer scroll={false} style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          profile={MOCK_PROFILE}
          onSettingsPress={handleSettingsPress}
          onEditAvatarPress={handleEditAvatarPress}
        />

        <QuickStatsSection profile={MOCK_PROFILE} />

        <AchievementsSection
          achievements={MOCK_ACHIEVEMENTS}
          onViewAllPress={handleViewAllAchievements}
          onAchievementPress={handleAchievementPress}
        />

        <StudyStatsSection stats={MOCK_STUDY_STATS} />

        <SubjectsSection subjects={MOCK_SUBJECTS} onSubjectPress={handleSubjectPress} />

        <SettingsSection items={settingsItems} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
