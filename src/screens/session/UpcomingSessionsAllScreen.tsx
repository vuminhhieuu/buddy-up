import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ScreenContainer, Spacer, Loading, Card } from '../../components/ui';
import { useTheme } from '../../styles';
import { useAppSelector } from '../../store/hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchAllUserSessionsUnfiltered, type HomeSessionFull } from '../../services/home';
import { Text } from '../../components/ui/Text/Text';
import { Avatar } from '../../components/ui';
import { formatWeekdayDate, formatStartEndTimes } from '../../utils/date';
import { BackButton } from '../../components/navigation/BackButton';
import { useTranslation } from 'react-i18next';

type SessionGroup = 'upcoming' | 'ongoing' | 'completed';

const UpcomingSessionsAllScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('session');
  const navigation = useNavigation();
  const userId = useAppSelector((s) => s.auth.userId);
  const [sessions, setSessions] = useState<HomeSessionFull[]>([]);
  const [loading, setLoading] = useState(true);

  const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const all = await fetchAllUserSessionsUnfiltered(userId);
    setSessions(all);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        void load();
      }
    }, [load, userId]),
  );

  const handleSessionPress = (sessionId: string) => {
    console.log('Session pressed:', sessionId);
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('SessionDetail', { sessionId });
    } else {
      (navigation as any).navigate('SessionDetail', { sessionId });
    }
  };

  const getStatusBadge = (s: HomeSessionFull) => {
    const start = new Date(s.scheduledStart).getTime();
    const end = s.scheduledEnd
      ? new Date(s.scheduledEnd).getTime()
      : start + DEFAULT_SESSION_DURATION_MS;
    const now = Date.now();
    const raw = s.status === 'canceled' ? 'cancelled' : s.status;
    if (raw === 'cancelled') {
      return { label: t('allSessions.statusBadge.cancelled'), bg: '#FFCDD2', fg: '#C62828' };
    }
    if (now >= end) {
      return {
        label: t('allSessions.statusBadge.completed'),
        bg: theme.colors.neutral[200],
        fg: theme.colors.neutral[600],
      };
    }
    if (now >= start && now < end) {
      return { label: t('allSessions.statusBadge.ongoing'), bg: '#FFF9C4', fg: '#F57F17' };
    }
    return { label: t('allSessions.statusBadge.upcoming'), bg: '#C8E6C9', fg: '#2E7D32' };
  };

  const categorizeSession = (s: HomeSessionFull): SessionGroup => {
    const start = new Date(s.scheduledStart).getTime();
    const end = s.scheduledEnd
      ? new Date(s.scheduledEnd).getTime()
      : start + DEFAULT_SESSION_DURATION_MS;
    const now = Date.now();

    if (s.status === 'canceled' || s.status === 'cancelled') {
      return 'completed';
    }
    if (now >= end) {
      return 'completed';
    }
    if (now >= start && now < end) {
      return 'ongoing';
    }
    return 'upcoming';
  };

  const sortedSessions = useMemo(() => {
    const ongoing: HomeSessionFull[] = [];
    const upcoming: HomeSessionFull[] = [];
    const completed: HomeSessionFull[] = [];

    sessions.forEach((session) => {
      const group = categorizeSession(session);
      if (group === 'ongoing') {
        ongoing.push(session);
      } else if (group === 'upcoming') {
        upcoming.push(session);
      } else {
        completed.push(session);
      }
    });

    ongoing.sort(
      (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime(),
    );

    upcoming.sort(
      (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime(),
    );

    completed.sort(
      (a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime(),
    );

    return [...ongoing, ...upcoming, ...completed];
  }, [sessions]);

  const renderSessionCard = (s: HomeSessionFull) => {
    const badge = getStatusBadge(s);
    return (
      <Pressable
        key={s.id}
        onPress={() => {
          handleSessionPress(s.id);
        }}
        style={styles.sessionWrapper}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        testID={`session-card-${s.id}`}
      >
        <View style={styles.sessionCard} pointerEvents="none">
          <View style={styles.sessionHeader}>
            <Text variant="body" style={styles.sessionTitle} numberOfLines={1}>
              {s.title || s.subject || t('allSessions.defaultTitle')}
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
                <View style={[styles.subjectTag, { backgroundColor: theme.colors.secondary[50] }]}>
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
        </View>
      </Pressable>
    );
  };

  if (!userId) {
    return (
      <ScreenContainer>
        <Text variant="body">{t('allSessions.notLoggedIn')}</Text>
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

  const hasAnySessions = sessions.length > 0;

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
          {t('allSessions.title')}
        </Text>
      </View>
      <Spacer size={15} />

      {!hasAnySessions ? (
        <View style={styles.emptyContainer}>
          <Text variant="body" style={styles.emptyText}>
            {t('allSessions.empty')}
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>{sortedSessions.map(renderSessionCard)}</View>
      )}
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  sessionWrapper: {
    marginBottom: 0,
  },
  sessionCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
  },
});

export default UpcomingSessionsAllScreen;
