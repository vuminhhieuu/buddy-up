import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../styles';
import { Text } from '../../components/ui/Text/Text';
import { Button } from '../../components/ui/Button/Button';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar, Clock, Timer, Users, Link as LinkIcon, Copy, X } from 'lucide-react-native';
import {
  fetchSessionDetail,
  SessionDetail,
  updateSessionStatus,
  deleteSession,
} from '../../services/session/detail';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { useAppSelector } from '../../store/hooks';

export const SessionDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const userId = useAppSelector((s) => s.auth.userId);
  const insets = useSafeAreaInsets();

  const sessionId = (route.params as any)?.sessionId;
  const fromSuccess = (route.params as any)?.fromSuccess === true;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) {
      showErrorToast('Session ID not found');
      navigation.goBack();
      return;
    }

    setLoading(true);
    const { data, error } = await fetchSessionDetail(sessionId);
    if (error || !data) {
      showErrorToast('Failed to load session details');
      logger.error('SessionDetailScreen', 'Load error:', error);
      navigation.goBack();
      return;
    }

    setSession(data);
    setLoading(false);
  };

  const handleCopyLink = () => {
    // Copy to clipboard
    showSuccessToast('Link copied to clipboard');
  };

  const handleJoinMeeting = async () => {
    if (!session?.location) {
      showErrorToast('Không tìm thấy link cuộc họp');
      return;
    }

    try {
      let url = session.location.trim();

      // Add https:// if missing protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Check if URL can be opened
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showErrorToast('Không thể mở link cuộc họp');
        logger.error('SessionDetailScreen', 'Cannot open URL:', url);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      logger.error('SessionDetailScreen', 'Error opening meeting link:', error);
      showErrorToast('Không thể mở link cuộc họp');
    }
  };

  const handleEdit = () => {
    showSuccessToast('Edit feature coming soon');
  };

  const handleClose = () => {
    if (fromSuccess) {
      const parent = navigation.getParent?.();
      if (parent) {
        (parent as any).navigate('MainTabs', { screen: 'Home' });
      } else {
        (navigation as any).navigate('MainTabs', { screen: 'Home' });
      }
    } else {
      (navigation as any).goBack();
    }
  };

  const handleCancel = () => {
    Alert.alert('Hủy buổi học', 'Bạn có chắc chắn muốn hủy buổi học này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy buổi học',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteSession(sessionId);
          if (error) {
            showErrorToast('Không thể hủy buổi học');
            logger.error('SessionDetailScreen', 'Delete error:', error);
            return;
          }
          showSuccessToast('Đã hủy buổi học');

          // Small delay to ensure database is updated before navigating back
          setTimeout(() => {
            // Navigate to MainTabs Home to force reload
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('MainTabs', { screen: 'Home' });
            } else {
              navigation.goBack();
            }
          }, 300);
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
        <Text>Loading...</Text>
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
    durationHours > 0 ? `${durationHours} giờ ${durationMins} phút` : `${durationMinutes} phút`;

  const acceptedParticipants = session.participants.filter((p) => p.status === 'accepted');
  const invitedParticipants = session.participants.filter((p) => p.status === 'invited');
  const allParticipants = [...acceptedParticipants, ...invitedParticipants];
  const invitedCount = invitedParticipants.length;

  // Calculate actual status based on time
  const now = Date.now();
  const startTime = startDate.getTime();
  const endTime = endDate?.getTime() || startTime;

  let actualStatus: string;
  let statusBgColor: string;
  let statusTextColor: string;

  if (session.status === 'cancelled') {
    actualStatus = 'Đã hủy';
    statusBgColor = '#FFCDD2';
    statusTextColor = '#C62828';
  } else if (now >= endTime) {
    actualStatus = 'Đã kết thúc';
    statusBgColor = '#E0E0E0';
    statusTextColor = '#616161';
  } else if (now >= startTime && now < endTime) {
    actualStatus = 'Đang diễn ra';
    statusBgColor = '#FFF9C4';
    statusTextColor = '#F57F17';
  } else {
    actualStatus = 'Sắp diễn ra';
    statusBgColor = '#C8E6C9';
    statusTextColor = '#2E7D32';
  }

  // Calculate countdown
  const diffMs = startDate.getTime() - Date.now();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const countdownText = diffHours > 0 ? `${diffHours} giờ ${diffMins} phút` : `${diffMins} phút`;

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
          {/* Left spacer to keep title centered */}
          <View
            style={{
              width: 35,
              height: 35,
            }}
          />
          <Text variant="h5" style={{ fontWeight: '700', flex: 1, textAlign: 'center' }}>
            Chi tiết buổi học
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleClose}
            style={{
              width: 35,
              height: 35,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            hitSlop={8}
          >
            <X size={18} color={theme.colors.text.primary} />
          </Pressable>
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
                    {session.subject}
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
                  Ngày
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
                  Thời gian
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
                  Thời lượng
                </Text>
                <Text variant="body" style={{ fontWeight: '600', marginTop: 4 }}>
                  {durationText}
                </Text>
              </View>
            </View>

            {invitedCount > 0 && (
              <View style={[styles.infoRow, { marginTop: theme.spacing[4] }]}>
                <Users size={20} color="#F59E0B" />
                <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  <Text variant="caption" color="tertiary">
                    Còn lại
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
          </View>

          {/* Google Meet Card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.surface, marginTop: theme.spacing[4] },
            ]}
          >
            <Text variant="h6" style={{ fontWeight: '700' }}>
              Google Meet
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
                style={{
                  marginLeft: theme.spacing[2],
                  color: theme.colors.primary[500],
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {session.location}
              </Text>
              <Copy size={18} color={theme.colors.primary[500]} />
            </Pressable>

            <Button
              label="Tham gia cuộc họp"
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
              Thành viên ({allParticipants.length})
            </Text>

            {allParticipants.map((participant, index) => (
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
                      Người tạo
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
                      Đã xác nhận ✓
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
                      Đã mời
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Bottom Actions - Only show for creator and if session is scheduled */}
          {isCreator && session.status === 'scheduled' && (
            <View
              style={{
                flexDirection: 'row',
                marginTop: theme.spacing[6],
                gap: theme.spacing[3],
                paddingHorizontal: theme.spacing[5],
              }}
            >
              <Button
                label="Chỉnh sửa"
                onPress={handleEdit}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                label="Hủy buổi học"
                onPress={handleCancel}
                variant="primary"
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
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
