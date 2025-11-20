import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../styles';
import { Avatar } from '../ui';
import { Text } from '../ui/Text/Text';
import { Bell } from 'lucide-react-native';
import { useAppSelector } from '../../store/hooks';

export const HomeHeader: React.FC<{
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
}> = ({ onNotificationPress, onAvatarPress }) => {
  const { theme } = useTheme();
  const userId = useAppSelector((state) => state.auth.userId);
  const displayName = useAppSelector((state) => state.auth.displayName) || 'Bạn';

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onAvatarPress}
        style={styles.leftSection}
        accessibilityRole="button"
        accessibilityLabel="Mở profile"
      >
        <Avatar size="md" name={displayName} />
        <View style={styles.greetingContainer}>
          <Text variant="h5" style={styles.greetingMain}>
            {getGreeting()}, {displayName.split(' ')[0] || displayName}! 👋
          </Text>
          <Text variant="bodySmall" color="secondary">
            Sẵn sàng học hôm nay?
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
        accessibilityLabel="Thông báo"
      >
        <Bell size={20} color={theme.colors.text.secondary} strokeWidth={2} />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.semantic.error,
              borderColor: theme.colors.surface,
            },
          ]}
        />
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
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
});
