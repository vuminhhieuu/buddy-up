import React, { useMemo, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../styles';
import { Avatar } from '../ui';
import { Text } from '../ui/Text/Text';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export type HomeHeaderProps = {
  name?: string;
  avatarUrl?: string | null;
  notificationsCount?: number;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  name,
  avatarUrl,
  notificationsCount = 0,
  onNotificationPress,
  onAvatarPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');
  const [greetingKey, setGreetingKey] = useState<'morning' | 'afternoon' | 'evening'>(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  });

  const firstName = useMemo(() => {
    const trimmed = (name || '').trim();
    if (!trimmed) return t('header.defaultName');
    return trimmed.split(/\s+/)[0];
  }, [name, t]);

  useEffect(() => {
    const getKey = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'morning' as const;
      if (hour < 18) return 'afternoon' as const;
      return 'evening' as const;
    };
    const interval = setInterval(() => {
      setGreetingKey((prev) => {
        const next = getKey();
        return prev === next ? prev : next;
      });
    }, 60 * 1000);
    setGreetingKey(getKey());

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onAvatarPress}
        style={styles.leftSection}
        accessibilityRole="button"
        accessibilityLabel={t('header.openProfile')}
      >
        <Avatar size="md" name={firstName} uri={avatarUrl || undefined} />
        <View style={styles.greetingContainer}>
          <Text variant="h5" style={styles.greetingMain}>
            {t(`header.greeting.${greetingKey}`, { name: firstName })}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {t('header.subtitle')}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onNotificationPress}
        style={[
          styles.notificationButton,
          {
            backgroundColor: theme.colors.surface,
            ...theme.shadows.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('header.notifications')}
      >
        <Bell size={20} color={theme.colors.text.secondary} strokeWidth={2} />
        {notificationsCount > 0 ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.semantic.error,
                borderColor: theme.colors.surface,
              },
            ]}
          >
            <Text variant="caption" color="inverse">
              {notificationsCount > 99 ? '99+' : notificationsCount}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.dot,
              {
                backgroundColor: theme.colors.semantic.error,
                borderColor: theme.colors.surface,
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingMain: {
    marginBottom: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
