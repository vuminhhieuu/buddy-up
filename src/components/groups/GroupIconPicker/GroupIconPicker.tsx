import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';

const GROUP_ICONS = [
  '📚', // Stack of books
  '📖', // Open book
  '🎓', // Graduation cap
  '💡', // Lightbulb
  '⭐', // Star
  '✨', // Sparkles
  '🚀', // Rocket
  '🎯', // Target
  '💻', // Laptop
  '🔬', // Microscope
  '🎨', // Palette
  '🎵', // Musical note
  '🏆', // Trophy
  '✏️', // Pencil
  '📝', // Memo
] as const;

export type GroupIconPickerProps = {
  selectedIcon?: string | null;
  onIconSelect: (icon: string) => void;
};

export const GroupIconPicker: React.FC<GroupIconPickerProps> = ({ selectedIcon, onIconSelect }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
        justifyContent: 'flex-start',
      }}
    >
      {GROUP_ICONS.map((icon) => {
        const isSelected = selectedIcon === icon;

        const iconContainerStyle: ViewStyle = {
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: isSelected ? theme.colors.primary[100] : theme.colors.surface,
          borderWidth: isSelected ? 2 : 1.5,
          borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        };

        return (
          <Pressable
            key={icon}
            onPress={() => onIconSelect(icon)}
            style={({ pressed }) => [
              iconContainerStyle,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={{ fontSize: 24 }}>{icon}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
