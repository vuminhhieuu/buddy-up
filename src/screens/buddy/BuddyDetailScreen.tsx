import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  MessageCircle,
  Target,
  Star,
  MapPin,
  Award,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Flame,
  Sparkles,
  Sun,
  SunMedium,
  Moon,
  ArrowRight,
  X,
  Check,
} from 'lucide-react-native';
import { Text } from '../../components/ui/Text/Text';
import { Spacer } from '../../components/ui/Spacer/Spacer';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import type { BuddyStackParamList } from '../../navigation/BuddyStackNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getCurrentUserId } from '../../utils/buddy';
import { fetchBuddyProfile, fetchUserProgress, getConnectionStatus } from '../../services/buddy';
import { fetchProfileOverview } from '../../services/profile/overview';
import { fetchStudyStats } from '../../services/profile/stats';
import {
  saveProfileAsync,
  unsaveProfileAsync,
  fetchSavedProfileIdsAsync,
} from '../../store/slices/buddySlice';
import {
  calculateMatchPercentage,
  getCommonPoints,
  type UserProgress,
} from '../../utils/matchCalculation';
import {
  getAvailableTimeLucideIcon,
  getAvailableTimeText,
  getLearningStyleText,
  formatLocationAge,
  mapInterestToLabel,
} from '../../utils/buddy';
import type { BuddyProfile } from '../../types/buddy';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toast';
import { useTheme } from '../../styles';
import { sendBuddyRequestAsync } from '../../store/slices/buddySlice';
import { formatErrorMessage } from '../../services/helpers';
import { BackButton } from '../../components/navigation/BackButton';

type NavigationProp = NativeStackNavigationProp<BuddyStackParamList, 'BuddyDetail'>;
type RoutePropType = RouteProp<BuddyStackParamList, 'BuddyDetail'>;

interface BuddyDetailData {
  profile: BuddyProfile;
  progress: UserProgress | null;
  overview: {
    streak: number;
    xp: number;
    totalTime: number;
  };
  stats: {
    completedSessions: number;
  };
}

export const BuddyDetailScreen: React.FC = () => {
  const { t } = useTranslation('buddy');
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(getCurrentUserId);
  const { savedProfileIds, savingProfileIds } = useAppSelector((state) => state.buddy);
  const { userId } = route.params;

  const [data, setData] = useState<BuddyDetailData | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<BuddyProfile | null>(null);
  const [currentUserProgress, setCurrentUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    'pending' | 'accepted' | 'blocked' | 'rejected' | null
  >(null);
  const [requestPending, setRequestPending] = useState(false);

  const isSaved = savedProfileIds.includes(userId);
  const isSaving = savingProfileIds[userId] || false;

  // Fetch profile data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!currentUserId || !userId) {
        setLoading(false);
        return;
      }

      try {
        const [buddyProfile, myProfile, myProgress, theirProgress, statusResult, overview, stats] =
          await Promise.all([
            fetchBuddyProfile(userId),
            fetchBuddyProfile(currentUserId),
            fetchUserProgress(currentUserId),
            fetchUserProgress(userId),
            getConnectionStatus(currentUserId, userId),
            fetchProfileOverview(userId),
            fetchStudyStats(userId),
          ]);

        if (!mounted) return;

        if (buddyProfile && theirProgress) {
          setData({
            profile: buddyProfile,
            progress: theirProgress,
            overview: {
              streak: overview.streak,
              xp: overview.xp,
              totalTime: overview.totalTime,
            },
            stats: {
              completedSessions: stats.completedSessions,
            },
          });
        }
        setCurrentUserProfile(myProfile);
        setCurrentUserProgress(myProgress);
        setConnectionStatus(statusResult.exists ? statusResult.status : null);
      } catch (error) {
        showErrorToast(formatErrorMessage(error) || t('detail.loadError'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [currentUserId, userId, t]);

  // Fetch saved profiles on mount
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchSavedProfileIdsAsync(currentUserId));
    }
  }, [currentUserId, dispatch]);

  const handleToggleSave = useCallback(() => {
    if (!currentUserId || isSaving) return;

    if (isSaved) {
      dispatch(unsaveProfileAsync({ userId: currentUserId, savedUserId: userId }));
      showInfoToast(t('toast.unsaved'));
    } else {
      dispatch(saveProfileAsync({ userId: currentUserId, savedUserId: userId }));
      showSuccessToast(t('toast.saved'));
    }
  }, [currentUserId, userId, isSaved, isSaving, dispatch, t]);

  const handleConnect = useCallback(async () => {
    if (!currentUserId || !data || requestPending) return;

    if (connectionStatus === 'accepted') {
      showInfoToast(t('detail.alreadyConnected'));
      return;
    }

    if (connectionStatus === 'pending') {
      showInfoToast(t('detail.requestPending'));
      return;
    }

    try {
      setRequestPending(true);
      await dispatch(
        sendBuddyRequestAsync({
          targetUserId: userId,
        }),
      ).unwrap();
      setConnectionStatus('pending');
      showSuccessToast(t('request.sentSuccess'));
    } catch (error) {
      showErrorToast(formatErrorMessage(error) || t('request.sentError'));
    } finally {
      setRequestPending(false);
    }
  }, [currentUserId, userId, data, connectionStatus, requestPending, dispatch, t]);

  const handleSkip = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Spacer size={4} />
        <Text variant="body" color="secondary">
          {t('detail.loading')}
        </Text>
      </View>
    );
  }

  if (!data || !data.profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing[6],
        }}
      >
        <Text variant="h3" color="error">
          {t('detail.notFound')}
        </Text>
        <Spacer size={4} />
        <Button
          onPress={() => navigation.goBack()}
          variant="primary"
          label={t('common.back', { ns: 'common' })}
        />
      </View>
    );
  }

  const { profile, overview, stats } = data;

  // Calculate match percentage
  const matchPercentage =
    currentUserProfile && profile
      ? calculateMatchPercentage(
          currentUserProfile,
          profile,
          currentUserProgress || undefined,
          data.progress || undefined,
        )
      : null;

  // Calculate schedule overlap (simplified - count common available times)
  const scheduleOverlap =
    currentUserProfile && profile
      ? currentUserProfile.available_times.filter((time) => profile.available_times.includes(time))
          .length
      : 0;

  const hasInterests = profile.learning_interests.length > 0 || profile.interests.length > 0;
  const hasTimes = profile.available_times.length > 0;
  const hasGoals = profile.learning_goals.length > 0;
  const mainGoal = profile.main_learning_goal || profile.learning_goals[0] || null;

  const hasAvatar = profile.avatar_url && profile.avatar_url.startsWith('http');

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Fixed Back Button - Always on top */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing[2],
            left: theme.spacing[4],
            zIndex: 100,
          }}
        >
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing[4] }}
          style={{ flex: 1 }}
        >
          {/* Profile Header with Avatar Background - Full Width, Extended */}
          <ImageBackground
            source={hasAvatar ? { uri: profile.avatar_url } : undefined}
            style={{
              minHeight: 280,
              paddingTop: insets.top + theme.spacing[16],
              paddingBottom: theme.spacing[16],
              paddingHorizontal: theme.spacing[4],
              justifyContent: 'flex-end',
            }}
            imageStyle={{
              resizeMode: 'cover',
            }}
          >
            {/* Overlay for better text readability */}
            {hasAvatar && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                }}
              />
            )}

            {/* Fallback gradient if no avatar */}
            {!hasAvatar && (
              <LinearGradient
                colors={[
                  theme.colors.primary[300],
                  theme.colors.primary[200],
                  theme.colors.primary[100],
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            )}

            {/* Name and Info - Bottom left */}
            <View
              style={{
                alignItems: 'flex-start',
                gap: theme.spacing[1],
              }}
            >
              {/* Name with Verification Badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                }}
              >
                <Text
                  variant="h2"
                  style={{
                    fontFamily: theme.typography.families.display,
                    fontWeight: '700' as const,
                    color: hasAvatar ? theme.colors.text.inverse : theme.colors.text.primary,
                  }}
                >
                  {profile.display_name}
                </Text>
                {profile.is_verified && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[1],
                      paddingHorizontal: theme.spacing[2],
                      paddingVertical: theme.spacing[1],
                      backgroundColor: theme.colors.secondary[400],
                      borderRadius: theme.radius.full,
                    }}
                  >
                    <CheckCircle2
                      size={14}
                      color={theme.colors.text.inverse}
                      fill={theme.colors.text.inverse}
                    />
                    <Text variant="caption" color="inverse" style={{ fontWeight: '600' as const }}>
                      {t('detail.verified')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Location, Age, Distance */}
              {(profile.age || profile.location) && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[1],
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                  }}
                >
                  {profile.location && (
                    <MapPin
                      size={14}
                      color={hasAvatar ? theme.colors.text.inverse : theme.colors.semantic.error}
                    />
                  )}
                  {profile.age && (
                    <Text
                      variant="bodySmall"
                      style={{
                        fontWeight: '500' as const,
                        color: hasAvatar ? theme.colors.text.inverse : theme.colors.text.secondary,
                      }}
                    >
                      {profile.age} {t('detail.yearsOld')}
                    </Text>
                  )}
                  {profile.age && profile.location && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: hasAvatar ? theme.colors.text.inverse : theme.colors.text.secondary,
                      }}
                    >
                      •
                    </Text>
                  )}
                  {profile.location && (
                    <Text
                      variant="bodySmall"
                      style={{
                        fontWeight: '500' as const,
                        color: hasAvatar ? theme.colors.text.inverse : theme.colors.text.secondary,
                      }}
                    >
                      {profile.location}
                    </Text>
                  )}
                </View>
              )}

              {/* Online Status */}
              {profile.is_online && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.colors.semantic.success,
                    }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      fontWeight: '500' as const,
                      color: hasAvatar ? theme.colors.text.inverse : theme.colors.text.secondary,
                    }}
                  >
                    {t('detail.online')} {t('detail.minutesAgo', { minutes: 5 })}
                  </Text>
                </View>
              )}
            </View>
          </ImageBackground>

          {/* Match Percentage Banner - Below avatar, above bio */}
          {matchPercentage !== null && (
            <View
              style={{
                backgroundColor: theme.colors.primary[500],
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[4],
                marginHorizontal: theme.spacing[4],
                marginTop: -theme.spacing[4],
                marginBottom: theme.spacing[4],
                borderRadius: theme.radius.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing[2],
                }}
              >
                <Heart
                  size={18}
                  color={theme.colors.text.inverse}
                  fill={theme.colors.text.inverse}
                />
                <Text variant="body" color="inverse" style={{ fontWeight: '700' as const }}>
                  {t('detail.matchPercentage', { percentage: matchPercentage })}
                </Text>
              </View>
            </View>
          )}

          {/* Bio Section - No Card, Simple Text */}
          {profile.bio && (
            <View
              style={{
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[4],
                marginBottom: theme.spacing[2],
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.colors.secondary[100],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12 }}>👤</Text>
                </View>
                <Text
                  variant="body"
                  color="primary"
                  style={{ fontWeight: '700' as const, textTransform: 'uppercase' }}
                >
                  {t('card.bio')}
                </Text>
              </View>
              <Text variant="body" color="secondary" style={{ lineHeight: 22 }}>
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Main Goal with Progress */}
          {mainGoal && (
            <Card
              padding={4}
              style={{ marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}
              >
                <Target size={20} color={theme.colors.primary[500]} />
                <Text
                  variant="body"
                  color="primary"
                  style={{ fontWeight: '700' as const, flex: 1 }}
                >
                  {t('detail.mainGoal')}
                </Text>
              </View>
              <Text variant="body" color="primary" style={{ marginBottom: theme.spacing[2] }}>
                {mainGoal}
              </Text>
              {/* Progress bar placeholder - can be enhanced with actual progress data */}
              <View
                style={{
                  height: 8,
                  backgroundColor: theme.colors.primary[100],
                  borderRadius: theme.radius.full,
                  overflow: 'hidden',
                  marginBottom: theme.spacing[1],
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: '60%',
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: theme.radius.full,
                  }}
                />
              </View>
              <Text variant="caption" color="tertiary">
                {t('detail.goalProgress')}
              </Text>
            </Card>
          )}

          {/* Learning Interests */}
          {hasInterests && (
            <Card
              padding={4}
              style={{ marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}
              >
                <BookOpen size={20} color={theme.colors.primary[500]} />
                <Text
                  variant="body"
                  color="primary"
                  style={{ fontWeight: '700' as const, textTransform: 'uppercase' }}
                >
                  {t('card.learningInterests')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                {(profile.learning_interests.length > 0
                  ? profile.learning_interests
                  : profile.interests
                ).map((interest, index) => (
                  <View
                    key={`interest-${interest}-${index}`}
                    style={{
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[1],
                      backgroundColor: theme.colors.secondary[50],
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.secondary[200],
                    }}
                  >
                    <Text variant="bodySmall" color="info" style={{ fontWeight: '600' as const }}>
                      {mapInterestToLabel(interest)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Learning Style */}
          {profile.learning_style && (
            <Card
              padding={4}
              style={{ marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}
              >
                <BookOpen size={20} color={theme.colors.primary[500]} />
                <Text
                  variant="body"
                  color="primary"
                  style={{ fontWeight: '700' as const, textTransform: 'uppercase' }}
                >
                  {t('card.learningStyleTitle')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[1],
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[1],
                    backgroundColor: theme.colors.semantic.warning + '20',
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.semantic.warning + '40',
                  }}
                >
                  <Star
                    size={16}
                    color={theme.colors.semantic.warning}
                    fill={theme.colors.semantic.warning}
                  />
                  <Text variant="bodySmall" color="warning" style={{ fontWeight: '600' as const }}>
                    {getLearningStyleText(profile.learning_style)}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Available Times Schedule Grid */}
          {hasTimes && (
            <Card
              padding={4}
              style={{ marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[3],
                }}
              >
                <Calendar size={20} color={theme.colors.primary[500]} />
                <Text
                  variant="body"
                  color="primary"
                  style={{ fontWeight: '700' as const, textTransform: 'uppercase' }}
                >
                  {t('detail.availableSchedule')}
                </Text>
              </View>
              {/* Days of week header */}
              <View style={{ flexDirection: 'row', marginBottom: theme.spacing[2] }}>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => (
                  <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                    <Text variant="caption" color="tertiary" style={{ fontWeight: '600' as const }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
              {/* Time slots grid */}
              {[
                { label: t('detail.morning'), icon: Sun, times: ['morning'] },
                { label: t('detail.afternoon'), icon: SunMedium, times: ['afternoon'] },
                { label: t('detail.evening'), icon: Moon, times: ['evening', 'late_night'] },
              ].map((slot, slotIndex) => {
                const SlotIcon = slot.icon;
                return (
                  <View
                    key={slotIndex}
                    style={{ flexDirection: 'row', marginBottom: theme.spacing[1] }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const isWeekend = dayIndex >= 5;
                      const isAvailable =
                        profile.available_times.some((time) => slot.times.includes(time)) ||
                        (isWeekend && profile.available_times.includes('weekend')) ||
                        profile.available_times.includes('flexible');
                      return (
                        <View
                          key={dayIndex}
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: theme.spacing[1],
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: theme.radius.sm,
                              backgroundColor: isAvailable
                                ? theme.colors.primary[100]
                                : theme.colors.background,
                              borderWidth: isAvailable ? 2 : 1,
                              borderColor: isAvailable
                                ? theme.colors.primary[500]
                                : theme.colors.border,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <SlotIcon
                              size={16}
                              color={
                                isAvailable ? theme.colors.primary[500] : theme.colors.text.tertiary
                              }
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </Card>
          )}

          {/* Statistics */}
          <Card
            padding={4}
            style={{ marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
                marginBottom: theme.spacing[3],
              }}
            >
              <Award size={20} color={theme.colors.primary[500]} />
              <Text
                variant="body"
                color="primary"
                style={{ fontWeight: '700' as const, textTransform: 'uppercase' }}
              >
                {t('detail.statistics')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3] }}>
              {/* Streak */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  padding: theme.spacing[3],
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <Flame
                  size={24}
                  color={theme.colors.semantic.warning}
                  fill={theme.colors.semantic.warning}
                />
                <Spacer size={2} />
                <Text variant="h3" color="primary" style={{ fontWeight: '700' as const }}>
                  {overview.streak} {t('detail.days')}
                </Text>
                <Text variant="caption" color="tertiary">
                  {t('detail.currentStreak')}
                </Text>
              </View>

              {/* XP */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  padding: theme.spacing[3],
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <Star
                  size={24}
                  color={theme.colors.semantic.warning}
                  fill={theme.colors.semantic.warning}
                />
                <Spacer size={2} />
                <Text variant="h3" color="primary" style={{ fontWeight: '700' as const }}>
                  {overview.xp} XP
                </Text>
                <Text variant="caption" color="tertiary">
                  {t('detail.bonusPoints')}
                </Text>
              </View>

              {/* Total Hours */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  padding: theme.spacing[3],
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <BookOpen size={24} color={theme.colors.primary[500]} />
                <Spacer size={2} />
                <Text variant="h3" color="primary" style={{ fontWeight: '700' as const }}>
                  {Math.round(overview.totalTime)} {t('detail.hours')}
                </Text>
                <Text variant="caption" color="tertiary">
                  {t('detail.totalStudyHours')}
                </Text>
              </View>

              {/* Completed Sessions */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  padding: theme.spacing[3],
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <CheckCircle2 size={24} color={theme.colors.semantic.success} />
                <Spacer size={2} />
                <Text variant="h3" color="primary" style={{ fontWeight: '700' as const }}>
                  {stats.completedSessions} {t('detail.sessions')}
                </Text>
                <Text variant="caption" color="tertiary">
                  {t('detail.completed')}
                </Text>
              </View>
            </View>
          </Card>

          {/* Reviews Section */}
          <Card
            padding={4}
            style={{ marginHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing[3],
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                <Star
                  size={20}
                  color={theme.colors.semantic.warning}
                  fill={theme.colors.semantic.warning}
                />
                <Text
                  variant="body"
                  color="primary"
                  style={{ fontWeight: '700' as const, textTransform: 'uppercase' }}
                >
                  {t('detail.reviews', { count: 5 })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                <Text variant="h3" color="primary" style={{ fontWeight: '700' as const }}>
                  4.8
                </Text>
                <Star
                  size={18}
                  color={theme.colors.semantic.warning}
                  fill={theme.colors.semantic.warning}
                />
              </View>
            </View>

            {/* Mock Reviews */}
            {[
              {
                name: 'Minh Đ.',
                avatar: 'M',
                rating: 5,
                text: 'Bạn học rất tốt, đúng giờ và nhiệt tình. Rất recommend!',
                timeAgo: t('detail.twoWeeksAgo'),
              },
              {
                name: 'Hương N.',
                avatar: 'H',
                rating: 5,
                text: 'Linh rất tận tâm trong việc học, có nhiều tài liệu hay. Học cùng Linh mình tiến bộ rất nhiều!',
                timeAgo: t('detail.oneMonthAgo'),
              },
              {
                name: 'Tuấn P.',
                avatar: 'T',
                rating: 5,
                text: 'Bạn học chăm chỉ và có kế hoạch rõ ràng. Phù hợp với người muốn học nghiêm túc.',
                timeAgo: t('detail.oneMonthAgo'),
              },
            ].map((review, index) => (
              <View
                key={index}
                style={{
                  padding: theme.spacing[3],
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  marginBottom: theme.spacing[2],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    gap: theme.spacing[2],
                    marginBottom: theme.spacing[2],
                  }}
                >
                  <Avatar size="sm" name={review.avatar} />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: theme.spacing[1],
                      }}
                    >
                      <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                        {review.name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            color={theme.colors.semantic.warning}
                            fill={theme.colors.semantic.warning}
                          />
                        ))}
                      </View>
                    </View>
                    <Text variant="caption" color="tertiary">
                      {review.timeAgo}
                    </Text>
                  </View>
                </View>
                <Text variant="bodySmall" color="secondary" style={{ lineHeight: 20 }}>
                  {review.text}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => {
                // TODO: Navigate to full reviews screen
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing[1],
                marginTop: theme.spacing[2],
              }}
            >
              <Text variant="bodySmall" color="info" style={{ fontWeight: '600' as const }}>
                {t('detail.viewAllReviews', { count: 5 })}
              </Text>
              <ArrowRight size={16} color={theme.colors.secondary[500]} />
            </Pressable>
          </Card>
        </ScrollView>

        {/* Fixed Action Buttons at Bottom */}
        <View
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[3],
            paddingBottom: insets.bottom + theme.spacing[3],
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: theme.colors.semantic.error,
                  borderRadius: theme.radius.base,
                  paddingVertical: theme.spacing[3],
                  paddingHorizontal: theme.spacing[4],
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing[2],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <X size={20} color={theme.colors.text.inverse} />
              <Text variant="body" color="inverse" style={{ fontWeight: '600' as const }}>
                {t('detail.skip')}
              </Text>
            </Pressable>
            {connectionStatus === 'accepted' ? (
              <Pressable
                onPress={() => {
                  // Navigate to chat
                  navigation.navigate('BuddyMain');
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: theme.radius.base,
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[4],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <MessageCircle size={20} color={theme.colors.text.inverse} />
                <Text variant="body" color="inverse" style={{ fontWeight: '600' as const }}>
                  {t('detail.sendMessage')}
                </Text>
              </Pressable>
            ) : connectionStatus === 'pending' ? (
              <Button
                variant="secondary"
                disabled
                label={t('detail.requestPending')}
                onPress={() => {}}
                style={{ flex: 1 }}
              />
            ) : (
              <Pressable
                onPress={handleConnect}
                disabled={requestPending}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: theme.radius.base,
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[4],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                    opacity: pressed || requestPending ? 0.9 : 1,
                  },
                ]}
              >
                {requestPending ? (
                  <ActivityIndicator color={theme.colors.text.inverse} />
                ) : (
                  <>
                    <Check size={20} color={theme.colors.text.inverse} />
                    <Text variant="body" color="inverse" style={{ fontWeight: '600' as const }}>
                      {t('detail.sendInvitation')}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};
