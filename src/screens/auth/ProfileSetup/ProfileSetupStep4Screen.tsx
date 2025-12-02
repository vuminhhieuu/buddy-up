import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useNavigation, CommonActions, CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../../navigation/MainTabsNavigator';
import { ScreenContainer } from '../../../components/ui/ScreenContainer/ScreenContainer';
import { Text } from '../../../components/ui/Text/Text';
import { ProcessHeader } from '../../../components/ui/ProcessHeader/ProcessHeader';
import { useTheme } from '../../../styles/ThemeProvider';
import { setProfileSetupInProgress } from '../../../store/slices/authSlice';
import { ArrowLeft, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NAVIGATION_DELAY_MS } from '../../../constants/profileSetup';

export type ProfileSetupStep4ScreenProps = {
  onBack?: () => void;
};

const ProfileSetupStep4Screen: React.FC<ProfileSetupStep4ScreenProps> = ({ onBack }) => {
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        NativeStackNavigationProp<RootStackParamList>,
        BottomTabNavigationProp<MainTabParamList>
      >
    >();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = {
    header: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2],
    },
    center: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    card: {
      alignSelf: 'center' as const,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      marginVertical: theme.spacing[2],
      ...(theme.shadows?.md || {}),
    },
    button: {
      marginTop: theme.spacing[4],
      alignSelf: 'center' as const,
      backgroundColor: theme.colors.primary[500],
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing[3],
      alignItems: 'center' as const,
    },
    link: {
      marginTop: theme.spacing[2],
      alignSelf: 'center' as const,
      color: theme.colors.text.tertiary,
      textDecorationLine: 'none' as const,
    },
  };
  const dispatch = useAppDispatch();
  const profileData = useAppSelector((state) => state.auth.profileData);
  const user = {
    name: profileData.displayName || t('profileSetup.noNameSet'),
    avatar: profileData.avatarUrl || '',
    label: t('profileSetup.newLearnerLabel'),
    goals: profileData.studyGoal ? [profileData.studyGoal] : [],
    freeTime: profileData.availableTimes?.join(', ') || t('profileSetup.noAvailableTimes'),
    subjects: profileData.categories?.length
      ? t('profileSetup.selectedCountSimple', { count: profileData.categories.length })
      : t('profileSetup.noSubjectsSelected'),
  };
  const handleFindBuddy = () => {
    dispatch(setProfileSetupInProgress(false));
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.navigate({ name: 'MainTabs', params: { screen: 'Buddy' } as any }),
      );
    }, NAVIGATION_DELAY_MS);
  };

  const handleExploreApp = () => {
    dispatch(setProfileSetupInProgress(false));
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.navigate({ name: 'MainTabs', params: { screen: 'Home' } as any }),
      );
    }, NAVIGATION_DELAY_MS);
  };

  return (
    <ScreenContainer>
      <ProcessHeader
        leftText={t('profileSetup.step', { current: 4 })}
        rightText={''}
        leftColor={theme.colors.primary[500]}
        rightColor={theme.colors.text.tertiary}
        leftFontSize={theme.typography.scale.sm}
        rightFontSize={theme.typography.scale.sm}
        leftFontWeight="700"
        rightFontWeight="normal"
        progress={1}
        progressBarColor={theme.colors.primary[500]}
        progressBarBgColor={theme.colors.border}
        containerStyle={styles.header}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
        {/* Completion icon */}
        <View style={{ marginTop: theme.spacing[6], marginBottom: theme.spacing[2] }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.colors.primary[100],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Ensure the check mark is centered and not clipped */}
            <Text
              style={{
                fontSize: 50,
                lineHeight: 100,
                textAlign: 'center',
                color: theme.colors.primary[500],
              }}
            >
              ✓
            </Text>
          </View>
        </View>
        {/* Title & greeting */}
        <Text
          variant="h2"
          style={{
            fontWeight: '700',
            marginBottom: theme.spacing[1],
            color: theme.colors.text.primary,
          }}
        >
          {t('profileSetup.completedTitle')}
        </Text>
        <Text
          variant="body"
          style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing[3] }}
        >
          {t('profileSetup.completedSubtitle', { name: user.name })}
        </Text>
        {/* User information card */}
        <View style={[styles.card, { width: '90%' }]}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[2] }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: 'hidden',
                marginRight: theme.spacing[2],
                backgroundColor: theme.colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: user.avatar ? 0 : 2,
                borderColor: user.avatar ? undefined : theme.colors.primary[500],
              }}
            >
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <User size={32} color={theme.colors.primary[500]} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h4" style={{ fontWeight: '700', color: theme.colors.text.primary }}>
                {user.name}
              </Text>
              <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                {user.label}
              </Text>
            </View>
          </View>
          <View style={{ marginBottom: theme.spacing[2] }}>
            <Text
              variant="caption"
              style={{ color: theme.colors.text.tertiary, marginBottom: theme.spacing[1] }}
            >
              {t('profileSetup.goalsLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[1] }}>
              {user.goals.map((goal, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: theme.colors.primary[50],
                    borderRadius: theme.radius.sm,
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: theme.spacing[1],
                    marginRight: theme.spacing[1],
                    marginBottom: theme.spacing[1],
                  }}
                >
                  <Text variant="caption" style={{ color: theme.colors.primary[500] }}>
                    {goal}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: theme.spacing[2] }}>
            <Text
              variant="caption"
              style={{ color: theme.colors.text.tertiary, marginBottom: theme.spacing[1] }}
            >
              {t('profileSetup.availableTimesLabelShort')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[1] }}>
              {Array.isArray(profileData.availableTimes) &&
              profileData.availableTimes.length > 0 ? (
                profileData.availableTimes.map((time, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: theme.colors.primary[50],
                      borderRadius: theme.radius.sm,
                      paddingHorizontal: theme.spacing[2],
                      paddingVertical: theme.spacing[1],
                      marginRight: theme.spacing[1],
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    <Text variant="caption" style={{ color: theme.colors.primary[500] }}>
                      {typeof time === 'string'
                        ? time.charAt(0).toUpperCase() + time.slice(1)
                        : time}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="body" style={{ color: theme.colors.text.primary }}>
                  {t('profileSetup.noAvailableTimes')}
                </Text>
              )}
            </View>
          </View>
          <View>
            <Text
              variant="caption"
              style={{ color: theme.colors.text.tertiary, marginBottom: theme.spacing[1] }}
            >
              {t('profileSetup.interestedSubjectsLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[1] }}>
              {Array.isArray(profileData.categories) && profileData.categories.length > 0 ? (
                profileData.categories.map((cat, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: theme.colors.primary[50],
                      borderRadius: theme.radius.sm,
                      paddingHorizontal: theme.spacing[2],
                      paddingVertical: theme.spacing[1],
                      marginRight: theme.spacing[1],
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    <Text variant="caption" style={{ color: theme.colors.primary[500] }}>
                      {typeof cat === 'string' ? cat.charAt(0).toUpperCase() + cat.slice(1) : cat}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="body" style={{ color: theme.colors.text.primary }}>
                  {t('profileSetup.noSubjectsSelected')}
                </Text>
              )}
            </View>
          </View>
        </View>
        {/* Button: Find a study buddy now */}
        <Pressable
          style={[styles.button, { width: '90%' }]}
          onPress={handleFindBuddy}
          accessibilityRole="button"
        >
          <Text variant="h4" style={{ color: theme.colors.text.inverse, fontWeight: '700' }}>
            {t('profileSetup.findBuddyButton')}
          </Text>
        </Pressable>
        {/* Link / Button: Explore the app first */}
        <Pressable
          onPress={handleExploreApp}
          accessibilityRole="button"
          accessibilityLabel={t('profileSetup.exploreAppLink', { defaultValue: 'Explore the app' })}
          style={{ alignSelf: 'center', marginTop: theme.spacing[2] }}
        >
          <Text variant="body" color="tertiary" style={styles.link}>
            {t('profileSetup.exploreAppLink')}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

export default ProfileSetupStep4Screen;
