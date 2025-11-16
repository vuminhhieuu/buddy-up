import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';
import { Check } from 'lucide-react-native';

export type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: theme.spacing[3],
    backgroundColor: checked ? theme.colors.primary[100] : theme.colors.surface,
    borderWidth: checked ? 2 : 1.5,
    borderColor: checked ? theme.colors.primary[500] : theme.colors.border,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    ...(disabled && { opacity: 0.5 }),
    ...style,
  };

  const iconBoxStyle: ViewStyle = {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: checked ? theme.colors.primary[500] : theme.colors.border,
    backgroundColor: checked ? theme.colors.primary[500] : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={iconBoxStyle}>
        {checked && <Check color={theme.colors.text.inverse} size={12} strokeWidth={3} />}
      </View>
      {label && (
        <Text variant="bodySmall" color="primary" style={{ fontWeight: '500' as const, flex: 1 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};
