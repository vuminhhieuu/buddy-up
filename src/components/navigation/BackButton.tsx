import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../styles';

export type BackButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export const BackButton: React.FC<BackButtonProps> = ({ onPress, accessibilityLabel, style }) => {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        },
        style,
      ]}
    >
      <ArrowLeft size={20} color={theme.colors.text.primary} />
    </Pressable>
  );
};
