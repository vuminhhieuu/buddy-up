import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui/Text/Text';
import { Icon, type IconName } from '../ui/Icon/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabItem = {
  key: string;
  label: string;
  icon: IconName;
  badge?: number;
};

export type BottomTabBarProps = {
  tabs: TabItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs, activeKey, onTabPress }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, theme.spacing[3]),
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -6 },
          elevation: 12,
        },
      ]}
    >
      <View style={[styles.container, { paddingHorizontal: theme.spacing[4] }]}>
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          const iconColor = isActive ? theme.colors.primary[500] : theme.colors.text.secondary;
          const textColor = isActive ? theme.colors.primary[500] : theme.colors.text.secondary;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => onTabPress(tab.key)}
              style={styles.tab}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  <Icon name={tab.icon} color={iconColor} size={theme.sizes.icon.lg} />
                  {tab.badge && tab.badge > 0 ? (
                    <View style={[styles.badge, { backgroundColor: theme.colors.semantic.error }]}>
                      <Text variant="caption" color="inverse">
                        {tab.badge > 99 ? '99+' : String(tab.badge)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  variant="caption"
                  style={[
                    styles.label,
                    {
                      color: textColor,
                      fontFamily: theme.typography.families.display,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -8,
    top: -4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});
