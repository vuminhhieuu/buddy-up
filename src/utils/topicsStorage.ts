/**
 * Topics Storage Utility
 * Handles saving and loading custom topics from AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_TOPICS_STORAGE_KEY = '@buddyup:custom_topics';

export type StoredTopic = {
  id: string;
  label: string;
  createdAt: number;
};

/**
 * Load custom topics from storage
 */
export async function loadCustomTopics(): Promise<StoredTopic[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_TOPICS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading custom topics:', error);
    return [];
  }
}

/**
 * Save a custom topic to storage
 */
export async function saveCustomTopic(topic: { id: string; label: string }): Promise<void> {
  try {
    const existingTopics = await loadCustomTopics();

    // Check if topic already exists
    const exists = existingTopics.some((t) => t.label.toLowerCase() === topic.label.toLowerCase());

    if (!exists) {
      const newTopic: StoredTopic = {
        id: topic.id,
        label: topic.label,
        createdAt: Date.now(),
      };

      const updatedTopics = [...existingTopics, newTopic];
      await AsyncStorage.setItem(CUSTOM_TOPICS_STORAGE_KEY, JSON.stringify(updatedTopics));
    }
  } catch (error) {
    console.error('Error saving custom topic:', error);
  }
}

/**
 * Get all custom topics (for use in TopicSelector)
 */
export async function getAllCustomTopics(): Promise<Array<{ id: string; label: string }>> {
  const storedTopics = await loadCustomTopics();
  return storedTopics.map((topic) => ({
    id: topic.id,
    label: topic.label,
  }));
}
