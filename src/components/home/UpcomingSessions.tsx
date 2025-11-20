import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Card } from '../ui';
import { Text } from '../ui/Text/Text';
import { Avatar } from '../ui';
import { Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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

const formatTimeRange = (startIso: string, endIso: string | null | undefined, locale: string) => {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;
  const today = new Date();
  const isToday =
    start.getDate() === today.getDate() &&
    start.getMonth() === today.getMonth() &&
    start.getFullYear() === today.getFullYear();

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday && end) {
    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  }

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const dayLabel = dayFormatter.format(start);
  return `${dayLabel} - ${timeFormatter.format(start)}`;
};

const formatCountdown = (startIso: string, t: (key: string, opts?: any) => string) => {
  const diffMs = new Date(startIso).getTime() - Date.now();
  if (diffMs <= 0) return t('home.sessions.startingSoon');
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) {
    return t('home.sessions.countdownMinutes', { count: Math.max(1, minutes) });
  }
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 24) {
    return t('home.sessions.countdownHours', { count: Math.max(1, hours) });
  }
  const days = Math.round(diffMs / 86_400_000);
  return t('home.sessions.countdownDays', { count: Math.max(1, days) });
};

export const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({
  sessions,
  onSessionPress,
  onViewAllPress,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'vi';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={18} color={theme.colors.secondary[500]} strokeWidth={2} />
          <Text variant="h5" style={styles.sectionTitle}>
            {t('home.sessions.title')}
          </Text>
        </View>
        {onViewAllPress && (
          <Pressable
            onPress={onViewAllPress}
            accessibilityRole="button"
            accessibilityLabel={t('home.sessions.viewAll')}
          >
            <Text variant="bodySmall" color="info" style={styles.viewAll}>
              {t('home.sessions.viewAll')}
            </Text>
          </Pressable>
        )}
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" style={styles.emptyTitle}>
            {t('home.sessions.emptyTitle')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.emptySubtitle}>
            {t('home.sessions.emptySubtitle')}
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
              accessibilityLabel={t('home.sessions.accessibilityLabel', {
                name: session.buddyName || session.title || '',
                time: new Date(session.scheduledStart).toLocaleString(),
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
                    {formatTimeRange(session.scheduledStart, session.scheduledEnd, locale)}
                  </Text>
                  <View
                    style={[
                      styles.countdownBadge,
                      {
                        backgroundColor: theme.colors.primary[50],
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.countdownText,
                        {
                          color: theme.colors.semantic.warning,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {formatCountdown(session.scheduledStart, t)}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionBody}>
                  <Avatar
                    size="md"
                    uri={session.buddyAvatar || undefined}
                    name={session.buddyName}
                    style={styles.avatar}
                  />
                  <View style={styles.sessionInfo}>
                    <Text variant="body" style={styles.buddyName}>
                      {t('home.sessions.studyWith', {
                        name: session.buddyName || t('home.sessions.defaultBuddyName'),
                      })}
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
                        {session.subject || session.title || t('home.sessions.unknownSubject')}
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
