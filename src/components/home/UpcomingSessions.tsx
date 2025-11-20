import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Card } from '../ui';
import { Text } from '../ui/Text/Text';
import { Avatar } from '../ui';
import { Calendar, ChevronRight } from 'lucide-react-native';

export type Session = {
  id: string;
  time: string;
  buddyName: string;
  buddyAvatar?: string;
  subject: string;
  countdown: string;
};

export type UpcomingSessionsProps = {
  sessions: Session[];
  onSessionPress?: (sessionId: string) => void;
  onViewAllPress?: () => void;
};

export const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({
  sessions,
  onSessionPress,
  onViewAllPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={18} color={theme.colors.secondary[500]} strokeWidth={2} />
          <Text variant="h5" style={styles.sectionTitle}>
            Lịch học sắp tới
          </Text>
        </View>
        {onViewAllPress && (
          <Pressable
            onPress={onViewAllPress}
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả sessions"
          >
            <Text variant="bodySmall" color="info" style={styles.viewAll}>
              Xem tất cả
            </Text>
          </Pressable>
        )}
      </View>

      {/* Sessions List */}
      <View style={styles.sessionsList}>
        {sessions.map((session, index) => (
          <Pressable
            key={session.id}
            onPress={() => onSessionPress?.(session.id)}
            style={styles.sessionWrapper}
            accessibilityRole="button"
            accessibilityLabel={`Session với ${session.buddyName} lúc ${session.time}`}
          >
            <Card padding={4} elevation="sm" style={styles.sessionCard}>
              {/* Session Header */}
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
                  {session.time}
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
                    {session.countdown}
                  </Text>
                </View>
              </View>

              {/* Session Body */}
              <View style={styles.sessionBody}>
                <Avatar
                  size="md"
                  uri={session.buddyAvatar}
                  name={session.buddyName}
                  style={styles.avatar}
                />
                <View style={styles.sessionInfo}>
                  <Text variant="body" style={styles.buddyName}>
                    Học với {session.buddyName}
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
                      {session.subject}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
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
});
