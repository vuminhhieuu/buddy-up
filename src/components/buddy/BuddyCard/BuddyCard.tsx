import React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Card } from '../../ui/Card/Card';
import { Chip } from '../../ui/Chip';
import { Spacer } from '../../ui/Spacer/Spacer';
import type { BuddyCardData } from '../../../types/buddy';

export type BuddyCardProps = {
  data: BuddyCardData;
  onLike?: () => void;
  onPass?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
};

export const BuddyCard: React.FC<BuddyCardProps> = ({ data, onLike, onPass, onPress, style }) => {
  const { theme } = useTheme();

  const cardContent = (
    <Card padding={6} elevation="lg" style={[{ overflow: 'hidden' }, style]}>
      {/* Header Section */}
      <View
        style={{
          backgroundColor: theme.colors.primary[100],
          paddingVertical: theme.spacing[6],
          paddingHorizontal: theme.spacing[6],
          alignItems: 'center',
          borderTopLeftRadius: theme.radius.lg,
          borderTopRightRadius: theme.radius.lg,
          marginHorizontal: -theme.spacing[6],
          marginTop: -theme.spacing[6],
          marginBottom: theme.spacing[4],
        }}
      >
        <Avatar
          size="xxl"
          uri={data.avatar.startsWith('http') ? data.avatar : undefined}
          name={!data.avatar.startsWith('http') ? data.avatar : data.name}
        />
        <Spacer size={4} />
        <Text
          variant="h2"
          color="primary"
          style={{ fontFamily: theme.typography.families.display }}
        >
          {data.name}
        </Text>
        <Spacer size={1} />
        <Text variant="bodySmall" color="secondary">
          {data.locationAge}
        </Text>
      </View>

      {/* Main Goal Badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[1],
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          backgroundColor: theme.colors.primary[100],
          borderRadius: theme.radius.md,
          borderWidth: 2,
          borderColor: theme.colors.primary[200],
          marginBottom: theme.spacing[5],
        }}
      >
        <Text variant="body" color="primary" style={{ fontWeight: '700' as const }}>
          🎯
        </Text>
        <Text variant="body" color="primary" style={{ fontWeight: '700' as const }}>
          {data.mainGoal}
        </Text>
      </View>

      {/* Learning Interests */}
      <Text
        variant="caption"
        color="tertiary"
        style={{
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: theme.spacing[2],
          fontWeight: '600' as const,
        }}
      >
        Sở thích học tập
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing[2],
          marginBottom: theme.spacing[5],
        }}
      >
        {data.interests.map((interest, index) => (
          <View
            key={index}
            style={{
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              backgroundColor: theme.colors.secondary[50],
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: theme.colors.secondary[200],
            }}
          >
            <Text variant="bodySmall" color="info" style={{ fontWeight: '600' as const }}>
              {interest}
            </Text>
          </View>
        ))}
      </View>

      {/* Available Times */}
      <Text
        variant="caption"
        color="tertiary"
        style={{
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: theme.spacing[2],
          fontWeight: '600' as const,
        }}
      >
        Thời gian rảnh
      </Text>
      <View style={{ gap: theme.spacing[2], marginBottom: theme.spacing[5] }}>
        {data.availableTimes.map((time, index) => (
          <View
            key={index}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}
          >
            <Text variant="body" color="primary">
              {time.icon}
            </Text>
            <Text variant="bodySmall" color="primary" style={{ flex: 1 }}>
              {time.text}
            </Text>
          </View>
        ))}
      </View>

      {/* Learning Style */}
      <View
        style={{
          backgroundColor: theme.colors.semantic.warning + '20',
          padding: theme.spacing[3],
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor: theme.colors.semantic.warning + '40',
          marginBottom: theme.spacing[4],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
          <Text variant="body" color="warning">
            ⭐
          </Text>
          <Text variant="bodySmall" color="warning" style={{ fontWeight: '600' as const, flex: 1 }}>
            {data.learningStyle}
          </Text>
        </View>
      </View>

      {/* Bio */}
      {data.bio && (
        <>
          <Text
            variant="caption"
            color="tertiary"
            style={{
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: theme.spacing[2],
              fontWeight: '600' as const,
            }}
          >
            Giới thiệu
          </Text>
          <Text variant="bodySmall" color="secondary" style={{ lineHeight: 22 }}>
            {data.bio}
          </Text>
        </>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel={`Profile của ${data.name}`}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};
