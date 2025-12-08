import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Card } from '../ui';
import { Text } from '../ui/Text/Text';
import { Avatar } from '../ui';
import { Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { formatISOToLocal, formatWeekdayDate, formatStartEndTimes } from '../../utils/date';
import { MS_PER_HOUR } from '../../constants/profile';

export type Session = {
  id: string;
  title?: string | null;
  subject?: string | null;
  scheduledStart: string;
  scheduledEnd?: string | null;
  buddyName?: string;
  buddyAvatar?: string | null;
};

export type UpcomingSessionsProps = {
  sessions: Session[];
  onSessionPress?: (sessionId: string) => void;
  onViewAllPress?: () => void;
};

const formatDateLine = (startIso: string, locale: string) => formatWeekdayDate(startIso, locale);
const formatTimesLine = (startIso: string, endIso: string | null | undefined, locale: string) =>
  formatStartEndTimes(startIso, endIso ?? null, locale);

const formatCountdown = (startIso: string, t: (key: string, opts?: any) => string) => {
  const diffMs = new Date(startIso).getTime() - Date.now();
  if (diffMs <= 0) return t('sessions.startingSoon');
  const minutes = Math.round(diffMs / (MS_PER_HOUR / 60));
  if (minutes < 60) {
    return t('sessions.countdownMinutes', { count: Math.max(1, minutes) });
  }
  const hours = Math.round(diffMs / MS_PER_HOUR);
  if (hours < 24) {
    return t('sessions.countdownHours', { count: Math.max(1, hours) });
  }
  const days = Math.round(diffMs / (MS_PER_HOUR * 24));
  return t('sessions.countdownDays', { count: Math.max(1, days) });
};

const getStatusBadge = (
  startIso: string,
  endIso: string | null | undefined,
  t: (key: string) => string,
  theme: any,
) => {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : start + MS_PER_HOUR;
  const now = Date.now();

  if (now >= end) {
    return {
      label: t('sessions.statusCompleted'),
      bg: theme.colors.neutral[200],
      fg: theme.colors.neutral[600],
    };
  }
  if (now >= start && now < end) {
    return { label: t('sessions.statusOngoing'), bg: '#FFF9C4', fg: '#F57F17' };
  }
  return { label: t('sessions.statusUpcoming'), bg: '#C8E6C9', fg: '#2E7D32' };
};

export const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({
  sessions,
  onSessionPress,
  onViewAllPress,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation('home');
  const locale = i18n.language || 'vi';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={18} color={theme.colors.secondary[500]} strokeWidth={2} />
          <Text variant="h5" style={styles.sectionTitle}>
            {t('sessions.title')}
          </Text>
        </View>
        {onViewAllPress && (
          <Pressable
            onPress={onViewAllPress}
            accessibilityRole="button"
            accessibilityLabel={t('sessions.viewAll')}
          >
            <Text variant="bodySmall" color="info" style={styles.viewAll}>
              {t('sessions.viewAll')}
            </Text>
          </Pressable>
        )}
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" style={styles.emptyTitle}>
            {t('sessions.emptyTitle')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.emptySubtitle}>
            {t('sessions.emptySubtitle')}
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>
          {sessions.map((session) => (
            <Pressable
              key={session.id}
              onPress={() => onSessionPress?.(session.id)}
              style={styles.sessionWrapper}
              accessibilityRole="button"
              accessibilityLabel={t('sessions.accessibilityLabel', {
                name: session.buddyName || session.title || '',
                time: formatISOToLocal(session.scheduledStart),
              })}
            >
              <Card padding={4} elevation="sm" style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text
                    variant="body"
                    style={[
                      styles.sessionTime,
                      {
                        fontFamily: theme.typography.families.display,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {session.title || session.subject || t('sessions.unknownSubject')}
                  </Text>
                  {(() => {
                    const badge = getStatusBadge(
                      session.scheduledStart,
                      session.scheduledEnd,
                      t,
                      theme,
                    );
                    const start = new Date(session.scheduledStart).getTime();
                    const end = session.scheduledEnd
                      ? new Date(session.scheduledEnd).getTime()
                      : start;
                    const now = Date.now();
                    // Only show countdown for upcoming sessions
                    if (now < start) {
                      return (
                        <View
                          style={[
                            styles.countdownBadge,
                            {
                              backgroundColor: badge.bg,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={[
                              styles.countdownText,
                              {
                                color: badge.fg,
                                fontWeight: '600',
                              },
                            ]}
                          >
                            {/* Show countdown for upcoming */}
                            {formatCountdown(session.scheduledStart, t)}
                          </Text>
                        </View>
                      );
                    } else {
                      // For ongoing or completed, just show the status badge
                      return (
                        <View
                          style={[
                            styles.countdownBadge,
                            {
                              backgroundColor: badge.bg,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={[
                              styles.countdownText,
                              {
                                color: badge.fg,
                                fontWeight: '600',
                              },
                            ]}
                          >
                            {badge.label}
                          </Text>
                        </View>
                      );
                    }
                  })()}
                </View>

                <View style={styles.sessionBody}>
                  <Avatar
                    size="md"
                    uri={session.buddyAvatar || undefined}
                    name={session.buddyName}
                    style={styles.avatar}
                  />
                  <View style={styles.sessionInfo}>
                    <Text variant="body" style={styles.dateLine} numberOfLines={1}>
                      {formatDateLine(session.scheduledStart, locale)}
                    </Text>
                    <Text variant="bodySmall" style={styles.timeLine} numberOfLines={1}>
                      {formatTimesLine(session.scheduledStart, session.scheduledEnd, locale)}
                    </Text>
                    <View
                      style={[
                        styles.subjectTag,
                        {
                          backgroundColor: theme.colors.secondary[50],
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.subjectText,
                          {
                            color: theme.colors.secondary[500],
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {session.subject || session.title || t('sessions.unknownSubject')}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  viewAll: {
    fontWeight: '600',
  },
  sessionsList: {
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
  sessionTime: {
    fontSize: 16,
  },
  countdownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: 12,
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
  buddyName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  subjectText: {
    fontSize: 12,
  },
  dateLine: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeLine: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
