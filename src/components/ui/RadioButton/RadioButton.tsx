import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type RadioButtonProps = {
  selected: boolean;
  onPress: () => void;
  label?: string;
  leftIcon?: React.ReactNode;
  value?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onPress,
  label,
  leftIcon,
  value,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    padding: theme.spacing[3],
    backgroundColor: selected ? theme.colors.primary[100] : theme.colors.surface,
    borderWidth: selected ? 2 : 1.5,
    borderColor: selected ? theme.colors.primary[500] : theme.colors.border,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    ...(disabled && { opacity: 0.5 }),
    ...style,
  };

  const circleStyle: ViewStyle = {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: selected ? theme.colors.primary[500] : theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const innerCircleStyle: ViewStyle = {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: selected ? theme.colors.primary[500] : 'transparent',
  };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={circleStyle}>{selected && <View style={innerCircleStyle} />}</View>
      {leftIcon && <View style={{ marginRight: theme.spacing[1] }}>{leftIcon}</View>}
      {label && (
        <Text variant="body" color="primary" style={{ fontWeight: '500' as const, flex: 1 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};
