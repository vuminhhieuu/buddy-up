import React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text, Spacer, EmptyState } from '../../ui';
import { GroupPreviewCard } from '../GroupPreviewCard/GroupPreviewCard';
import type { StudyGroup } from '../../../services/groups/types';
import { getTopicLabels } from '../../../utils/topicUtils';

export type GroupListProps = {
  groups: StudyGroup[];
  loading?: boolean;
  onGroupPress?: (group: StudyGroup) => void;
  emptyMessage?: string;
  showEmptyState?: boolean;
};

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  loading = false,
  onGroupPress,
  emptyMessage,
  showEmptyState = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [topicLabelsMap, setTopicLabelsMap] = React.useState<Record<string, string[]>>({});

  // Load topic labels for all groups
  React.useEffect(() => {
    const loadAllTopicLabels = async () => {
      const labelsMap: Record<string, string[]> = {};
      for (const group of groups) {
        if (group.topics && group.topics.length > 0) {
          const labels = await getTopicLabels(group.topics);
          labelsMap[group.id] = labels;
        }
      }
      setTopicLabelsMap(labelsMap);
    };
    if (groups.length > 0) {
      loadAllTopicLabels();
    }
  }, [groups]);

  const getActivityFrequencyLabel = (frequency: string | null | undefined) => {
    if (!frequency) return undefined;
    switch (frequency) {
      case 'daily':
        return t('step2.daily');
      case 'few_times_week':
        return t('step2.fewTimesWeek');
      case 'weekly':
        return t('step2.weekly');
      case 'flexible':
        return t('step2.flexible');
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <View style={{ padding: theme.spacing[4], alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (groups.length === 0 && showEmptyState) {
    return (
      <EmptyState
        title={emptyMessage || t('community.noGroups')}
        description={t('community.noGroupsDescription')}
      />
    );
  }

  return (
    <View>
      {groups.map((group) => {
        const topicLabels = topicLabelsMap[group.id] || group.topics || [];
        return (
          <Pressable
            key={group.id}
            onPress={() => onGroupPress?.(group)}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.7 : 1,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            <GroupPreviewCard
              name={group.name}
              description={group.description}
              coverImageUrl={group.cover_image_url}
              iconEmoji={group.icon_emoji}
              topics={topicLabels}
              memberCount={group.member_count}
              activityFrequency={getActivityFrequencyLabel(group.expected_activity_frequency)}
              studentLevel={group.student_level || undefined}
              privacyType={group.privacy_type}
            />
          </Pressable>
        );
      })}
    </View>
  );
};
