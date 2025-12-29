import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';

export type SwipeHintProps = {
  visible: boolean;
  message: string;
};

export const SwipeHint: React.FC<SwipeHintProps> = ({ visible, message }) => {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible && opacity.__getValue() === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { opacity, backgroundColor: theme.colors.text.primary }]}
    >
      <View style={styles.content}>
        <ChevronLeft size={16} color={theme.colors.text.inverse} />
        <Text
          variant="bodySmall"
          color="inverse"
          style={{
            fontWeight: '600' as const,
            textAlign: 'center',
            marginHorizontal: theme.spacing[2],
          }}
        >
          {message}
        </Text>
        <ChevronRight size={16} color={theme.colors.text.inverse} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -125 }],
    width: 250,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
