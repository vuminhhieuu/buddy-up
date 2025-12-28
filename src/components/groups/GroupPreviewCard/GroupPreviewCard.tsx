import React, { useState, useEffect } from 'react';
import { View, Image, ViewStyle, ImageStyle } from 'react-native';
import { Globe, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Card } from '../../ui/Card/Card';
import { Chip } from '../../ui/Chip/Chip';
import { getTopicLabels } from '../../../utils/topicUtils';

export type GroupPreviewCardProps = {
  name: string;
  description: string;
  coverImageUrl?: string | null;
  iconEmoji?: string | null;
  topics: string[];
  memberCount: number;
  activityFrequency?: string;
  studentLevel?: string;
  privacyType: 'public' | 'private';
};

export const GroupPreviewCard: React.FC<GroupPreviewCardProps> = ({
  name,
  description,
  coverImageUrl,
  iconEmoji,
  topics,
  memberCount,
  activityFrequency,
  studentLevel,
  privacyType,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [topicLabels, setTopicLabels] = useState<string[]>([]);
  const [coverImageError, setCoverImageError] = useState(false);

  // Convert topic IDs to labels
  useEffect(() => {
    const loadTopicLabels = async () => {
      if (topics && topics.length > 0) {
        // Always convert topics to labels
        const labels = await getTopicLabels(topics);
        setTopicLabels(labels);
      } else {
        setTopicLabels([]);
      }
    };
    loadTopicLabels();
  }, [topics]);

  return (
    <Card padding={0} elevation="md" style={{ overflow: 'hidden' }}>
      {/* Cover Image */}
      <View
        style={{
          height: 120,
          backgroundColor:
            coverImageUrl && !coverImageError
              ? 'transparent'
              : theme.colors.neutral?.[100] || '#F5F5F5',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {coverImageUrl && coverImageUrl.trim() !== '' && !coverImageError ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            onError={() => {
              setCoverImageError(true);
            }}
            onLoad={() => {
              setCoverImageError(false);
            }}
          />
        ) : (
          <Image
            source={require('../../../../assets/buddyup-logo-128.png')}
            style={{ width: 96, height: 96, opacity: 0.6 }}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Content */}
      <View style={{ padding: theme.spacing[4] }}>
        {/* Group Icon with Info */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginTop: -28 + theme.spacing[2], // Adjust to align with icon top
            marginBottom: theme.spacing[3],
            gap: theme.spacing[3],
          }}
        >
          {/* Group Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surface,
              borderWidth: 3,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -28, // Overlap with cover
            }}
          >
            {iconEmoji ? (
              <Text style={{ fontSize: 28 }}>{iconEmoji}</Text>
            ) : privacyType === 'private' ? (
              <Lock size={28} color={theme.colors.primary[500]} />
            ) : (
              <Globe size={28} color={theme.colors.primary[500]} />
            )}
          </View>

          {/* Group Info */}
          <View style={{ flex: 1 }}>
            {/* Group Name */}
            <Text
              variant="h6"
              style={{
                fontWeight: '700' as const,
                marginBottom: theme.spacing[1],
              }}
              numberOfLines={2}
            >
              {name}
            </Text>

            {/* Description */}
            {description && description.trim() && (
              <Text
                variant="body"
                color="secondary"
                style={{
                  lineHeight: 20,
                  marginBottom: theme.spacing[1],
                }}
                numberOfLines={2}
              >
                {description}
              </Text>
            )}

            {/* Privacy Status */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[1],
              }}
            >
              {privacyType === 'private' ? (
                <Lock size={16} color={theme.colors.semantic.success} />
              ) : (
                <Globe size={16} color={theme.colors.primary[500]} />
              )}
              <Text
                variant="bodySmall"
                style={{
                  color:
                    privacyType === 'public'
                      ? theme.colors.primary[500]
                      : theme.colors.semantic.success,
                  fontWeight: '600' as const,
                }}
              >
                {privacyType === 'public' ? t('step4.public') : t('step4.private')}
              </Text>
            </View>
          </View>
        </View>

        {/* Topics */}
        {topicLabels.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing[2],
              marginBottom: theme.spacing[3],
            }}
          >
            {topicLabels.map((label, index) => (
              <Chip
                key={index}
                label={label}
                variant="default"
                disabled
                style={{
                  borderColor: theme.colors.primary[500],
                  backgroundColor: theme.colors.surface,
                }}
                textStyle={{
                  color: theme.colors.primary[500],
                  fontWeight: '700' as const,
                }}
              />
            ))}
          </View>
        )}

        {/* Stats */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: theme.spacing[3],
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h6" style={{ fontWeight: '700' as const }}>
              {memberCount}
            </Text>
            <Text variant="bodySmall" color="secondary">
              {t('step4.members')}
            </Text>
          </View>
          {activityFrequency && (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="body" style={{ fontWeight: '600' as const }}>
                {activityFrequency}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {t('step4.activity')}
              </Text>
            </View>
          )}
          {studentLevel && (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="body" style={{ fontWeight: '600' as const }}>
                {studentLevel === 'all'
                  ? t('step4.studentLevelAll')
                  : studentLevel === 'beginner'
                    ? t('step4.studentLevelBeginner')
                    : studentLevel === 'intermediate'
                      ? t('step4.studentLevelIntermediate')
                      : t('step4.studentLevelAdvanced')}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {t('step4.level')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};
