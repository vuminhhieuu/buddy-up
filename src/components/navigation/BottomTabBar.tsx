import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui/Text/Text';
import { Icon, type IconName } from '../ui/Icon/Icon';

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
  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing[4] }]}>
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        const iconColor = isActive ? theme.colors.text.inverse : theme.colors.text.secondary;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabPress(tab.key)}
            style={styles.tab}
          >
            {isActive ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  backgroundColor: theme.colors.primary[500],
                  paddingHorizontal: theme.spacing[4],
                  minHeight: 40,
                  borderRadius: theme.radius.base,
                }}
              >
                <Icon name={tab.icon} color={iconColor} size={theme.sizes.icon.lg} />
                <Text
                  variant="caption"
                  color="inverse"
                  style={{
                    fontFamily: theme.typography.families.display,
                    fontWeight: '600' as const,
                  }}
                >
                  {tab.label}
                </Text>
              </View>
            ) : (
              <Icon name={tab.icon} color={iconColor} size={theme.sizes.icon.lg} />
            )}
            {tab.badge && tab.badge > 0 ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.semantic.error },
                  isActive ? { right: '22%' } : { right: '28%' },
                ]}
              >
                <Text variant="caption" color="inverse">
                  {tab.badge > 99 ? '99+' : String(tab.badge)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: '28%',
    top: 4,
  },
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
});
