import React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Card } from '../../ui/Card/Card';
import { Spacer } from '../../ui/Spacer/Spacer';
import { getAvailableTimeLucideIcon } from '../../../utils/buddy';
import type { BuddyCardData } from '../../../types/buddy';

export type BuddyCardProps = {
  data: BuddyCardData;
  onLike?: () => void;
  onPass?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
  fullHeight?: boolean;
};

export const BuddyCard: React.FC<BuddyCardProps> = ({
  data,
  onLike,
  onPass,
  onPress,
  style,
  fullHeight = false,
}) => {
  const { t } = useTranslation('buddy');
  const { theme } = useTheme();
  const requestStatus = data.requestStatus ?? 'idle';
  const mainGoal = data.bio;
  const hasInterests = data.interests && data.interests.length > 0;
  const hasTimes = data.availableTimes && data.availableTimes.length > 0;
  const sectionTitleStyle = {
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: theme.spacing[1],
    fontWeight: '600' as const,
    fontSize: 11,
  };
  const placeholderPill = (label: string) => (
    <View
      style={{
        paddingHorizontal: theme.spacing[2],
        paddingVertical: theme.spacing[1],
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="bodySmall" color="tertiary" style={{ fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );

  const renderRequestStatus = () => {
    if (requestStatus === 'idle') return null;

    const statusStyles = {
      pending: {
        backgroundColor: theme.colors.semantic.warning + '20',
        borderColor: theme.colors.semantic.warning,
        textColor: theme.colors.semantic.warning,
        label: t('request.sending'),
      },
      sent: {
        backgroundColor: theme.colors.semantic.success + '20',
        borderColor: theme.colors.semantic.success,
        textColor: theme.colors.semantic.success,
        label: t('request.sent'),
      },
      error: {
        backgroundColor: theme.colors.semantic.error + '20',
        borderColor: theme.colors.semantic.error,
        textColor: theme.colors.semantic.error,
        label: t('request.sentError'),
      },
    } as const;

    const config = statusStyles[requestStatus as keyof typeof statusStyles] ?? statusStyles.sent;

    return (
      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[1],
          borderRadius: theme.radius.full,
          borderWidth: 1.5,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          alignSelf: 'flex-start',
        }}
      >
        <Text
          variant="bodySmall"
          color="primary"
          style={{ color: config.textColor, fontWeight: '600' }}
        >
          {config.label}
        </Text>
      </View>
    );
  };

  const cardContent = (
    <Card
      padding={6}
      elevation="lg"
      style={[{ overflow: 'hidden' }, fullHeight && { flex: 1, height: '100%' }, style]}
    >
      <View style={{ flex: 1 }}>
        {/* Header Section */}
        <LinearGradient
          colors={[theme.colors.primary[100], theme.colors.secondary[50]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: theme.spacing[6],
            paddingHorizontal: theme.spacing[6],
            alignItems: 'center',
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            marginHorizontal: -theme.spacing[6],
            marginTop: -theme.spacing[6],
            marginBottom: theme.spacing[4],
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: theme.colors.primary[200],
              opacity: 0.2,
              top: -30,
              right: -20,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: theme.colors.secondary[200],
              opacity: 0.2,
              bottom: -40,
              left: -30,
            }}
          />
          <Avatar
            size="xxl"
            uri={data.avatar && data.avatar.startsWith('http') ? data.avatar : undefined}
            name={data.avatar && !data.avatar.startsWith('http') ? data.avatar : data.name}
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
        </LinearGradient>

        <View style={{ flexGrow: 1, gap: theme.spacing[2] }}>
          {renderRequestStatus()}
          {/* Main Goal Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[1],
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[1],
              backgroundColor: theme.colors.primary[50],
              borderRadius: theme.radius.full,
              borderWidth: 1.5,
              borderColor: theme.colors.primary[200],
              alignSelf: 'flex-start',
            }}
          >
            <Target size={16} color={theme.colors.primary[500]} />
            <Text variant="bodySmall" color="primary" style={{ fontWeight: '700' as const }}>
              {mainGoal}
            </Text>
          </View>

          {/* Learning Interests */}
          <View>
            <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
              {t('card.learningInterests')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing[1],
              }}
            >
              {hasInterests
                ? data.interests.map((interest, index) => (
                    <View
                      key={`interest-${interest}-${index}`}
                      style={{
                        paddingHorizontal: theme.spacing[2],
                        paddingVertical: theme.spacing[1],
                        backgroundColor: theme.colors.secondary[50],
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.secondary[200],
                      }}
                    >
                      <Text
                        variant="bodySmall"
                        color="info"
                        style={{ fontWeight: '600' as const, fontSize: 12 }}
                      >
                        {interest}
                      </Text>
                    </View>
                  ))
                : placeholderPill(t('card.noInterests'))}
            </View>
          </View>

          {/* Available Times - Compact Layout */}
          <View>
            <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
              {t('card.availableTimes')}
            </Text>
            {hasTimes ? (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing[1],
                }}
              >
                {data.availableTimes.map((time, index) => {
                  const TimeIcon = time.timeValue
                    ? getAvailableTimeLucideIcon(time.timeValue)
                    : null;
                  return (
                    <View
                      key={`time-${time.text}-${index}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing[1],
                        paddingHorizontal: theme.spacing[2],
                        paddingVertical: theme.spacing[1],
                        backgroundColor: theme.colors.primary[50],
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.primary[200],
                      }}
                    >
                      {TimeIcon && <TimeIcon size={14} color={theme.colors.primary[500]} />}
                      <Text
                        variant="bodySmall"
                        color="primary"
                        style={{ fontWeight: '500' as const, fontSize: 12 }}
                      >
                        {time.text}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              placeholderPill(t('card.noAvailableTimes'))
            )}
          </View>

          {/* Learning Style - Compact Badge */}
          <View>
            <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
              {t('card.learningStyleTitle')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[1],
                paddingHorizontal: theme.spacing[2],
                paddingVertical: theme.spacing[1],
                backgroundColor: theme.colors.semantic.warning + '20',
                borderRadius: theme.radius.full,
                borderWidth: 1.5,
                borderColor: theme.colors.semantic.warning + '40',
                alignSelf: 'flex-start',
              }}
            >
              <Star
                size={14}
                color={theme.colors.semantic.warning}
                fill={theme.colors.semantic.warning}
              />
              <Text
                variant="bodySmall"
                color="warning"
                style={{ fontWeight: '600' as const, fontSize: 12 }}
              >
                {data.learningStyle || t('card.notUpdated')}
              </Text>
            </View>
          </View>
        </View>
      </View>
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
