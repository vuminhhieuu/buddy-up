import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withRepeat,
  withTiming,
  withSpring,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Calendar, BookOpen, MessageSquare } from 'lucide-react-native';
import { Text } from '../../components/ui/Text/Text';
import { Spacer } from '../../components/ui/Spacer/Spacer';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import { HandshakeLogo } from '../../components/ui/HandshakeLogo';
import type { BuddyStackParamList } from '../../navigation/BuddyStackNavigator';
import { useAppSelector } from '../../store/hooks';
import { getCurrentUserId } from '../../utils/buddy';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import {
  calculateMatchPercentage,
  getCommonPoints,
  type UserProgress,
} from '../../utils/matchCalculation';
import { fetchBuddyProfile, fetchUserProgress } from '../../services/buddy';
import type { BuddyProfile } from '../../types/buddy';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useTheme } from '../../styles';
import { createDirectChat, sendQuickMessage } from '../../services/chat';
import { formatErrorMessage } from '../../services/helpers';
import { checkAndAwardFirstMatch } from '../../services/achievements';
import { BackButton } from '../../components/navigation/BackButton';

type NavigationProp = NativeStackNavigationProp<BuddyStackParamList, 'ConnectionSuccess'>;
type RoutePropType = RouteProp<BuddyStackParamList, 'ConnectionSuccess'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ConnectionSuccessScreen: React.FC = () => {
  const { t } = useTranslation('buddy');
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAppSelector(getCurrentUserId);
  const { sender, connection } = route.params;

  const [currentUserProfile, setCurrentUserProfile] = useState<BuddyProfile | null>(null);
  const [currentUserProgress, setCurrentUserProgress] = useState<UserProgress | null>(null);
  const [senderProgress, setSenderProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(true);
  const [headerAnimated, setHeaderAnimated] = useState(false);
  const pulse = useSharedValue(1);
  const heartScale = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      try {
        const [profile, myProgress, theirProgress] = await Promise.all([
          fetchBuddyProfile(currentUserId),
          fetchUserProgress(currentUserId),
          fetchUserProgress(sender.user_id),
        ]);
        if (!mounted) return;
        setCurrentUserProfile(profile);
        setCurrentUserProgress(myProgress);
        setSenderProgress(theirProgress);
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
  }, [currentUserId, sender.user_id]);

  // Animation sequence
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);

    // Heart icon animation
    heartScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1, { damping: 8, stiffness: 100 }),
    );

    // Pulse animation for avatars
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    );

    // Content appears after delay (no header animation to avoid safe area issues)
    setTimeout(() => {
      setHeaderAnimated(true);
    }, 1500);
  }, [heartScale, pulse]);

  const matchPercentage = useMemo(() => {
    if (!currentUserProfile || !currentUserProgress || !senderProgress) {
      return null;
    }
    return calculateMatchPercentage(
      currentUserProfile,
      sender,
      currentUserProgress,
      senderProgress,
    );
  }, [currentUserProfile, currentUserProgress, sender, senderProgress]);

  const commonPoints = useMemo(() => {
    if (!currentUserProfile || !currentUserProgress || !senderProgress) {
      return [];
    }
    return getCommonPoints(currentUserProfile, sender, currentUserProgress, senderProgress);
  }, [currentUserProfile, currentUserProgress, sender, senderProgress]);

  const quickMessageOptions = useMemo(
    () => [
      t('connectionSuccess.quickActions.templates.sayHi1', { name: sender.display_name }),
      t('connectionSuccess.quickActions.templates.sayHi2', { name: sender.display_name }),
      t('connectionSuccess.quickActions.templates.sayHi3', { name: sender.display_name }),
    ],
    [sender.display_name, t],
  );

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Removed headerStyle animation to prevent safe area issues

  useEffect(() => {
    if (!currentUserId) return;
    const award = async () => {
      const result = await checkAndAwardFirstMatch(currentUserId);
      if (result.success && result.awarded) {
        setShowAchievement(true);
      }
    };
    award();
  }, [currentUserId]);

  const ensureChat = useCallback(async () => {
    if (!currentUserId) {
      throw new Error(t('connectionSuccess.errors.missingUser'));
    }
    const response = await createDirectChat(currentUserId, sender.user_id);
    if (!response.success || !response.chat) {
      if (response.errorCode === 'PERMISSION_DENIED') {
        throw new Error(t('connectionSuccess.errors.chatPermission'));
      }
      throw new Error(response.error || t('connectionSuccess.errors.chatFailed'));
    }
    return response.chat.id;
  }, [currentUserId, sender.user_id, t]);

  const handlePrimaryAction = useCallback(async () => {
    try {
      setChatLoading(true);
      const chatId = await ensureChat();
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate(
          'Chat' as never,
          {
            screen: 'ChatRoom',
            params: {
              chatId,
              type: 'direct',
              participant: {
                name: sender.display_name,
                avatar: sender.avatar_url,
              },
            },
          } as never,
        );
      }
    } catch (error) {
      const message = formatErrorMessage(error) || t('connectionSuccess.errors.chatFailed');
      showErrorToast(message);
    } finally {
      setChatLoading(false);
    }
  }, [ensureChat, navigation, sender.avatar_url, sender.display_name, t]);

  const handleQuickMessage = useCallback(
    async (message: string) => {
      try {
        setActionLoadingKey(message);
        const chatId = await ensureChat();
        const response = await sendQuickMessage(chatId, currentUserId as string, message);
        if (!response.success) {
          if (response.errorCode === 'PERMISSION_DENIED') {
            throw new Error(t('connectionSuccess.errors.chatPermission'));
          }
          throw new Error(response.error || t('connectionSuccess.errors.chatFailed'));
        }
        showSuccessToast(t('connectionSuccess.quickActions.sent'));
      } catch (error) {
        const message = formatErrorMessage(error) || t('connectionSuccess.errors.chatFailed');
        showErrorToast(message);
      } finally {
        setActionLoadingKey(null);
      }
    },
    [ensureChat, currentUserId, t],
  );

  const handleStudySession = useCallback(() => {
    showErrorToast(t('connectionSuccess.quickActions.comingSoon'));
  }, [t]);

  const handleShareMaterial = useCallback(() => {
    showErrorToast(t('connectionSuccess.quickActions.comingSoon'));
  }, [t]);

  const handleSecondaryAction = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ flex: 1 }}>
        {confettiVisible && (
          <ConfettiCannon
            count={90}
            origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
            colors={['#58CC02', '#1CB0F6', '#FF9600']}
            fadeOut
            autoStart
            explosionSpeed={300}
            fallSpeed={2300}
            onAnimationEnd={() => setConfettiVisible(false)}
          />
        )}

        {/* Header with gradient background */}
        <View style={{ paddingTop: insets.top }}>
          <View>
            <LinearGradient
              colors={[theme.colors.primary[50], theme.colors.primary[100]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingTop: theme.spacing[4],
                paddingBottom: theme.spacing[6],
                paddingHorizontal: theme.spacing[5],
                borderBottomLeftRadius: theme.radius.xxl,
                borderBottomRightRadius: theme.radius.xxl,
              }}
            >
              <BackButton
                onPress={() => {
                  // Navigate back to main Buddy screen (reset stack to avoid loop)
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'BuddyMain' }],
                  });
                }}
                accessibilityLabel={t('requests.goBack')}
                style={{
                  position: 'absolute',
                  top: theme.spacing[4],
                  left: theme.spacing[5],
                  zIndex: 10,
                }}
              />

              <View style={{ alignItems: 'center', marginTop: theme.spacing[4] }}>
                {/* Handshake icon with overlapping avatars */}
                <Animated.View
                  style={[
                    {
                      position: 'relative',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 200,
                      height: 120,
                    },
                    heartStyle,
                  ]}
                >
                  <Animated.View style={[pulseStyle, { position: 'absolute', left: 0, zIndex: 2 }]}>
                    <Avatar
                      size="lg"
                      name={currentUserProfile?.display_name ?? t('connectionSuccess.me')}
                      uri={currentUserProfile?.avatar_url ?? undefined}
                    />
                  </Animated.View>
                  <Animated.View
                    style={[pulseStyle, { position: 'absolute', right: 0, zIndex: 2 }]}
                  >
                    <Avatar
                      size="lg"
                      name={sender.display_name}
                      uri={sender.avatar_url ?? undefined}
                    />
                  </Animated.View>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#FFD700',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#FFD700',
                      shadowOpacity: 0.4,
                      shadowRadius: 15,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 6,
                      zIndex: 3,
                      borderWidth: 3,
                      borderColor: theme.colors.primary[500],
                    }}
                  >
                    <HandshakeLogo size="large" backgroundColor={theme.colors.surface} />
                  </View>
                </Animated.View>

                <Spacer size={3} />
                <Text variant="body" color="secondary" style={{ opacity: 0.7 }}>
                  {t('connectionSuccess.headerTitle', { name: sender.display_name })}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing[5],
            paddingTop: theme.spacing[4],
            paddingBottom: insets.bottom + theme.spacing[6],
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main content - appears after header animation */}
          {headerAnimated && (
            <>
              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                style={{ alignItems: 'center' }}
              >
                <Text variant="h3" color="primary" style={{ fontWeight: '700' }}>
                  {t('connectionSuccess.title')}
                </Text>
                <Spacer size={2} />
                <Text variant="body" color="secondary">
                  {t('connectionSuccess.subtitle', { name: sender.display_name })}
                </Text>
              </Animated.View>

              <Spacer size={4} />

              {/* Match percentage badge */}
              {loading || matchPercentage === null ? (
                <ActivityIndicator />
              ) : (
                <Animated.View
                  entering={FadeInDown.delay(400).duration(500)}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      paddingHorizontal: theme.spacing[5],
                      paddingVertical: theme.spacing[3],
                      borderRadius: theme.radius.full,
                      borderWidth: 2,
                      borderColor: theme.colors.primary[500],
                      backgroundColor: '#F1FFE9',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[2],
                    }}
                  >
                    <Text variant="h5" color="primary">
                      💚
                    </Text>
                    <Text variant="h5" color="primary" style={{ fontWeight: '600' }}>
                      {t('connectionSuccess.matchBadge', { percentage: matchPercentage })}
                    </Text>
                  </View>
                </Animated.View>
              )}

              <Spacer size={5} />

              {/* Common points */}
              {loading ? (
                <ActivityIndicator />
              ) : commonPoints.length === 0 ? (
                <Animated.View entering={FadeInDown.delay(600).duration(500)}>
                  <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
                    {t('connectionSuccess.noCommonPoints')}
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInDown.delay(600).duration(500)}>
                  <Text
                    variant="h6"
                    color="primary"
                    style={{ fontWeight: '600', marginBottom: theme.spacing[3] }}
                  >
                    {t('connectionSuccess.commonPoints')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                    {commonPoints.map((point) => (
                      <View
                        key={`${point.type}-${point.value}`}
                        style={{
                          paddingHorizontal: theme.spacing[3],
                          paddingVertical: theme.spacing[2],
                          backgroundColor: theme.colors.background,
                          borderRadius: theme.radius.full,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing[2],
                        }}
                      >
                        <Text variant="body">{point.icon ?? '✨'}</Text>
                        <Text variant="body" color="primary">
                          {point.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}

              <Spacer size={6} />

              {/* Quick actions */}
              <Animated.View
                entering={FadeInDown.delay(800).duration(500)}
                style={{ position: 'relative' }}
              >
                <Text
                  variant="h6"
                  color="primary"
                  style={{ fontWeight: '600', marginBottom: theme.spacing[4] }}
                >
                  {t('connectionSuccess.quickActions.title')}
                </Text>

                {/* Say Hi card */}
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.xl,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    padding: theme.spacing[4],
                    marginBottom: theme.spacing[3],
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[2],
                      marginBottom: theme.spacing[3],
                    }}
                  >
                    <MessageSquare size={24} color={theme.colors.primary[500]} />
                    <Text variant="body" color="primary" style={{ fontWeight: '600' }}>
                      {t('connectionSuccess.quickActions.sayHi.title')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap' }}>
                    {quickMessageOptions.map((message, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleQuickMessage(message)}
                        disabled={actionLoadingKey === message}
                        style={{
                          flex: 1,
                          minWidth: '30%',
                          paddingVertical: theme.spacing[2],
                          paddingHorizontal: theme.spacing[3],
                          borderRadius: theme.radius.full,
                          borderWidth: 1,
                          borderColor: theme.colors.primary[200],
                          backgroundColor: '#E8F5E9',
                          alignItems: 'center',
                        }}
                      >
                        {actionLoadingKey === message ? (
                          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                        ) : (
                          <Text
                            variant="bodySmall"
                            color="primary"
                            style={{ textAlign: 'center', fontWeight: '500' }}
                          >
                            {message}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Achievement badge - overlaps with Say Hi card */}
                {showAchievement && (
                  <Animated.View
                    entering={FadeIn.delay(1200).duration(500)}
                    style={{
                      position: 'absolute',
                      top: theme.spacing[2],
                      right: theme.spacing[2],
                      backgroundColor: '#FFFFFF',
                      borderRadius: theme.radius.xl,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[2],
                      zIndex: 10,
                    }}
                  >
                    <Text variant="h5">🏆</Text>
                    <Text variant="bodySmall" color="primary" style={{ fontWeight: '600' }}>
                      {t('connectionSuccess.achievement.firstMatch')}
                    </Text>
                  </Animated.View>
                )}

                {/* Create study session */}
                <Pressable
                  onPress={handleStudySession}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    padding: theme.spacing[4],
                    borderRadius: theme.radius.xl,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    marginBottom: theme.spacing[3],
                  }}
                >
                  <Calendar size={24} color={theme.colors.primary[500]} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color="primary" style={{ fontWeight: '600' }}>
                      {t('connectionSuccess.quickActions.createStudySession.title')}
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      {t('connectionSuccess.quickActions.createStudySession.description')}
                    </Text>
                  </View>
                </Pressable>

                {/* Share materials */}
                <Pressable
                  onPress={handleShareMaterial}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    padding: theme.spacing[4],
                    borderRadius: theme.radius.xl,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <BookOpen size={24} color={theme.colors.primary[500]} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color="primary" style={{ fontWeight: '600' }}>
                      {t('connectionSuccess.quickActions.shareMaterial.title')}
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      {t('connectionSuccess.quickActions.shareMaterial.description')}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>

              <Spacer size={6} />

              {/* Action buttons */}
              <Animated.View entering={FadeInDown.delay(1000).duration(500)}>
                <Pressable
                  onPress={handlePrimaryAction}
                  disabled={chatLoading}
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    paddingVertical: theme.spacing[4],
                    borderRadius: theme.radius.full,
                    alignItems: 'center',
                    marginBottom: theme.spacing[3],
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                    shadowColor: theme.colors.primary[500],
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 5,
                  }}
                >
                  {chatLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MessageCircle size={20} color="#fff" />
                      <Text variant="h5" color="inverse" style={{ fontWeight: '600' }}>
                        {t('connectionSuccess.actions.chat', { name: sender.display_name })}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleSecondaryAction}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    paddingVertical: theme.spacing[4],
                    borderRadius: theme.radius.full,
                    alignItems: 'center',
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Text variant="body" color="primary" style={{ fontWeight: '500' }}>
                    {t('connectionSuccess.actions.keepDiscovering')}
                  </Text>
                </Pressable>
              </Animated.View>

              <Spacer size={6} />
            </>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};
