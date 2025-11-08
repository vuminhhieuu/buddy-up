import React from 'react';
import { ActivityIndicator, Pressable, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
};

const getContainerStyle = (
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>['theme'],
): ViewStyle => {
  const c = theme.colors;
  switch (variant) {
    case 'primary':
      return { backgroundColor: c.primary[500], borderRadius: theme.radius.base };
    case 'secondary':
      return { backgroundColor: c.secondary[500], borderRadius: theme.radius.base };
    case 'danger':
      return { backgroundColor: c.semantic.error, borderRadius: theme.radius.base };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: c.primary[500],
        borderRadius: theme.radius.base,
      };
    case 'ghost':
      return { backgroundColor: 'transparent', borderRadius: theme.radius.base };
    default:
      return { backgroundColor: c.primary[500], borderRadius: theme.radius.base };
  }
};

const getPadding = (size: ButtonSize, theme: ReturnType<typeof useTheme>['theme']): ViewStyle => {
  const padX =
    size === 'sm' ? theme.spacing[4] : size === 'md' ? theme.spacing[6] : theme.spacing[8];
  const height = theme.sizes.button[size];
  return {
    paddingHorizontal: padX,
    minHeight: height,
    alignItems: 'center',
    justifyContent: 'center',
  };
};

const getTextColor = (variant: ButtonVariant, theme: ReturnType<typeof useTheme>['theme']) => {
  const c = theme.colors;
  return variant === 'outline' || variant === 'ghost' ? c.primary[500] : c.text.inverse;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const bg = getContainerStyle(variant, theme);
  const pad = getPadding(size, theme);
  const color = getTextColor(variant, theme);
  const isDisabled = !!disabled || !!loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        bg,
        pad,
        { opacity: pressed ? 0.9 : 1 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text
          variant="body"
          color={variant === 'ghost' || variant === 'outline' ? 'primary' : 'inverse'}
          style={
            [
              { fontFamily: theme.typography.families.display, fontWeight: '600' as const },
              textStyle,
            ] as TextStyle[]
          }
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};
