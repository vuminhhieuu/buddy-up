import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Text, Button, Spacer } from '../../components/ui';
import {
  ProfileHeader,
  QuickStatsSection,
  AchievementsSection,
  StudyStatsSection,
  SubjectsSection,
  SettingsSection,
} from '../../components/profile';
import type {
  UserProfile,
  Achievement,
  Subject,
  StudyStats,
  SettingsItem,
} from '../../types/profile';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signOutState, setProfileData as setProfileSetupData } from '../../store/slices/authSlice';
import { signOut } from '../../services/auth';
import { useTranslation } from 'react-i18next';
import {
  fetchProfileScreenData,
  uploadAvatarToStorage,
  updateProfileAvatar,
} from '../../services/profile';
import { saveLanguage, getStoredLanguage, type SupportedLanguage } from '../../services/language';
import { useTheme } from '../../styles';
import { logger } from '../../utils/logger';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { ImagePickerModal } from '../../components/ui/ImagePickerModal/ImagePickerModal';
import {
  VietnamFlagIcon,
  UnitedStatesFlagIcon,
  type FlagIconProps,
} from '../../components/icons/flags';

type FlagComponent = React.FC<FlagIconProps>;

const LANGUAGE_CONFIGS: Array<{
  code: SupportedLanguage;
  Flag: FlagComponent;
}> = [
  { code: 'vi', Flag: VietnamFlagIcon },
  { code: 'en', Flag: UnitedStatesFlagIcon },
];

export const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation('profile');
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
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [languageChanging, setLanguageChanging] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('vi');

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
        profileOverview?.subtitle ?? setupProfileData?.studyGoal ?? t('headerSubtitleDefault'),
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

  const languageOptions = useMemo(
    () =>
      LANGUAGE_CONFIGS.map((config) => ({
        ...config,
        nativeName: t(`languages.${config.code}`, { ns: 'language' }),
        englishName: t(`languageNames.${config.code}`, { ns: 'language' }),
      })),
    [t, i18n.language],
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
        logger.warn('ProfileScreen', 'loadData', err);
        setError(t('errors.loadFailed'));
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

  useEffect(() => {
    const loadLanguagePreference = async () => {
      const stored = await getStoredLanguage();
      const current = (stored || i18n.language || 'vi') as SupportedLanguage;
      setSelectedLanguage(current);
    };
    loadLanguagePreference();
  }, [i18n.language]);

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
      const errorMessage = err instanceof Error ? err.message : t('signOutFailed', { ns: 'auth' });
      Alert.alert(t('signOutFailedTitle', { ns: 'auth' }), errorMessage, [
        { text: t('ok', { ns: 'auth' }) },
      ]);
    } finally {
      setSigningOut(false);
    }
  }, [dispatch, t]);

  const handleOpenSettingsSection = useCallback(
    (section?: string) => {
      navigation.navigate('ProfileSettings', { section });
    },
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

  const currentLanguage =
    languageOptions.find((lang) => lang.code === selectedLanguage) ?? languageOptions[0];

  const handleLanguageItemPress = useCallback(() => {
    setLanguageModalVisible(true);
  }, []);

  const closeLanguageModal = useCallback(() => {
    if (!languageChanging) {
      setLanguageModalVisible(false);
    }
  }, [languageChanging]);

  const handleLanguageChange = useCallback(
    async (language: SupportedLanguage) => {
      if (language === selectedLanguage || languageChanging) {
        setLanguageModalVisible(false);
        return;
      }

      setLanguageChanging(true);
      try {
        await saveLanguage(language);
        setSelectedLanguage(language);
        setLanguageModalVisible(false);
      } catch (err) {
        Alert.alert(t('common.error', { ns: 'common' }), t('changeError', { ns: 'language' }));
      } finally {
        setLanguageChanging(false);
      }
    },
    [languageChanging, selectedLanguage, t],
  );

  const settingsItems: SettingsItem[] = useMemo(
    () => [
      {
        id: 'edit-profile',
        label: t('settings.editProfile'),
        icon: 'userEdit',
        onPress: () => navigation.navigate('EditProfile'),
      },
      {
        id: 'manage-friends',
        label: t('settings.friends'),
        icon: 'buddy',
        onPress: () => handleOpenSettingsSection('friends'),
      },
      {
        id: 'notifications',
        label: t('settings.notifications'),
        icon: 'bell',
        onPress: () => handleOpenSettingsSection('notifications'),
      },
      {
        id: 'security',
        label: t('settings.security'),
        icon: 'lock',
        onPress: () => handleOpenSettingsSection('security'),
      },
      {
        id: 'change-password',
        label: t('changePassword', { ns: 'auth' }),
        icon: 'key',
        onPress: () => navigation.navigate('ChangePassword'),
      },
      {
        id: 'language',
        label: t('settings.language'),
        icon: 'globe',
        onPress: handleLanguageItemPress,
        rightElement: (
          <View
            style={[
              styles.languageSettingBadge,
              {
                backgroundColor: theme.colors.surface,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              },
            ]}
          >
            <currentLanguage.Flag width={28} height={18} borderRadius={4} />
          </View>
        ),
      },
      {
        id: 'help',
        label: t('settings.help'),
        icon: 'help',
        onPress: () => handleOpenSettingsSection('help'),
      },
      {
        id: 'logout',
        label: t('settings.logout'),
        icon: 'logout',
        variant: 'danger',
        onPress: () =>
          Alert.alert(t('signOut', { ns: 'auth' }), t('settings.confirmLogout'), [
            { text: t('common.back', { ns: 'common' }), style: 'cancel' },
            { text: t('signOut', { ns: 'auth' }), style: 'destructive', onPress: handleSignOut },
          ]),
      },
    ],
    [
      handleLanguageItemPress,
      handleOpenSettingsSection,
      handleSignOut,
      navigation,
      t,
      theme.colors.surface,
      currentLanguage,
    ],
  );

  if (!userId) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text variant="body">{t('errors.loadFailed')}</Text>
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
            title={t('pullToRefresh')}
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
            <Button label={t('errors.retry')} onPress={() => loadData(true)} />
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
      <Modal
        visible={languageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeLanguageModal}
      >
        <View style={styles.languageModalOverlay}>
          <Pressable
            style={styles.languageModalBackdrop}
            onPress={closeLanguageModal}
            accessibilityRole="button"
            accessibilityLabel={t('closeLanguageSelection', { ns: 'language' })}
          />
          <View style={[styles.languageModalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.languagePullHandle, { backgroundColor: theme.colors.border }]} />
            <View style={styles.languageModalHeader}>
              <Text variant="h5" style={styles.languageModalTitle}>
                {t('selectLanguage', { ns: 'language' })}
              </Text>
            </View>
            <View style={styles.languageOptionList}>
              {languageOptions.map((lang) => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code)}
                    disabled={languageChanging}
                    style={({ pressed }) => [
                      styles.languageOptionItem,
                      pressed && { backgroundColor: theme.colors.neutral[100] },
                      isSelected && { backgroundColor: theme.colors.primary[50] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${lang.nativeName}${
                      isSelected ? `, ${t('currentLanguage', { ns: 'language' })}` : ''
                    }`}
                  >
                    <View
                      style={[
                        styles.languageOptionFlag,
                        {
                          backgroundColor: theme.colors.surface,
                        },
                      ]}
                    >
                      <lang.Flag width={30} height={20} borderRadius={4} />
                    </View>
                    <View style={styles.languageOptionTexts}>
                      <Text variant="body" style={styles.languageOptionName}>
                        {lang.nativeName}
                      </Text>
                      <Text variant="bodySmall" color="secondary">
                        {lang.englishName}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        style={[
                          styles.languageOptionCheck,
                          { backgroundColor: theme.colors.primary[500] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.languageOptionCheckText,
                            { color: theme.colors.text.inverse },
                          ]}
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  languageSettingBadge: {
    width: 36,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  languageModalBackdrop: {
    flex: 1,
  },
  languageModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  languagePullHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  languageModalHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  languageModalTitle: {
    fontWeight: '700',
  },
  languageOptionList: {
    paddingHorizontal: 24,
  },
  languageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  languageOptionFlag: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  languageOptionTexts: {
    flex: 1,
  },
  languageOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageOptionCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageOptionCheckText: {
    fontWeight: '700',
  },
});
