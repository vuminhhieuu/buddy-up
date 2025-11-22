import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type BuddyToastType = 'success' | 'error' | 'info';

export type BuddyToastProps = {
  type?: BuddyToastType;
  title: string;
  description?: string;
};

// Toast configuration constants
const TOAST_CONFIG = {
  success: {
    icon: '💚',
    borderColor: '#58CC02',
    backgroundColor: '#E8F5E9',
  },
  error: {
    icon: '⚠️',
    borderColor: '#FF3B30',
    backgroundColor: '#FFEAEA',
  },
  info: {
    icon: '💡',
    borderColor: '#1CB0F6',
    backgroundColor: '#E3F3FF',
  },
} as const;

export const BuddyToast: React.FC<BuddyToastProps> = ({ type = 'info', title, description }) => {
  const { theme } = useTheme();
  const config = TOAST_CONFIG[type];

  return (
    <View
      style={[
        styles.container,
        {
          borderLeftColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          shadowColor: theme.dark ? '#000' : '#2E2E2E',
        },
      ]}
    >
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" style={styles.title} color="primary">
          {title}
        </Text>
        {description ? (
          <Text variant="bodySmall" color="secondary">
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderLeftWidth: 4,
    minWidth: 280,
    maxWidth: 360,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
});
