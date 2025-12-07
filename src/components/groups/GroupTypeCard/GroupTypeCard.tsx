import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { Globe, Lock } from 'lucide-react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Card } from '../../ui/Card/Card';
import { Check } from 'lucide-react-native';

export type GroupType = 'public' | 'private';

export type GroupTypeCardProps = {
  type: GroupType;
  selected: boolean;
  onPress: () => void;
  title: string;
  description: string;
  features: string[];
};

export const GroupTypeCard: React.FC<GroupTypeCardProps> = ({
  type,
  selected,
  onPress,
  title,
  description,
  features,
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    borderWidth: selected ? 2 : 1.5,
    borderColor: selected ? theme.colors.primary[500] : theme.colors.border,
    backgroundColor: selected ? theme.colors.primary[50] : theme.colors.surface,
  };

  const Icon = type === 'public' ? Globe : Lock;
  const iconColor = type === 'public' ? theme.colors.primary[500] : theme.colors.semantic.warning;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.8 : 1 },
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Card padding={5} elevation="sm" style={containerStyle}>
        <View style={{ position: 'relative' }}>
          {/* Selected indicator */}
          {selected && (
            <View
              style={{
                position: 'absolute',
                top: -theme.spacing[2],
                right: -theme.spacing[2],
                backgroundColor: theme.colors.primary[500],
                borderRadius: theme.radius.full,
                width: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Check size={16} color={theme.colors.surface} />
            </View>
          )}

          {/* Icon */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: theme.spacing[4],
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: theme.radius.full,
                backgroundColor: iconColor + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={32} color={iconColor} />
            </View>
          </View>

          {/* Title */}
          <Text
            variant="h6"
            style={{
              fontWeight: '700' as const,
              textAlign: 'center' as const,
              marginBottom: theme.spacing[2],
            }}
          >
            {title}
          </Text>

          {/* Description */}
          <Text
            variant="body"
            color="secondary"
            style={{
              textAlign: 'center' as const,
              marginBottom: theme.spacing[4],
              lineHeight: 20,
            }}
          >
            {description}
          </Text>

          {/* Features */}
          <View style={{ gap: theme.spacing[2] }}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                }}
              >
                <Check size={16} color={theme.colors.semantic.success} />
                <Text variant="bodySmall" color="secondary">
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
