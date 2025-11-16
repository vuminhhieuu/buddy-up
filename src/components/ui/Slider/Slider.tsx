import React, { useRef } from 'react';
import { View, ViewStyle, PanResponder, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
  showValue?: boolean;
  showLabels?: boolean;
  labelLeft?: string;
  labelRight?: string;
  accessibilityLabel?: string;
};

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onSlidingComplete,
  label,
  disabled = false,
  style,
  showValue = true,
  showLabels = false,
  labelLeft,
  labelRight,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const sliderWidth = style?.width ? (style.width as number) : SCREEN_WIDTH - 80;
  const pan = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const percentage = ((value - min) / (max - min)) * 100;
    const position = (percentage / 100) * (sliderWidth - 28);
    pan.setValue(position);
  }, [value, min, max, sliderWidth, pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        pan.setOffset(pan._value);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(0, Math.min(sliderWidth - 28, gestureState.dx + pan._offset));
        pan.setValue(newValue);

        const percentage = (newValue / (sliderWidth - 28)) * 100;
        const rawValue = min + (percentage / 100) * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.max(min, Math.min(max, steppedValue));

        onValueChange(clampedValue);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const percentage = (pan._value / (sliderWidth - 28)) * 100;
        const rawValue = min + (percentage / 100) * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.max(min, Math.min(max, steppedValue));
        onSlidingComplete?.(clampedValue);
      },
    }),
  ).current;

  const percentage = ((value - min) / (max - min)) * 100;
  const fillWidth = (percentage / 100) * sliderWidth;

  return (
    <View
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      style={[{ width: sliderWidth }, style]}
    >
      {label && (
        <Text variant="bodySmall" color="primary" style={{ marginBottom: theme.spacing[2] }}>
          {label}
        </Text>
      )}
      {showValue && (
        <Text
          variant="h6"
          color="success"
          style={{
            textAlign: 'center',
            marginBottom: theme.spacing[4],
            fontFamily: theme.typography.families.display,
            fontWeight: '600' as const,
          }}
        >
          {value === max ? `${value}+` : value} {max === 50 ? 'km' : ''}
        </Text>
      )}
      <View style={{ position: 'relative', height: 6, marginVertical: theme.spacing[3] }}>
        {/* Track */}
        <View
          style={{
            position: 'absolute',
            width: sliderWidth,
            height: 6,
            backgroundColor: theme.colors.border,
            borderRadius: 3,
            top: 11,
          }}
        />
        {/* Fill */}
        <View
          style={{
            position: 'absolute',
            width: fillWidth,
            height: 6,
            backgroundColor: theme.colors.primary[500],
            borderRadius: 3,
            top: 11,
          }}
        />
        {/* Thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
            borderWidth: 3,
            borderColor: theme.colors.primary[500],
            top: 0,
            left: pan,
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            ...(disabled && { opacity: 0.5 }),
          }}
        />
      </View>
      {showLabels && (labelLeft || labelRight) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing[2],
            marginTop: theme.spacing[3],
          }}
        >
          {labelLeft && (
            <Text variant="caption" color="tertiary">
              {labelLeft}
            </Text>
          )}
          {labelRight && (
            <Text variant="caption" color="tertiary">
              {labelRight}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
