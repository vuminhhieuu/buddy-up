import React from 'react';
import { View, ViewStyle, Pressable, ScrollView } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Card } from '../../ui/Card/Card';
import { Spacer } from '../../ui/Spacer/Spacer';
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
  const mainGoal = data.mainGoal;
  const hasBio = data.bio && data.bio.trim().length > 0;
  const hasInterests = data.interests && data.interests.length > 0;
  const hasTimes = data.availableTimes && data.availableTimes.length > 0;

  // Extract location from locationAge (e.g., "TP.HCM • 23 tuổi" -> "TP.HCM")
  const location = data.locationAge?.split('•')[0]?.trim() || data.locationAge;

  const sectionTitleStyle = {
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: theme.spacing[2],
    fontWeight: '600' as const,
    fontSize: 11,
  };

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
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[1],
          borderRadius: theme.radius.full,
          borderWidth: 1.5,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          alignSelf: 'flex-start',
          marginBottom: theme.spacing[2],
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
      padding={5}
      elevation="lg"
      style={[
        { overflow: 'hidden' },
        fullHeight && { flex: 1, height: '100%', minHeight: 0 },
        style,
      ]}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
        {/* Header Section */}
        <View
          style={{
            paddingVertical: theme.spacing[4],
            paddingHorizontal: theme.spacing[3],
            alignItems: 'center',
            backgroundColor: theme.colors.primary[100],
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            marginHorizontal: -theme.spacing[5],
            marginTop: -theme.spacing[5],
            marginBottom: theme.spacing[3],
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circle */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
              top: -30,
              right: -20,
            }}
          />
          <Avatar
            size="xl"
            uri={data.avatar && data.avatar.startsWith('http') ? data.avatar : undefined}
            name={data.avatar && !data.avatar.startsWith('http') ? data.avatar : data.name}
          />
          <Spacer size={2} />
          <Text
            variant="h3"
            color="primary"
            style={{ fontFamily: theme.typography.families.display }}
          >
            {data.name}
          </Text>
          <Spacer size={1} />
          {/* Main Goal in header (replacing location) */}
          <Text variant="bodySmall" color="secondary" style={{ textAlign: 'center' }}>
            {mainGoal}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingBottom: theme.spacing[2] }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {renderRequestStatus()}

          {/* Learning Interests */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
              {t('card.learningInterests')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
              {hasInterests ? (
                data.interests.map((interest, index) => (
                  <View
                    key={`interest-${interest}-${index}`}
                    style={{
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.full,
                      borderWidth: 1.5,
                      borderColor: theme.colors.primary[300],
                    }}
                  >
                    <Text variant="bodySmall" color="primary" style={{ fontWeight: '500' }}>
                      {interest}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="bodySmall" color="tertiary" style={{ fontStyle: 'italic' }}>
                  {t('card.noInterests')}
                </Text>
              )}
            </View>
          </View>

          {/* Available Times */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
              {t('card.availableTimes')}
            </Text>
            <View style={{ gap: theme.spacing[1] }}>
              {hasTimes ? (
                data.availableTimes.map((time, index) => (
                  <Text key={`time-${time.text}-${index}`} variant="body" color="secondary">
                    {time.text}
                  </Text>
                ))
              ) : (
                <Text variant="bodySmall" color="tertiary" style={{ fontStyle: 'italic' }}>
                  {t('card.noAvailableTimes')}
                </Text>
              )}
            </View>
          </View>

          {/* Learning Style */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
              {t('card.learningStyleTitle')}
            </Text>
            <Text variant="body" color="secondary">
              {data.learningStyle || t('card.notUpdated')}
            </Text>
          </View>

          {/* Location - moved near bio */}
          {location && (
            <View style={{ marginBottom: theme.spacing[4] }}>
              <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
                {t('card.location')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                <MapPin size={14} color={theme.colors.text.secondary} />
                <Text variant="body" color="secondary">
                  {location}
                </Text>
              </View>
            </View>
          )}

          {/* Bio Section - at the bottom */}
          {hasBio && (
            <View>
              <Text variant="caption" color="tertiary" style={sectionTitleStyle}>
                {t('card.bio')}
              </Text>
              <Text variant="body" color="secondary" style={{ lineHeight: 22 }} numberOfLines={4}>
                {data.bio}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { flex: 1, width: '100%', height: '100%' },
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Profile của ${data.name}`}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};
