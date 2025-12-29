/**
 * Topic Utilities
 * Helper functions for working with topics
 */

import { getAllCustomTopics } from './topicsStorage';
import { supabase } from '../config/supabase';
import i18n from '../config/i18n';

export type Topic = {
  id: string;
  label: string;
};

const AVAILABLE_TOPICS: Topic[] = [
  { id: 'ielts', label: 'IELTS' },
  { id: 'toeic', label: 'TOEIC' },
  { id: 'english-conversation', label: 'Tiếng Anh giao tiếp' },
  { id: 'programming', label: 'Lập trình' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'mobile-app', label: 'Mobile App' },
  { id: 'data-science', label: 'Data Science' },
  { id: 'ai-ml', label: 'AI/ML' },
  { id: 'ui-ux-design', label: 'UI/UX Design' },
  { id: 'mathematics', label: 'Toán học' },
  { id: 'physics', label: 'Vật lý' },
  { id: 'accounting', label: 'Kế toán' },
  { id: 'finance', label: 'Tài chính' },
];

/**
 * Get topic label by ID
 * @param topicId - The topic ID
 * @returns The topic label, or a fallback label if not found
 */
export async function getTopicLabel(topicId: string): Promise<string> {
  // Check available topics first
  const availableTopic = AVAILABLE_TOPICS.find((topic) => topic.id === topicId);
  if (availableTopic) {
    return availableTopic.label;
  }

  // Check custom topics from database (shared across all users)
  try {
    const { data, error } = await supabase
      .from('custom_topics')
      .select('topic_label')
      .eq('topic_id', topicId)
      .limit(1)
      .maybeSingle();

    if (!error && data?.topic_label) {
      return data.topic_label;
    }
  } catch (error) {
    // If table doesn't exist, fallback to local storage
    logger.debug('getTopicLabel', 'Error loading from custom_topics table', error);
  }

  // Fallback: Check custom topics from local storage (for backward compatibility)
  try {
    const customTopics = await getAllCustomTopics();
    const customTopic = customTopics.find((topic) => topic.id === topicId);
    if (customTopic) {
      return customTopic.label;
    }
  } catch (error) {
    logger.warn('getTopicLabel', 'Error loading custom topics from storage', error);
  }

  // Check database for stored topic labels in group_topic_labels (legacy support)
  try {
    const { data, error } = await supabase
      .from('group_topic_labels')
      .select('topic_label')
      .eq('topic_id', topicId)
      .limit(1)
      .maybeSingle();

    if (!error && data?.topic_label) {
      return data.topic_label;
    }
  } catch (error) {
    // Log warning if table doesn't exist - this is expected during initial setup
    logger.debug('getTopicLabel', 'Error loading from group_topic_labels table', error);
  }

  // If it's a custom topic ID format but not found, return a fallback
  if (topicId.startsWith('custom-')) {
    // Return a generic label with i18n support
    return i18n.t('groups:customTopic', { defaultValue: 'Custom Topic' });
  }

  // If not found, return the ID itself
  return topicId;
}

/**
 * Get topic labels for multiple topic IDs
 * @param topicIds - Array of topic IDs
 * @returns Array of topic labels
 */
export async function getTopicLabels(topicIds: string[]): Promise<string[]> {
  const labels = await Promise.all(topicIds.map((id) => getTopicLabel(id)));
  return labels;
}

/**
 * Get topic labels for a specific group (more accurate for custom topics)
 * @param topicIds - Array of topic IDs
 * @param groupId - The group ID
 * @returns Array of topic labels
 */
export async function getTopicLabelsForGroup(
  topicIds: string[],
  groupId: string,
): Promise<string[]> {
  const labels = await Promise.all(
    topicIds.map(async (topicId) => {
      // Check available topics first
      const availableTopic = AVAILABLE_TOPICS.find((topic) => topic.id === topicId);
      if (availableTopic) {
        return availableTopic.label;
      }

      // Check custom topics from database (shared across all users)
      try {
        const { data, error } = await supabase
          .from('custom_topics')
          .select('topic_label')
          .eq('topic_id', topicId)
          .limit(1)
          .maybeSingle();

        if (!error && data?.topic_label) {
          return data.topic_label;
        }
      } catch (error) {
        // If table doesn't exist, fallback to local storage
        logger.debug('getTopicLabelsForGroup', 'Error loading from custom_topics table', error);
      }

      // Fallback: Check custom topics from local storage (for backward compatibility)
      try {
        const customTopics = await getAllCustomTopics();
        const customTopic = customTopics.find((topic) => topic.id === topicId);
        if (customTopic) {
          return customTopic.label;
        }
      } catch (error) {
        logger.warn('getTopicLabelsForGroup', 'Error loading custom topics from storage', error);
      }

      // Check database for stored topic labels for this specific group
      try {
        // First, try to find label for this specific group
        const { data: groupData, error: groupError } = await supabase
          .from('group_topic_labels')
          .select('topic_label')
          .eq('group_id', groupId)
          .eq('topic_id', topicId)
          .limit(1)
          .maybeSingle();

        if (!groupError && groupData?.topic_label) {
          return groupData.topic_label;
        }

        // If not found for this group, try to find label from any group with this topic_id
        // This handles cases where the topic was created in another group
        const { data: anyGroupData, error: anyGroupError } = await supabase
          .from('group_topic_labels')
          .select('topic_label')
          .eq('topic_id', topicId)
          .limit(1)
          .maybeSingle();

        if (!anyGroupError && anyGroupData?.topic_label) {
          return anyGroupData.topic_label;
        }
      } catch (error) {
        // Log warning if table doesn't exist - this is expected during initial setup
        // The feature will gracefully degrade by returning the topicId or fallback label
        console.warn(
          'Error loading topic label from database (table may not exist yet):',
          error instanceof Error ? error.message : error,
        );
      }

      // If it's a custom topic ID format but not found, return a fallback
      if (topicId.startsWith('custom-')) {
        return i18n.t('groups:customTopic', { defaultValue: 'Custom Topic' });
      }

      // If not found, return the ID itself
      return topicId;
    }),
  );
  return labels;
}

/**
 * Get all available topics (for use in components)
 */
export function getAvailableTopics(): Topic[] {
  return AVAILABLE_TOPICS;
}
