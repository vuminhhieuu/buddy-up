import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Text, Button, Spacer } from '../components/ui';
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
import { signOutState, setProfileData as setProfileSetupData } from '../store/slices/authSlice';
import { signOut } from '../services/auth';
import { useTranslation } from 'react-i18next';
import {
  fetchProfileScreenData,
  uploadAvatarToStorage,
  updateProfileAvatar,
} from '../services/profile';
import { useTheme } from '../styles';
import type { ProfileStackParamList } from '../navigation/ProfileStackNavigator';
import { ImagePickerModal } from '../components/ui/ImagePickerModal/ImagePickerModal';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const {
    userId,
    email,
    displayName: storedDisplayName,
    profileData: setupProfileData,
  } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();

  const errorTextStyle = useMemo(
    () => ({ color: theme.colors.semantic.error }),
    [theme.colors.semantic.error],
  );

  const [profileOverview, setProfileOverview] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const resolvedProfile: UserProfile = useMemo(() => {
    const profileName = profileOverview?.name;
    const displayName = profileName || storedDisplayName || undefined;
    const finalName =
      displayName || setupProfileData?.displayName || (email ? email.split('@')[0] : 'Learner');

    return {
      id: profileOverview?.id ?? userId ?? 'guest',
      name: finalName,
      level: profileOverview?.level ?? 1,
      subtitle:
        profileOverview?.subtitle ??
        setupProfileData?.studyGoal ??
        t('profileScreen.headerSubtitleDefault'),
      streak: profileOverview?.streak ?? 0,
      totalTime: profileOverview?.totalTime ?? 0,
      xp: profileOverview?.xp ?? 0,
      email: profileOverview?.email ?? email ?? undefined,
      avatarUri: profileOverview?.avatarUri,
    };
  }, [profileOverview, userId, t, email, storedDisplayName, setupProfileData]);

  const stats = useMemo(
    () => ({
      streak: resolvedProfile.streak,
      totalTime: resolvedProfile.totalTime,
      xp: resolvedProfile.xp,
    }),
    [resolvedProfile],
  );

  const loadData = useCallback(
    async (showSpinner = false) => {
      if (!userId) return;
      if (showSpinner) setLoading(true);
      try {
        setError(null);
        const result = await fetchProfileScreenData(userId);
        setProfileOverview(result.profile);
        if (result.profile.name) {
          dispatch(setProfileSetupData({ displayName: result.profile.name }));
        }
        if (result.profile.avatarUri) {
          dispatch(setProfileSetupData({ avatarUrl: result.profile.avatarUri }));
        }
        setAchievements(result.achievements);
        setSubjects(result.subjects);
        setStudyStats(result.studyStats);
      } catch (err) {
        console.warn('[ProfileScreen] loadData', err);
        setError(t('profileScreen.errors.loadFailed'));
      } finally {
        if (showSpinner) setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch, userId, t],
  );

  useEffect(() => {
    if (userId) {
      loadData(true);
    }
  }, [userId]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    loadData(false);
  }, [userId, loadData]);

  const handleSignOut = useCallback(async () => {
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
  }, [dispatch, t]);

  const handleOpenSettingsSection = useCallback(
    (section?: string) => navigation.navigate('ProfileSettings', { section }),
    [navigation],
  );

  const handleSettingsPress = useCallback(() => {
    handleOpenSettingsSection('profile');
  }, [handleOpenSettingsSection]);

  const achievementsRef = React.useRef(achievements);
  achievementsRef.current = achievements;

  const handleViewAllAchievements = useCallback(() => {
    navigation.navigate('ProfileAchievements', { achievements: achievementsRef.current });
  }, [navigation]);

  const handleSubjectPress = useCallback(
    (subject: Subject) => {
      navigation.navigate('SubjectDetail', { subject });
    },
    [navigation],
  );

  const handleEditAvatarPress = useCallback(() => {
    setImagePickerVisible(true);
  }, []);

  const handleAvatarSelected = useCallback(
    async (uri: string) => {
      if (!userId) return;
      try {
        setUpdatingAvatar(true);
        const uploadedUrl = await uploadAvatarToStorage(userId, uri);
        await updateProfileAvatar(userId, uploadedUrl);
        setProfileOverview((prev) =>
          prev
            ? {
                ...prev,
                avatarUri: uploadedUrl,
              }
            : prev,
        );
        dispatch(setProfileSetupData({ avatarUrl: uploadedUrl }));
        setImagePickerVisible(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.error');
        Alert.alert(t('common.error'), errorMessage);
      } finally {
        setUpdatingAvatar(false);
      }
    },
    [dispatch, t, userId],
  );

  const settingsItems: SettingsItem[] = useMemo(
    () => [
      {
        id: 'edit-profile',
        label: t('profileScreen.settings.editProfile'),
        icon: 'userEdit',
        onPress: () => handleOpenSettingsSection('profile'),
      },
      {
        id: 'manage-friends',
        label: t('profileScreen.settings.friends'),
        icon: 'buddy',
        onPress: () => handleOpenSettingsSection('friends'),
      },
      {
        id: 'notifications',
        label: t('profileScreen.settings.notifications'),
        icon: 'bell',
        onPress: () => handleOpenSettingsSection('notifications'),
      },
      {
        id: 'security',
        label: t('profileScreen.settings.security'),
        icon: 'lock',
        onPress: () => handleOpenSettingsSection('security'),
      },
      {
        id: 'language',
        label: t('profileScreen.settings.language'),
        icon: 'globe',
        onPress: () => handleOpenSettingsSection('language'),
      },
      {
        id: 'help',
        label: t('profileScreen.settings.help'),
        icon: 'help',
        onPress: () => handleOpenSettingsSection('help'),
      },
      {
        id: 'logout',
        label: t('profileScreen.settings.logout'),
        icon: 'logout',
        variant: 'danger',
        onPress: () =>
          Alert.alert(t('auth.signOut'), t('profileScreen.settings.confirmLogout'), [
            { text: t('common.back'), style: 'cancel' },
            { text: t('auth.signOut'), style: 'destructive', onPress: handleSignOut },
          ]),
      },
    ],
    [handleOpenSettingsSection, handleSignOut, t],
  );

  if (!userId) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text variant="body">{t('profileScreen.errors.loadFailed')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (loading && !refreshing && !profileOverview) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary[500]} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            title={t('profileScreen.pullToRefresh')}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {error && (
          <>
            <Text variant="body" style={errorTextStyle}>
              {error}
            </Text>
            <Spacer size={3} />
            <Button label={t('profileScreen.errors.retry')} onPress={() => loadData(true)} />
            <Spacer size={4} />
          </>
        )}
        <ProfileHeader
          profile={resolvedProfile}
          onSettingsPress={handleSettingsPress}
          onEditAvatarPress={updatingAvatar ? undefined : handleEditAvatarPress}
        />

        <QuickStatsSection stats={stats} />

        <AchievementsSection
          achievements={achievements}
          onViewAllPress={handleViewAllAchievements}
          onAchievementPress={(achievement) =>
            Alert.alert(achievement.name, achievement.description)
          }
        />

        {studyStats && <StudyStatsSection stats={studyStats} />}

        <SubjectsSection subjects={subjects} onSubjectPress={handleSubjectPress} />

        <SettingsSection items={settingsItems} />
      </ScrollView>
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onSelectImage={handleAvatarSelected}
      />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
