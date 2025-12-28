/**
 * Topics Storage Utility
 * Handles saving and loading custom topics from AsyncStorage and Database
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { logger } from './logger';

const CUSTOM_TOPICS_STORAGE_KEY = '@buddyup:custom_topics';

export type StoredTopic = {
  id: string;
  label: string;
  createdAt: number;
};

/**
 * Load custom topics from local storage (for backward compatibility)
 */
export async function loadCustomTopics(): Promise<StoredTopic[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_TOPICS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading custom topics from storage:', error);
    return [];
  }
}

/**
 * Save a custom topic to database (primary storage)
 * This ensures all users can see custom topics created by others
 */
export async function saveCustomTopicToDatabase(topic: {
  id: string;
  label: string;
}): Promise<void> {
  try {
    // Check if topic already exists in database
    const { data: existing, error: checkError } = await supabase
      .from('custom_topics')
      .select('id')
      .eq('topic_id', topic.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      logger.warn('saveCustomTopicToDatabase', 'Error checking existing topic', checkError);
    }

    // If topic doesn't exist, insert it
    if (!existing) {
      const { error: insertError } = await supabase.from('custom_topics').insert({
        topic_id: topic.id,
        topic_label: topic.label,
      });

      if (insertError) {
        // If table doesn't exist, log but don't fail
        logger.warn('saveCustomTopicToDatabase', 'Error saving to database', insertError);
      }
    } else {
      // Update existing topic label if it changed
      const { error: updateError } = await supabase
        .from('custom_topics')
        .update({ topic_label: topic.label })
        .eq('topic_id', topic.id);

      if (updateError) {
        logger.warn('saveCustomTopicToDatabase', 'Error updating topic', updateError);
      }
    }
  } catch (error) {
    logger.warn('saveCustomTopicToDatabase', 'Unexpected error', error);
  }
}

/**
 * Load custom topics from database
 */
export async function loadCustomTopicsFromDatabase(): Promise<
  Array<{ id: string; label: string }>
> {
  try {
    const { data, error } = await supabase
      .from('custom_topics')
      .select('topic_id, topic_label')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        logger.debug('loadCustomTopicsFromDatabase', 'Table does not exist yet');
        return [];
      }
      logger.warn('loadCustomTopicsFromDatabase', 'Error loading from database', error);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: t.topic_id,
      label: t.topic_label,
    }));
  } catch (error) {
    logger.warn('loadCustomTopicsFromDatabase', 'Unexpected error', error);
    return [];
  }
}

/**
 * Save a custom topic to both local storage and database
 */
export async function saveCustomTopic(topic: { id: string; label: string }): Promise<void> {
  try {
    // Save to local storage (for backward compatibility and offline support)
    const existingTopics = await loadCustomTopics();
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

    // Save to database (primary storage for sharing across users)
    await saveCustomTopicToDatabase(topic);
  } catch (error) {
    logger.error('saveCustomTopic', 'Error saving custom topic', error);
  }
}

/**
 * Get all custom topics (from database first, fallback to local storage)
 */
export async function getAllCustomTopics(): Promise<Array<{ id: string; label: string }>> {
  try {
    // Try to load from database first (shared across all users)
    const dbTopics = await loadCustomTopicsFromDatabase();
    if (dbTopics.length > 0) {
      return dbTopics;
    }

    // Fallback to local storage (for backward compatibility)
    const localTopics = await loadCustomTopics();
    return localTopics.map((t) => ({ id: t.id, label: t.label }));
  } catch (error) {
    logger.warn('getAllCustomTopics', 'Error loading topics', error);
    // Final fallback to local storage
    const localTopics = await loadCustomTopics();
    return localTopics.map((t) => ({ id: t.id, label: t.label }));
  }
}
