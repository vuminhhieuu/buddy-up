import React from 'react';
import { View, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Card, Avatar, Text } from '../ui';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../styles/tokens';
import { formatWeekdayDate, formatStartEndTimes } from '../../utils/date';
import type { HomeSession, HomeSessionFull } from '../../services/home';
import { AVAILABLE_SUBJECTS } from '../../constants/subjects';

const theme = {
  primary: COLORS.primary[500],
  secondary: COLORS.secondary[500],
  surface: '#FFFFFF',
  border: COLORS.neutral[300],
  textPrimary: COLORS.neutral[900],
  textSecondary: COLORS.neutral[600],
  textInverse: '#FFFFFF',
};

type SessionCardProps = {
  session: HomeSession | HomeSessionFull;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const SessionCard: React.FC<SessionCardProps> = ({ session, onPress, style }) => {
  const { t, i18n } = useTranslation(['common', 'session']);
  const start = new Date(session.scheduledStart).getTime();
  const end = session.scheduledEnd ? new Date(session.scheduledEnd).getTime() : start;
  const now = Date.now();
  if (__DEV__) {
    console.log('[SessionCard]', {
      title: session.title || session.subject,
      scheduledStart: session.scheduledStart,
      scheduledEnd: session.scheduledEnd,
      start,
      end,
      now,
      nowISO: new Date(now).toISOString(),
      status: (session as any).status,
    });
  }
  let badge = { label: '', bg: '', fg: '' };
  if (now >= end) {
    badge = {
      label: t('detail.status.completed', { ns: 'session' }),
      bg: '#E0E0E0',
      fg: '#616161',
    };
  } else if (now >= start && now < end) {
    badge = {
      label: t('detail.status.ongoing', { ns: 'session' }),
      bg: '#FFF9C4',
      fg: '#F57F17',
    };
  } else {
    badge = {
      label: t('detail.status.upcoming', { ns: 'session' }),
      bg: '#C8E6C9',
      fg: '#2E7D32',
    };
  }
  return (
    <Pressable onPress={onPress} style={style}>
      <Card padding={4} elevation="sm" style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text variant="body" style={styles.sessionTitle} numberOfLines={1}>
            {session.title || session.subject || t('session.defaultTitle', { ns: 'common' })}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text variant="caption" style={{ color: badge.fg }}>
              {badge.label}
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
            <Text variant="bodySmall" style={styles.dateLine} numberOfLines={1}>
              {formatWeekdayDate(session.scheduledStart, i18n.language)}
            </Text>
            <Text variant="bodySmall" style={styles.timeLine} numberOfLines={1}>
              {formatStartEndTimes(
                session.scheduledStart,
                session.scheduledEnd ?? null,
                i18n.language,
              )}
            </Text>
            {session.subject ? (
              <View style={styles.subjectTag}>
                <Text variant="caption" style={{ color: COLORS.secondary[500] }}>
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
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16, // match CreateSessionScreen/Card
    padding: 16, // match CreateSessionScreen/Card
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    color: theme.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: COLORS.neutral[100],
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  dateLine: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  timeLine: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: COLORS.secondary[50],
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
