import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Icon } from '../../ui/Icon/Icon';
import { Card } from '../../ui/Card/Card';
import { Spacer } from '../../ui/Spacer/Spacer';
import type { SettingsItem } from '../../../types/profile';

export type SettingsSectionProps = {
  items: SettingsItem[];
  style?: ViewStyle;
};

export const SettingsSection: React.FC<SettingsSectionProps> = ({ items, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing[5] }, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="settings" size={20} color={theme.colors.primary[500]} />
          <Spacer size={2} horizontal />
          <Text
            variant="h4"
            style={[
              styles.title,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: theme.typography.weights.bold,
              },
            ]}
          >
            Cài đặt
          </Text>
        </View>
      </View>

      <Spacer size={4} />

      <Card padding={0} elevation="sm" style={styles.settingsMenu}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isDanger = item.variant === 'danger';

          return (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.settingsItem,
                pressed && styles.settingsItemPressed,
                !isLast && styles.settingsItemBorder,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.settingsItemLeft}>
                <View
                  style={[
                    styles.settingsIcon,
                    {
                      backgroundColor: isDanger ? '#FEE2E2' : theme.colors.neutral[200],
                      marginRight: 12,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon as any}
                    size={16}
                    color={isDanger ? theme.colors.semantic.error : theme.colors.text.secondary}
                  />
                </View>
                <Text
                  variant="body"
                  style={[
                    styles.settingsItemText,
                    isDanger && { color: theme.colors.semantic.error },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              <Icon name="chevronRight" size={14} color={theme.colors.text.tertiary} />
            </Pressable>
          );
        })}
      </Card>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  settingsMenu: {
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemPressed: {
    backgroundColor: '#FAFBFC',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
