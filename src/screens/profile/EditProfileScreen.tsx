import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer, Text, Spacer, Input } from '../../components/ui';
import { BackButton } from '../../components/navigation/BackButton';
import { AvatarPickerSection } from '../../components/ui/AvatarPickerSection/AvatarPickerSection';
import {
  Sun,
  CloudSun,
  Moon,
  Calendar,
  Zap,
  Lock,
  Trash2,
  Save,
  PlusCircle,
  FileText,
  Clock,
  Target,
  BookOpen,
  MapPin,
} from 'lucide-react-native';
import { useTheme } from '../../styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setProfileData as setProfileSetupData, signOutState } from '../../store/slices/authSlice';
import {
  uploadAvatarToStorage,
  updateProfileAvatar,
  updateFullProfile,
  deleteUserAccount,
} from '../../services/profile';
import { fetchProfileScreenData } from '../../services/profile';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import type { EditProfileData } from '../../types/profile';
import { getCurrentLocation } from '../../utils/location';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

// Import category options from ProfileSetup
const CATEGORY_OPTIONS = [
  { key: 'english', labelKey: 'profileSetup.categoryEnglish' },
  { key: 'japanese', labelKey: 'profileSetup.categoryJapanese' },
  { key: 'korean', labelKey: 'profileSetup.categoryKorean' },
  { key: 'chinese', labelKey: 'profileSetup.categoryChinese' },
  { key: 'javascript', labelKey: 'profileSetup.categoryJavaScript' },
  { key: 'python', labelKey: 'profileSetup.categoryPython' },
  { key: 'react', labelKey: 'profileSetup.categoryReact' },
  { key: 'nodejs', labelKey: 'profileSetup.categoryNodejs' },
  { key: 'java', labelKey: 'profileSetup.categoryJava' },
  { key: 'toeic', labelKey: 'profileSetup.categoryTOEIC' },
  { key: 'ielts', labelKey: 'profileSetup.categoryIELTS' },
  { key: 'jlpt', labelKey: 'profileSetup.categoryJLPT' },
  { key: 'sat', labelKey: 'profileSetup.categorySAT' },
  { key: 'gre', labelKey: 'profileSetup.categoryGRE' },
  { key: 'datascience', labelKey: 'profileSetup.categoryDataScience' },
  { key: 'uiux', labelKey: 'profileSetup.categoryUIUX' },
  { key: 'marketing', labelKey: 'profileSetup.categoryMarketing' },
  { key: 'math', labelKey: 'profileSetup.categoryMath' },
  { key: 'physics', labelKey: 'profileSetup.categoryPhysics' },
];

type TimeKey = 'morning' | 'noon' | 'evening' | 'weekend' | 'flexible';
type StyleKey = 'serious' | 'balanced' | 'relaxed';

export const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation('profile');
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const dispatch = useAppDispatch();
  const { userId, email, profileData: setupProfileData } = useAppSelector((state) => state.auth);
  const scrollRef = useRef<ScrollView | null>(null);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Generate display list from CATEGORY_OPTIONS with translated labels
  const availableInterestsList = useMemo(
    () =>
      CATEGORY_OPTIONS.map((cat) => ({ key: cat.key, label: t(cat.labelKey, { ns: 'common' }) })),
    [t],
  );

  // Set of default category keys to detect custom interests
  const defaultInterestKeys = useMemo(() => new Set(CATEGORY_OPTIONS.map((c) => c.key)), []);

  const TIME_OPTIONS: { key: TimeKey; labelKey: string; icon: React.ReactElement }[] = [
    {
      key: 'morning',
      labelKey: 'editProfile.timeMorning',
      icon: <Sun size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'noon',
      labelKey: 'editProfile.timeNoon',
      icon: <CloudSun size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'evening',
      labelKey: 'editProfile.timeEvening',
      icon: <Moon size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'weekend',
      labelKey: 'editProfile.timeWeekend',
      icon: <Calendar size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'flexible',
      labelKey: 'editProfile.timeFlexible',
      icon: <Zap size={22} color={theme.colors.primary[500]} />,
    },
  ];

  const STYLE_OPTIONS: { key: StyleKey; labelKey: string }[] = [
    { key: 'serious', labelKey: 'editProfile.styleSerious' },
    { key: 'relaxed', labelKey: 'editProfile.styleRelaxed' },
    { key: 'balanced', labelKey: 'editProfile.styleBalanced' },
  ];

  // Local state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [studyGoal, setStudyGoal] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  const [initialData, setInitialData] = useState<EditProfileData | null>(null);

  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const result = await fetchProfileScreenData(userId);
        const profile = result.profile;

        const loadedData: EditProfileData = {
          displayName: profile.name || setupProfileData.displayName || '',
          bio: profile.bio || '',
          mainLearningGoal: profile.mainLearningGoal || setupProfileData.studyGoal || '',
          location: profile.location || '',
          availableTimes: setupProfileData.availableTimes || [],
          learningStyle: setupProfileData.learningStyle || '',
          interests: profile.interests || setupProfileData.categories || [],
        };

        setDisplayName(loadedData.displayName);
        setStudyGoal(loadedData.mainLearningGoal || '');
        setBio(loadedData.bio || '');
        setLocation(loadedData.location || '');
        setAvatarUri(profile.avatarUri);
        setAvailableTimes(loadedData.availableTimes || []);
        setLearningStyle(loadedData.learningStyle || '');
        setSelectedInterests(loadedData.interests || []);
        setInitialData(loadedData);
      } catch (err) {
        Alert.alert(t('common.error', { ns: 'common' }), t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, setupProfileData, t]);

  // Check for changes
  useEffect(() => {
    if (!initialData) return;

    const currentData: EditProfileData = {
      displayName,
      bio,
      mainLearningGoal: studyGoal,
      location,
      availableTimes,
      learningStyle,
      interests: selectedInterests,
    };

    const changed = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [
    displayName,
    studyGoal,
    bio,
    location,
    availableTimes,
    learningStyle,
    selectedInterests,
    initialData,
  ]);

  const handleAvatarSelected = async (uri: string) => {
    if (!userId) return;
    try {
      const uploadedUrl = await uploadAvatarToStorage(userId, uri);
      await updateProfileAvatar(userId, uploadedUrl);
      setAvatarUri(uploadedUrl);
      dispatch(setProfileSetupData({ avatarUrl: uploadedUrl }));
      setHasChanges(true);
    } catch (err) {
      Alert.alert(t('common.error', { ns: 'common' }), t('editProfile.error'));
    }
  };

  const handleToggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    if (!displayName.trim()) {
      Alert.alert(t('common.error', { ns: 'common' }), t('editProfile.displayNameRequired'));
      return;
    }
    if (!studyGoal.trim()) {
      Alert.alert(t('common.error', { ns: 'common' }), t('editProfile.studyGoalRequired'));
      return;
    }

    try {
      setSaving(true);

      const profileData: EditProfileData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        mainLearningGoal: studyGoal.trim(),
        location: location.trim() || undefined,
        availableTimes,
        learningStyle,
        interests: selectedInterests,
      };

      await updateFullProfile(userId, profileData);

      // Update Redux state
      dispatch(
        setProfileSetupData({
          displayName: profileData.displayName,
          studyGoal: profileData.mainLearningGoal || '',
          bio: profileData.bio,
          location: profileData.location,
          availableTimes: profileData.availableTimes,
          learningStyle: profileData.learningStyle as
            | 'serious'
            | 'balanced'
            | 'relaxed'
            | undefined,
          categories: profileData.interests,
        }),
      );

      Alert.alert(t('common.success', { ns: 'common' }), t('editProfile.success'), [
        {
          text: t('common.ok', { ns: 'common' }),
          onPress: () => navigation.goBack(),
        },
      ]);

      setHasChanges(false);
    } catch (err) {
      Alert.alert(t('common.error', { ns: 'common' }), t('editProfile.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!userId) return;

    Alert.alert(t('editProfile.deleteAccount'), t('editProfile.deleteConfirmMessage'), [
      {
        text: t('common.cancel', { ns: 'common' }),
        style: 'cancel',
      },
      {
        text: t('common.delete', { ns: 'common' }),
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteUserAccount(userId);
            dispatch(signOutState());
            // Navigation will be handled automatically by auth state change
          } catch (err) {
            Alert.alert(t('common.error', { ns: 'common' }), t('editProfile.deleteError'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(t('editProfile.confirmDiscard'), '', [
        {
          text: t('editProfile.keepEditing'),
          style: 'cancel',
        },
        {
          text: t('editProfile.discard'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation, t]);

  const handleAddCustomInterest = useCallback(() => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    const exists = selectedInterests.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setCustomInterest('');
      return;
    }
    setSelectedInterests((prev) => [...prev, trimmed]);
    setCustomInterest('');
  }, [customInterest, selectedInterests]);

  const handleGetCurrentLocation = useCallback(async () => {
    try {
      setGettingLocation(true);
      const result = await getCurrentLocation();

      if (result.success && result.location) {
        setLocation(result.location);
        showSuccessToast(t('locationSuccess', { ns: 'common' }));
      } else {
        const errorMessage = result.error || t('locationError', { ns: 'common' });
        if (result.error === 'Location permission denied') {
          Alert.alert(
            t('common.error', { ns: 'common' }),
            t('locationPermissionDenied', { ns: 'common' }),
            [{ text: t('ok', { ns: 'common' }) }],
          );
        } else {
          showErrorToast(errorMessage);
        }
      }
    } catch (error) {
      showErrorToast(t('locationError', { ns: 'common' }));
    } finally {
      setGettingLocation(false);
    }
  }, [t]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text variant="h4" style={styles.headerTitle}>
            {t('editProfile.title')}
          </Text>
          <View style={styles.saveButton} />
        </View>

        <Spacer size={4} />

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <AvatarPickerSection
              avatarUri={avatarUri}
              displayName={displayName}
              onAvatarSelected={handleAvatarSelected}
            />
          </View>

          <Spacer size={4} />

          {/* Thông tin cơ bản */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FileText size={20} color={theme.colors.primary[500]} />
            </View>
            <Text variant="h6" style={styles.sectionTitle}>
              {t('editProfile.basicInfo')}
            </Text>
          </View>

          <Spacer size={3} />

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text variant="body" style={styles.fieldLabel}>
                {t('editProfile.displayName')}
              </Text>
              <Text variant="body" style={styles.requiredStar}>
                *
              </Text>
            </View>
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('editProfile.displayNamePlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text variant="body" style={styles.fieldLabel}>
                {t('editProfile.studyGoalLabel')}
              </Text>
              <Text variant="body" style={styles.requiredStar}>
                *
              </Text>
            </View>
            <Input
              value={studyGoal}
              onChangeText={setStudyGoal}
              placeholder={t('editProfile.studyGoalPlaceholder')}
              maxLength={200}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="body" style={styles.fieldLabel}>
              {t('editProfile.bioLabel')}
            </Text>
            <Input
              value={bio}
              onChangeText={setBio}
              placeholder={t('editProfile.bioPlaceholder')}
              maxLength={500}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="body" style={styles.fieldLabel}>
              {t('editProfile.locationLabel')}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('editProfile.locationPlaceholder')}
                  maxLength={100}
                  editable={!gettingLocation}
                />
              </View>
              <Pressable
                onPress={handleGetCurrentLocation}
                disabled={gettingLocation}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.primary[100],
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary[300],
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: gettingLocation ? 0.5 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={t('getCurrentLocation', { ns: 'common' })}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                ) : (
                  <MapPin size={20} color={theme.colors.primary[500]} />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="body" style={styles.fieldLabel}>
              {t('editProfile.email')}
            </Text>
            <Input
              value={email || ''}
              onChangeText={() => {}}
              placeholder={t('editProfile.emailPlaceholder')}
              editable={false}
              keyboardType="email-address"
              right={<Lock size={18} color={theme.colors.text.tertiary} />}
            />
          </View>

          <Spacer size={6} />

          {/* Thời gian rảnh */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Clock size={20} color={theme.colors.primary[500]} />
            </View>
            <Text variant="h6" style={styles.sectionTitle}>
              {t('editProfile.freeTime')}
            </Text>
          </View>

          <Spacer size={3} />

          <View style={styles.grid}>
            {TIME_OPTIONS.map((option) => {
              const isSelected = availableTimes.includes(option.key);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setAvailableTimes((prev) =>
                      prev.includes(option.key)
                        ? prev.filter((k) => k !== option.key)
                        : [...prev, option.key],
                    );
                  }}
                  style={[
                    option.key === 'flexible' ? styles.tileFull : styles.tileHalf,
                    isSelected && styles.tileActive,
                  ]}
                >
                  {option.icon}
                  <Spacer size={2} />
                  <Text
                    variant="body"
                    style={{
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? theme.colors.primary[600] : theme.colors.text.primary,
                    }}
                  >
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Spacer size={6} />

          {/* Phong cách học */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Target size={20} color={theme.colors.primary[500]} />
            </View>
            <Text variant="h6" style={styles.sectionTitle}>
              {t('editProfile.learningStyleTitle')}
            </Text>
          </View>

          <Spacer size={3} />

          <View>
            {STYLE_OPTIONS.map((option) => {
              const isSelected = learningStyle === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setLearningStyle(option.key)}
                  style={[
                    styles.radioRow,
                    isSelected && {
                      borderColor: theme.colors.primary[500],
                      backgroundColor: theme.colors.primary[50],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && { borderColor: theme.colors.primary[500] },
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Spacer size={6} />

          {/* Môn học quan tâm */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <BookOpen size={20} color={theme.colors.primary[500]} />
            </View>
            <Text variant="h6" style={styles.sectionTitle}>
              {t('editProfile.subjectsTitle')}
            </Text>
          </View>

          <Spacer size={3} />

          <View style={styles.chipContainer}>
            {availableInterestsList.map((item) => {
              const isSelected = selectedInterests.includes(item.key);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handleToggleInterest(item.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary[100]
                        : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{
                      color: isSelected ? theme.colors.primary[700] : theme.colors.text.secondary,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Render custom interests (immediately visible when added) */}
            {selectedInterests
              .filter((key) => !defaultInterestKeys.has(key))
              .map((key) => {
                const isSelected = selectedInterests.includes(key);
                return (
                  <Pressable
                    key={`custom-${key}`}
                    onPress={() => handleToggleInterest(key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary[100]
                          : theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: isSelected ? theme.colors.primary[700] : theme.colors.text.secondary,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {key}
                    </Text>
                  </Pressable>
                );
              })}
          </View>

          <Spacer size={3} />

          <View style={styles.customSubjectRow}>
            <Input
              value={customInterest}
              onChangeText={setCustomInterest}
              placeholder={t('editProfile.customSubjectPlaceholder', {
                defaultValue: 'Nhập môn khác',
              })}
              style={styles.customSubjectInput}
              onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
            />
            <Pressable
              onPress={handleAddCustomInterest}
              disabled={!customInterest.trim()}
              style={[
                styles.customSubjectButton,
                {
                  backgroundColor: customInterest.trim()
                    ? theme.colors.primary[500]
                    : theme.colors.neutral[200],
                },
              ]}
            >
              <PlusCircle
                size={18}
                color={
                  customInterest.trim() ? theme.colors.text.inverse : theme.colors.text.secondary
                }
              />
              <Spacer horizontal size={2} />
              <Text
                variant="body"
                style={{
                  color: customInterest.trim()
                    ? theme.colors.text.inverse
                    : theme.colors.text.secondary,
                  fontWeight: '600',
                }}
              >
                {t('editProfile.addCustomSubject', { defaultValue: 'Thêm' })}
              </Text>
            </Pressable>
          </View>

          <Spacer size={8} />

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {/* Delete Account */}
            <Pressable
              style={[
                styles.deleteButton,
                {
                  borderColor: theme.colors.semantic.error,
                  opacity: saving || deleting ? 0.5 : 1,
                },
              ]}
              onPress={handleDeleteAccount}
              disabled={saving || deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={theme.colors.semantic.error} />
              ) : (
                <Trash2 size={18} color={theme.colors.semantic.error} />
              )}
              <Spacer horizontal size={2} />
              <Text
                variant="body"
                style={{
                  color: theme.colors.semantic.error,
                  fontWeight: '600',
                }}
              >
                {deleting ? t('editProfile.deleting') : t('editProfile.deleteAccount')}
              </Text>
            </Pressable>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={saving || deleting || !hasChanges}
              style={[
                styles.saveButtonBottom,
                {
                  backgroundColor: theme.colors.primary[500],
                  opacity: !hasChanges || saving || deleting ? 0.5 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              ) : (
                <Save size={18} color={theme.colors.text.inverse} />
              )}
              <Spacer horizontal size={2} />
              <Text
                variant="body"
                style={{
                  color: theme.colors.text.inverse,
                  fontWeight: '600',
                }}
              >
                {saving ? t('editProfile.saving') : t('editProfile.save')}
              </Text>
            </Pressable>
          </View>

          <Spacer size={8} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 0,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '700',
    },
    saveButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 140,
    },
    avatarContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIconContainer: {
      marginRight: 8,
    },
    sectionTitle: {
      fontWeight: '700',
      fontSize: 16,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    fieldLabel: {
      fontWeight: '600',
    },
    requiredStar: {
      color: theme.colors.semantic.error,
      marginLeft: 4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tileHalf: {
      width: '48%',
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    tileFull: {
      width: '100%',
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    tileActive: {
      borderColor: theme.colors.semantic.success,
      backgroundColor: theme.colors.primary[100],
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.semantic.success,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.neutral[100],
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    deleteButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    saveButtonBottom: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      marginBottom: 8,
    },
    customSubjectRow: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 8,
    },
    customSubjectInput: {
      width: '100%',
    },
    customSubjectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      width: '100%',
    },
  });
