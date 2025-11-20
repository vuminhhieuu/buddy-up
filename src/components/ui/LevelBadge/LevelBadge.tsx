import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type LevelBadgeProps = {
  level: number;
  style?: ViewStyle;
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.primary[100],
          borderColor: 'rgba(88, 204, 2, 0.2)',
        },
        style,
      ]}
    >
      <Text
        variant="bodySmall"
        style={[
          styles.text,
          {
            color: theme.colors.primary[500],
            fontFamily: theme.typography.families.display,
            fontWeight: theme.typography.weights.bold,
          },
        ]}
      >
        Level {level}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  text: {
    fontSize: 13,
  },
});
