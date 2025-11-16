import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type ChipVariant = 'default' | 'selected';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: ChipVariant;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  variant = 'default',
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const isSelected = variant === 'selected' || selected;
  const isDisabled = disabled || !onPress;

  const containerStyle: ViewStyle = {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    minHeight: theme.sizes.touchTarget,
    ...(isSelected
      ? {
          backgroundColor: theme.colors.primary[500],
          borderColor: theme.colors.primary[500],
        }
      : {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }),
    ...(isDisabled && { opacity: 0.5 }),
    ...style,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !isDisabled && { opacity: 0.8, transform: [{ scale: 0.95 }] },
      ]}
    >
      <Text
        variant="bodySmall"
        color={isSelected ? 'inverse' : 'secondary'}
        style={{ fontWeight: '600' as const }}
      >
        {label}
      </Text>
      {icon && isSelected && <View style={{ marginLeft: theme.spacing[1] }}>{icon}</View>}
    </Pressable>
  );
};
