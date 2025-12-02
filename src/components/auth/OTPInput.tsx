import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui';

export type OTPInputProps = {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  errorText?: string;
  autoFocus?: boolean;
};

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChangeText,
  errorText,
  autoFocus = true,
}) => {
  const { theme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Split value into array of characters
  const otpArray = value.split('').slice(0, length);
  while (otpArray.length < length) {
    otpArray.push('');
  }

  useEffect(() => {
    if (autoFocus && focusedIndex === null && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    }
  }, [autoFocus, focusedIndex]);

  const handleChangeText = (text: string, index: number) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');

    if (numericText.length > 1) {
      // Handle paste: take first N digits
      const pastedDigits = numericText.slice(0, length - value.length);
      const newValue = value + pastedDigits;
      onChangeText(newValue.slice(0, length));

      // Focus on the next empty input or last input
      const nextIndex = Math.min(newValue.length, length - 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
      }
      return;
    }

    // Single digit input
    const newValue = value.split('');
    newValue[index] = numericText;
    const updatedValue = newValue.join('').slice(0, length);
    onChangeText(updatedValue);

    // Auto-focus next input
    if (numericText && index < length - 1) {
      const nextIndex = index + 1;
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input if current is empty
      const prevIndex = index - 1;
      if (inputRefs.current[prevIndex]) {
        inputRefs.current[prevIndex]?.focus();
        setFocusedIndex(prevIndex);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const borderColor = (index: number) => {
    if (errorText) return theme.colors.semantic.error;
    if (focusedIndex === index) return theme.colors.secondary[500];
    return theme.colors.border;
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: theme.spacing[2],
        }}
      >
        {otpArray.map((digit, index) => (
          <Pressable
            key={index}
            onPress={() => {
              inputRefs.current[index]?.focus();
              setFocusedIndex(index);
            }}
            style={{
              flex: 1,
              aspectRatio: 1,
              borderWidth: 1.5,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              borderColor: borderColor(index),
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 56,
            }}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: '100%',
                height: '100%',
                textAlign: 'center',
                fontFamily: theme.typography.families.heading,
                fontSize: theme.typography.scale.xl,
                color: theme.colors.text.primary,
                fontWeight: '600',
              }}
              selectTextOnFocus
            />
          </Pressable>
        ))}
      </View>
      {errorText ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
};
