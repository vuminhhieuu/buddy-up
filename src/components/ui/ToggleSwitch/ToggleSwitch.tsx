import React from 'react';
import { Pressable, View, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const [animatedValue] = React.useState(new Animated.Value(value ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: theme.transitions.duration.fast,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue, theme.transitions.duration.fast]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 23],
  });

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[3],
    ...(disabled && { opacity: 0.5 }),
    ...style,
  };

  const switchStyle: ViewStyle = {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: value ? theme.colors.primary[500] : theme.colors.border,
    position: 'relative',
  };

  const thumbStyle: ViewStyle = {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    top: 3,
    left: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="bodySmall" color="primary" style={{ fontWeight: '500' as const, flex: 1 }}>
          {label}
        </Text>
      )}
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        onPress={() => onValueChange(!value)}
        style={({ pressed }) => [switchStyle, pressed && !disabled && { opacity: 0.8 }]}
      >
        <Animated.View
          style={[
            thumbStyle,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Pressable>
    </View>
  );
};
