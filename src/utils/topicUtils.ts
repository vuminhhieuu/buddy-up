/**
 * Topic Utilities
 * Helper functions for working with topics
 */

import { getAllCustomTopics } from './topicsStorage';

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
 * @returns The topic label, or the ID if not found
 */
export async function getTopicLabel(topicId: string): Promise<string> {
  // Check available topics first
  const availableTopic = AVAILABLE_TOPICS.find((topic) => topic.id === topicId);
  if (availableTopic) {
    return availableTopic.label;
  }

  // Check custom topics from storage
  try {
    const customTopics = await getAllCustomTopics();
    const customTopic = customTopics.find((topic) => topic.id === topicId);
    if (customTopic) {
      return customTopic.label;
    }
  } catch (error) {
    console.error('Error loading custom topics:', error);
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
 * Get all available topics (for use in components)
 */
export function getAvailableTopics(): Topic[] {
  return AVAILABLE_TOPICS;
}
