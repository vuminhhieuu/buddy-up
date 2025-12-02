import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ScreenContainer, Spacer, Loading, Card } from '../../components/ui';
import { useTheme } from '../../styles';
import { useAppSelector } from '../../store/hooks';
import { useNavigation } from '@react-navigation/native';
import { fetchAllSessionsForUser, type HomeSessionFull } from '../../services/home';
import { Text } from '../../components/ui/Text/Text';
import { Avatar } from '../../components/ui';
import { formatWeekdayDate, formatStartEndTimes } from '../../utils/date';
import { BackButton } from '../../components/navigation/BackButton';

const UpcomingSessionsAllScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const userId = useAppSelector((s) => s.auth.userId);
  const [sessions, setSessions] = useState<HomeSessionFull[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const all = await fetchAllSessionsForUser(userId);
    setSessions(all);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSessionPress = (sessionId: string) => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('SessionDetail', { sessionId });
    }
  };

  const getStatusBadge = (s: HomeSessionFull) => {
    const start = new Date(s.scheduledStart).getTime();
    const end = s.scheduledEnd ? new Date(s.scheduledEnd).getTime() : start;
    const now = Date.now();
    const raw = s.status === 'canceled' ? 'cancelled' : s.status;
    if (raw === 'cancelled') {
      return { label: 'Đã hủy', bg: '#FFCDD2', fg: '#C62828' };
    }
    if (now >= end) {
      return { label: 'Đã kết thúc', bg: '#E0E0E0', fg: '#616161' };
    }
    if (now >= start && now < end) {
      return { label: 'Đang diễn ra', bg: '#FFF9C4', fg: '#F57F17' };
    }
    return { label: 'Sắp diễn ra', bg: '#C8E6C9', fg: '#2E7D32' };
  };

  if (!userId) {
    return (
      <ScreenContainer>
        <Text variant="body">Bạn chưa đăng nhập</Text>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Loading fullScreen />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll contentContainerStyle={styles.scrollContent}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 }}
      >
        <BackButton
          onPress={() => (navigation as any).goBack()}
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
        />
        <Text variant="h5" style={{ fontWeight: '700', marginLeft: theme.spacing[3] }}>
          Lịch học sắp tới
        </Text>
      </View>
      <Spacer size={3} />
      <View style={styles.sessionsList}>
        {sessions.map((s) => {
          const badge = getStatusBadge(s);
          return (
            <Pressable
              key={s.id}
              onPress={() => handleSessionPress(s.id)}
              style={styles.sessionWrapper}
            >
              <Card padding={4} elevation="sm" style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text variant="body" style={styles.sessionTitle} numberOfLines={1}>
                    {s.title || s.subject || 'Buổi học'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text variant="caption" style={{ color: badge.fg, fontWeight: '600' }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionBody}>
                  <Avatar
                    size="md"
                    uri={s.buddyAvatar || undefined}
                    name={s.buddyName}
                    style={styles.avatar}
                  />
                  <View style={styles.sessionInfo}>
                    <Text variant="body" style={styles.dateLine} numberOfLines={1}>
                      {formatWeekdayDate(s.scheduledStart, 'vi')}
                    </Text>
                    <Text variant="bodySmall" style={styles.timeLine} numberOfLines={1}>
                      {formatStartEndTimes(s.scheduledStart, s.scheduledEnd ?? null, 'vi')}
                    </Text>
                    {s.subject ? (
                      <View
                        style={[styles.subjectTag, { backgroundColor: theme.colors.secondary[50] }]}
                      >
                        <Text
                          variant="caption"
                          style={{ color: theme.colors.secondary[500], fontWeight: '600' }}
                        >
                          {s.subject}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  sessionsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sessionWrapper: {
    marginBottom: 0,
  },
  sessionCard: {
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    flexShrink: 0,
  },
  sessionInfo: {
    flex: 1,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  dateLine: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeLine: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default UpcomingSessionsAllScreen;
