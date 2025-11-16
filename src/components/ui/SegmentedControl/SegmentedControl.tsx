import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type SegmentedControlProps = {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radius.md,
    padding: 4,
    gap: 4,
    ...(disabled && { opacity: 0.5 }),
    ...style,
  };

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={containerStyle}
    >
      {segments.map((segment, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={index}
            accessibilityRole="radio"
            accessibilityLabel={`${segment}, ${isSelected ? 'selected' : 'not selected'}`}
            accessibilityState={{ selected: isSelected }}
            disabled={disabled}
            onPress={() => onChange(index)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: theme.spacing[3],
                paddingHorizontal: theme.spacing[2],
                borderRadius: 10,
                backgroundColor: isSelected ? theme.colors.primary[500] : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: theme.sizes.touchTarget,
              },
              pressed && !disabled && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text
              variant="bodySmall"
              color={isSelected ? 'inverse' : 'secondary'}
              style={{ fontWeight: '600' as const }}
            >
              {segment}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
