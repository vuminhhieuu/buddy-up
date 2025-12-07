import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Card } from '../../ui/Card/Card';

export type GroupRuleItemProps = {
  order: number;
  ruleText: string;
  onDelete?: () => void;
  canDelete?: boolean;
};

export const GroupRuleItem: React.FC<GroupRuleItemProps> = ({
  order,
  ruleText,
  onDelete,
  canDelete = true,
}) => {
  const { theme } = useTheme();

  return (
    <Card padding={4} elevation="sm" style={{ marginBottom: theme.spacing[2] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[3],
        }}
      >
        {/* Order Number */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary[500],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodySmall" color="inverse" style={{ fontWeight: '700' as const }}>
            {order}
          </Text>
        </View>

        {/* Rule Text */}
        <View style={{ flex: 1 }}>
          <Text variant="body" style={{ lineHeight: 20 }}>
            {ruleText}
          </Text>
        </View>

        {/* Delete Button */}
        {canDelete && onDelete && (
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [
              {
                padding: theme.spacing[1],
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <X size={20} color={theme.colors.text.secondary} />
          </Pressable>
        )}
      </View>
    </Card>
  );
};
