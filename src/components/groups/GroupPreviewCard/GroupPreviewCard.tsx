import React, { useState, useEffect } from 'react';
import { View, Image, ViewStyle, ImageStyle } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Card } from '../../ui/Card/Card';
import { Chip } from '../../ui/Chip/Chip';
import { Avatar } from '../../ui/Avatar/Avatar';
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
          backgroundColor: theme.colors.primary[500],
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {iconEmoji ? (
              <Text style={{ fontSize: 48 }}>{iconEmoji}</Text>
            ) : (
              <Globe size={48} color={theme.colors.surface} />
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: theme.spacing[4] }}>
        {/* Header with Icon and Name */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
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
              borderWidth: 2,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -28, // Overlap with cover
            }}
          >
            {iconEmoji ? (
              <Text style={{ fontSize: 28 }}>{iconEmoji}</Text>
            ) : (
              <Globe size={28} color={theme.colors.primary[500]} />
            )}
          </View>

          {/* Name and Privacy */}
          <View style={{ flex: 1 }}>
            <Text
              variant="h6"
              style={{
                fontWeight: '700' as const,
                marginBottom: theme.spacing[1],
              }}
            >
              {name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[1],
              }}
            >
              <Globe size={14} color={theme.colors.primary[500]} />
              <Text variant="bodySmall" color="primary" style={{ fontWeight: '600' as const }}>
                {privacyType === 'public' ? t('step4.public') : t('step4.private')}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text
          variant="body"
          color="secondary"
          style={{
            marginBottom: theme.spacing[3],
            lineHeight: 20,
          }}
        >
          {description}
        </Text>

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
              <Chip key={index} label={label} variant="default" disabled />
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
