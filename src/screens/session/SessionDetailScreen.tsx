import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../styles';
import { Text } from '../../components/ui/Text/Text';
import { Button } from '../../components/ui/Button/Button';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Calendar,
  Clock,
  Timer,
  Users,
  Link as LinkIcon,
  Copy,
  FileText,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  fetchSessionDetail,
  SessionDetail,
  updateSessionStatus,
  deleteSession,
} from '../../services/session/detail';
import { markSessionCompleted } from '../../services/session/completion';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { useAppSelector } from '../../store/hooks';
import { useInvitations } from '../../hooks/useInvitations';
import { BackButton } from '../../components/navigation/BackButton';
import { AVAILABLE_SUBJECTS } from '../../constants/subjects';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { SessionCompletionModal } from '../../components/session/SessionCompletionModal';

export const SessionDetailScreen: React.FC = () => {
  const { t } = useTranslation('session');
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const userId = useAppSelector((s) => s.auth.userId);
  const insets = useSafeAreaInsets();
  const { acceptInvitation, declineInvitation } = useInvitations();

  const sessionId = (route.params as any)?.sessionId;
  const fromSuccess = (route.params as any)?.fromSuccess === true;
  const readOnly = (route.params as any)?.readOnly === true;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session || !userId) return;

    const now = Date.now();
    const startTime = new Date(session.scheduled_start).getTime();
    const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000;
    const endTime = session.scheduled_end
      ? new Date(session.scheduled_end).getTime()
      : startTime + DEFAULT_SESSION_DURATION_MS;

    // Check if session is completed (ended)
    const isCompleted = now >= endTime && session.status !== 'cancelled';

    // Check if user has already marked this session as completed
    const userParticipant = session.participants.find((p) => p.user_id === userId);
    const alreadyMarkedComplete = userParticipant?.status === 'completed';

    if (isCompleted && !alreadyMarkedComplete) {
      const timer = setTimeout(() => {
        setShowCompletionModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [session, userId]);

  const loadSession = async () => {
    if (!sessionId) {
      showErrorToast(t('detail.toast.sessionNotFound'));
      showErrorToast(t('detail.sessionIdNotFound'));
      navigation.goBack();
      return;
    }

    setLoading(true);
    const { data, error } = await fetchSessionDetail(sessionId);
    if (error || !data) {
      showErrorToast(t('detail.toast.loadFailed'));
      showErrorToast(t('detail.loadFailed'));
      logger.error('SessionDetailScreen', 'Load error:', error);
      navigation.goBack();
      return;
    }

    setSession(data);
    setLoading(false);
  };

  const handleCopyLink = () => {
    // Copy to clipboard
    showSuccessToast(t('detail.toast.linkCopied'));
    showSuccessToast(t('detail.linkCopied'));
  };

  const handleJoinMeeting = async () => {
    if (!session?.location) {
      showErrorToast(t('detail.toast.meetingLinkNotFound'));
      showErrorToast(t('detail.meetingLinkNotFound'));
      return;
    }

    try {
      let url = session.location.trim();

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showErrorToast(t('detail.toast.cannotOpenLink'));
        showErrorToast(t('detail.cannotOpenLink'));
        logger.error('SessionDetailScreen', 'Cannot open URL:', url);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      logger.error('SessionDetailScreen', 'Error opening meeting link:', error);
      showErrorToast(t('detail.toast.cannotOpenLink'));
      showErrorToast(t('detail.cannotOpenLink'));
    }
  };

  const handleEdit = () => {
    showSuccessToast(t('detail.editComingSoon'));
  };

  const handleClose = async () => {
    if (fromSuccess) {
      const parent = navigation.getParent?.();
      if (parent) {
        parent.navigate('MainTabs', { screen: 'Home' });
      } else {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    } else {
      navigation.goBack();
    }
    setShowCompletionModal(false);
    // Refresh session after closing if needed
    try {
      await loadSession();
    } catch (e) {
      // ignore
    }
  };

  const handleMarkComplete = async (rating?: number) => {
    if (!userId) return;
    const { error } = await markSessionCompleted({ sessionId, userId, rating });

    // If the operation had a non-fatal error (e.g. missing RPC but fallback used),
    // log it for debugging but do not show an error toast to the user.
    if (error) {
      logger.warn('SessionDetailScreen', 'Mark complete encountered non-fatal error:', error);
    }

    // Close the completion modal and refresh session data in place. Do NOT
    // navigate away — the user stays on the session detail screen per request.
    showSuccessToast(t('detail.markCompleteSuccess'));
    setShowCompletionModal(false);
    try {
      await loadSession();
    } catch (e) {
      // ignore
    }
  };

  const handleCancel = () => {
    Alert.alert(t('detail.cancelConfirm.title'), t('detail.cancelConfirm.message'), [
      { text: t('detail.cancelConfirm.no'), style: 'cancel' },
      {
        text: t('detail.cancelConfirm.yes'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteSession(sessionId);
          if (error) {
            showErrorToast(t('detail.toast.cancelFailed'));
            showErrorToast(t('detail.cancelFailed'));
            logger.error('SessionDetailScreen', 'Delete error:', error);
            return;
          }
          showSuccessToast(t('detail.cancelSuccess'));
          showSuccessToast(t('detail.toast.cancelled'));

          const parent = navigation.getParent?.();
          if (parent) {
            parent.navigate('MainTabs', { screen: 'Home' });
          } else {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }
        },
      },
    ]);
  };

  if (loading || !session) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>{t('detail.loading')}</Text>
      </View>
    );
  }

  const isCreator = session.creator_id === userId;
  const startDate = new Date(session.scheduled_start);
  const endDate = session.scheduled_end ? new Date(session.scheduled_end) : null;

  const weekday = startDate.toLocaleDateString('vi-VN', { weekday: 'long' });
  const dateStr = startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
  const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  const endTimeStr = endDate
    ? `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
    : '';

  const durationMinutes = endDate
    ? Math.floor((endDate.getTime() - startDate.getTime()) / 60000)
    : 0;
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationText =
    durationHours > 0
      ? durationMins > 0
        ? `${durationHours} ${t('detail.hours')} ${durationMins} ${t('detail.minutes')}`
        : `${durationHours} ${t('detail.hours')}`
      : `${durationMinutes} ${t('detail.minutes')}`;

  const acceptedParticipants = session.participants.filter((p) => p.status === 'accepted');
  const invitedParticipants = session.participants.filter((p) => p.status === 'invited');
  const declinedParticipants = session.participants.filter((p) => p.status === 'declined');
  const allParticipants = [
    ...acceptedParticipants,
    ...invitedParticipants,
    ...declinedParticipants,
  ];

  const invitedCount = invitedParticipants.length;

  const now = Date.now();
  const startTime = startDate.getTime();
  const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000;
  const endTime = endDate?.getTime() || startTime + DEFAULT_SESSION_DURATION_MS;

  // Calculate weeks ago for completed sessions
  const getWeeksAgo = (pastTimeMs: number) => {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeks = Math.floor((now - pastTimeMs) / msPerWeek);
    // Only show "This week" for sessions completed within this week
    if (weeks === 0) return t('detail.status.thisWeek') || 'Tuần này';
    // For older sessions, don't show week text
    return null;
  };

  let actualStatus: string;
  let statusBgColor: string;
  let statusTextColor: string;

  if (session.status === 'cancelled') {
    actualStatus = t('detail.status.cancelled');
    statusBgColor = '#FFCDD2';
    statusTextColor = '#C62828';
  } else if (now >= endTime) {
    const weeksText = getWeeksAgo(endTime);
    actualStatus = weeksText
      ? `${t('detail.status.completed')} (${weeksText})`
      : t('detail.status.completed');
    statusBgColor = theme.colors.neutral[200];
    statusTextColor = theme.colors.neutral[600];
  } else if (now >= startTime && now < endTime) {
    actualStatus = t('detail.status.ongoing');
    statusBgColor = '#FFF9C4';
    statusTextColor = '#F57F17';
  } else {
    actualStatus = t('detail.status.upcoming');
    statusBgColor = '#C8E6C9';
    statusTextColor = '#2E7D32';
  }

  // Consider the session ended if the scheduled end time has passed OR the
  // session row explicitly has status 'completed'. Exclude cancelled.
  const isSessionEnded =
    (now >= endTime || session.status === 'completed') && session.status !== 'cancelled';

  // When the session has ended, show only accepted participants (attendees).
  // When the session has ended, prefer showing only accepted participants
  // (attendees). If there are no accepted participants, show only the creator
  // (host) if present. This avoids showing the full invite/invitees list
  // (invited/declined) after the session finished.
  let displayedParticipants: typeof session.participants = [];
  if (isSessionEnded) {
    if (acceptedParticipants.length > 0) {
      displayedParticipants = acceptedParticipants.slice();
      const creator = session.participants.find((p) => p.is_creator);
      if (creator && !displayedParticipants.some((p) => p.user_id === creator.user_id)) {
        displayedParticipants.unshift(creator);
      }
    } else {
      const creator = session.participants.find((p) => p.is_creator);
      if (creator) {
        displayedParticipants = [creator];
      } else {
        displayedParticipants = [];
      }
    }
  } else {
    displayedParticipants = allParticipants.slice();
  }

  const diffMs = startDate.getTime() - Date.now();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const countdownText =
    diffHours > 0
      ? diffMins > 0
        ? `${diffHours} ${t('detail.hours')} ${diffMins} ${t('detail.minutes')}`
        : `${diffHours} ${t('detail.hours')}`
      : `${diffMins} ${t('detail.minutes')}`;

  // Accept/Decline invitation logic
  const isInvited = session.participants.some(
    (p) => p.user_id === userId && p.status === 'invited',
  );

  const handleAcceptInvitation = async () => {
    setActionLoading(true);
    const ok = await acceptInvitation(sessionId);
    setActionLoading(false);
    if (ok) {
      showSuccessToast(t('detail.toast.accepted'));
      setSession({
        ...session,
        participants: session.participants.map((p) =>
          p.user_id === userId ? { ...p, status: 'accepted' } : p,
        ),
      });
      const parent = navigation.getParent?.();
      if (parent) {
        parent.navigate('MainTabs', { screen: 'Home' });
      } else {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    }
  };

  const handleDeclineInvitation = async () => {
    setActionLoading(true);
    const ok = await declineInvitation(sessionId);
    setActionLoading(false);
    if (ok) {
      showSuccessToast(t('detail.toast.declined'));
      setSession({
        ...session,
        participants: session.participants.map((p) =>
          p.user_id === userId ? { ...p, status: 'declined' } : p,
        ),
      });
      const parent = navigation.getParent?.();
      if (parent) {
        parent.navigate('MainTabs', { screen: 'Home' });
      } else {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    }
  };

  // Only show countdown if session is upcoming AND there is some remaining time (> 0 minutes)
  const isUpcoming =
    now < startTime && session.status !== 'cancelled' && (diffHours > 0 || diffMins > 0);
  const isOngoing = now >= startTime && now < endTime && session.status !== 'cancelled';
  const isCompletedLocal = now >= endTime && session.status !== 'cancelled';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Fixed Header */}
      <View
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing[5],
            paddingBottom: 12,
          }}
        >
          <BackButton onPress={handleClose} accessibilityLabel={t('back', { ns: 'common' })} />
          <Text variant="h5" style={{ fontWeight: '700', flex: 1, textAlign: 'center' }}>
            {t('detail.title')}
          </Text>
          {/* Right spacer to keep title centered */}
          <View
            style={{
              width: 44,
              height: 44,
            }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: theme.spacing[5] }}>
          {/* Main Header Card with decorative background */}
          <View
            style={[
              styles.mainCard,
              { backgroundColor: '#E8F5E9', marginTop: theme.spacing[6], overflow: 'hidden' },
            ]}
          >
            {/* Decorative circles inside card */}
            <View
              style={[
                styles.decorativeCircle,
                { top: -50, left: -50, width: 150, height: 150, backgroundColor: '#C8E6C9' },
              ]}
            />
            <View
              style={[
                styles.decorativeCircle,
                { top: 30, right: -30, width: 100, height: 100, backgroundColor: '#FFF9C4' },
              ]}
            />
            <View
              style={[
                styles.decorativeCircle,
                { bottom: -40, right: -20, width: 120, height: 120, backgroundColor: '#BBDEFB' },
              ]}
            />

            <View style={{ position: 'relative', zIndex: 1 }}>
              <Text variant="h4" style={{ fontWeight: '700' }}>
                {session.title}
              </Text>

              <View
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing[2] }}
              >
                <Text variant="body" style={{ fontSize: 16 }}>
                  🎓
                </Text>
                <Text
                  variant="body"
                  style={{ marginLeft: theme.spacing[2], color: theme.colors.text.secondary }}
                >
                  {session.creator_name}
                </Text>
              </View>

              {session.subject && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: theme.spacing[2],
                  }}
                >
                  <Text variant="body" style={{ fontSize: 16 }}>
                    📚
                  </Text>
                  <Text
                    variant="body"
                    style={{ marginLeft: theme.spacing[2], color: theme.colors.text.secondary }}
                  >
                    {t('subjectLabel')}:{' '}
                    {(() => {
                      const subj = AVAILABLE_SUBJECTS.find((s) => s.key === session.subject);
                      if (subj) {
                        const ns = (subj as any).namespace || 'common';
                        return t(subj.label, { ns });
                      }
                      return session.subject;
                    })()}
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusBgColor,
                    marginTop: theme.spacing[4],
                    alignSelf: 'flex-start',
                  },
                ]}
              >
                <Text style={{ color: statusTextColor, fontWeight: '600', fontSize: 14 }}>
                  {actualStatus}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.surface, marginTop: theme.spacing[4] },
            ]}
          >
            <View style={styles.infoRow}>
              <Calendar size={20} color={theme.colors.primary[500]} />
              <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                <Text variant="caption" color="tertiary">
                  {t('detail.date')}
                </Text>
                <Text variant="body" style={{ fontWeight: '600', marginTop: 4 }}>
                  {weekday}, {dateStr}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: theme.spacing[4] }]}>
              <Clock size={20} color={theme.colors.primary[500]} />
              <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                <Text variant="caption" color="tertiary">
                  {t('detail.time')}
                </Text>
                <Text variant="body" style={{ fontWeight: '600', marginTop: 4 }}>
                  {timeStr} - {endTimeStr}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: theme.spacing[4] }]}>
              <Timer size={20} color={theme.colors.primary[500]} />
              <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                <Text variant="caption" color="tertiary">
                  {t('detail.duration')}
                </Text>
                <Text variant="body" style={{ fontWeight: '600', marginTop: 4 }}>
                  {durationText}
                </Text>
              </View>
            </View>

            {/* Description section styled like other info rows */}
            {session.description && (
              <View style={[styles.infoRow, { marginTop: theme.spacing[4] }]}>
                {/* Use FileText icon for description */}
                <FileText size={20} color={theme.colors.primary[500]} />
                <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  <Text variant="caption" color="tertiary">
                    {t('statusLabel')}
                  </Text>
                  <Text variant="body" style={{ fontWeight: '600', marginTop: 4 }}>
                    {session.description}
                  </Text>
                </View>
              </View>
            )}

            {/* Always show countdown/remaining for upcoming sessions */}
            {isUpcoming && (
              <View style={[styles.infoRow, { marginTop: theme.spacing[4] }]}>
                <Users size={20} color="#F59E0B" />
                <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  <Text variant="caption" color="tertiary">
                    {t('detail.remaining')}
                  </Text>
                  <Text
                    variant="body"
                    style={{ fontWeight: '600', marginTop: 4, color: theme.colors.primary[500] }}
                  >
                    {countdownText}
                  </Text>
                </View>
              </View>
            )}
            {/* For ongoing/completed/cancelled, do not show countdown/remaining */}
          </View>

          {/* Google Meet Card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.surface, marginTop: theme.spacing[4] },
            ]}
          >
            <Text variant="h6" style={{ fontWeight: '700' }}>
              {t('detail.googleMeet')}
            </Text>

            <Pressable
              onPress={handleCopyLink}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F0F9FF',
                padding: theme.spacing[3],
                borderRadius: theme.radius.md,
                marginTop: theme.spacing[4],
              }}
            >
              <LinkIcon size={18} color={theme.colors.primary[500]} />
              <Text
                variant="body"
                style={{ marginLeft: theme.spacing[2], color: theme.colors.primary[500], flex: 1 }}
                numberOfLines={1}
              >
                {session.location}
              </Text>
              <Copy size={18} color={theme.colors.primary[500]} />
            </Pressable>

            <Button
              label={t('detail.joinMeeting')}
              onPress={handleJoinMeeting}
              variant="primary"
              size="lg"
              style={{ marginTop: theme.spacing[4] }}
            />
          </View>

          {/* Participants Card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.surface, marginTop: theme.spacing[4] },
            ]}
          >
            <Text variant="h6" style={{ fontWeight: '700' }}>
              {t('detail.members')} ({displayedParticipants.length})
            </Text>

            {displayedParticipants.map((participant, index) => (
              <View
                key={participant.user_id}
                style={[
                  styles.participantRow,
                  { marginTop: index === 0 ? theme.spacing[4] : theme.spacing[3] },
                ]}
              >
                <Avatar
                  uri={participant.avatar_url || undefined}
                  name={participant.display_name}
                  size="md"
                />
                <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    {participant.display_name}
                  </Text>
                  {participant.is_creator && (
                    <Text variant="caption" color="tertiary">
                      {t('detail.creator')}
                    </Text>
                  )}
                </View>
                {participant.status === 'accepted' && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: theme.colors.primary[100],
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                      },
                    ]}
                  >
                    <Text
                      style={{ color: theme.colors.primary[500], fontSize: 12, fontWeight: '600' }}
                    >
                      {t('detail.participantState.accepted')}
                    </Text>
                  </View>
                )}
                {participant.status === 'invited' && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: '#FEF3C7', paddingVertical: 4, paddingHorizontal: 12 },
                    ]}
                  >
                    <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '600' }}>
                      {t('detail.status.invited')}
                    </Text>
                  </View>
                )}
                {participant.status === 'declined' && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: '#F8BBD0', paddingVertical: 4, paddingHorizontal: 12 },
                    ]}
                  >
                    <Text style={{ color: '#C2185B', fontSize: 12, fontWeight: '600' }}>
                      {t('detail.participantState.declined')}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Bottom Actions - Accept/Decline for invited user in readOnly mode */}
          {readOnly && isInvited && (
            <View
              style={{
                flexDirection: 'row',
                marginTop: theme.spacing[6],
                gap: theme.spacing[3],
                paddingHorizontal: theme.spacing[5],
              }}
            >
              <Button
                label={t('detail.decline')}
                onPress={handleDeclineInvitation}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
                loading={actionLoading}
              />
              <Button
                label={t('detail.accept')}
                onPress={handleAcceptInvitation}
                variant="primary"
                size="lg"
                style={{ flex: 1 }}
                loading={actionLoading}
              />
            </View>
          )}
          {/* Bottom Actions - Only show for creator and if session hasn't started yet */}
          {!readOnly && isCreator && session.status !== 'cancelled' && now < startTime && (
            <View
              style={{
                flexDirection: 'row',
                marginTop: theme.spacing[6],
                gap: theme.spacing[3],
                paddingHorizontal: theme.spacing[5],
              }}
            >
              <Button
                label={t('detail.edit')}
                onPress={handleEdit}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                label={t('detail.cancel')}
                onPress={handleCancel}
                variant="primary"
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Completion Modal */}
      <SessionCompletionModal
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onMarkComplete={handleMarkComplete}
        sessionTitle={session.title || session.subject || 'Buổi học'}
        duration={durationText}
        participantCount={allParticipants.length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fixedHeader: {
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mainCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SessionDetailScreen;
