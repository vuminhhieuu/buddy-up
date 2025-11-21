import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type ToastProps = {
  message: string;
  visible: boolean;
};

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  if (!visible && opacity.__getValue() === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: 'rgba(0,0,0,0.9)' }]}>
      <Text variant="bodySmall" color="inverse">
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    zIndex: 100,
  },
});
