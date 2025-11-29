import React, { useState } from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type InputProps = TextInputProps & {
  label?: string;
  labelBold?: boolean;
  helperText?: string;
  errorText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export const Input: React.FC<InputProps> = ({
  label,
  labelBold,
  helperText,
  errorText,
  left,
  right,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = errorText
    ? theme.colors.semantic.error
    : focused
      ? theme.colors.secondary[500]
      : theme.colors.border;

  return (
    <View>
      {label ? (
        <Text
          variant="h6"
          style={{
            marginBottom: theme.spacing[2],
            fontWeight: labelBold ? ('700' as const) : undefined,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          minHeight: theme.sizes.input.md,
          borderColor,
        }}
      >
        {left ? <View style={{ marginLeft: theme.spacing[4] }}>{left}</View> : null}
        <TextInput
          style={{
            flex: 1,
            height: theme.sizes.input.md,
            fontFamily: theme.typography.families.body,
            fontSize: theme.typography.scale.base,
            color: theme.colors.text.primary,
            paddingLeft: left ? theme.spacing[2] : theme.spacing[4],
            paddingRight: right ? theme.spacing[2] : theme.spacing[4],
            ...(style as object),
          }}
          placeholderTextColor={theme.colors.text.tertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {right ? <View style={{ marginRight: theme.spacing[4] }}>{right}</View> : null}
      </View>
      {errorText ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing[1] }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
