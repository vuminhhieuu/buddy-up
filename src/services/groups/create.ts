/**
 * Group Creation Service
 * Functions for creating study groups
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { getTopicLabel } from '../../utils/topicUtils';
import type { CreatePublicGroupPayload, CreatePublicGroupResult, StudyGroup } from './types';

/**
 * Generate a URL-friendly slug from group name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50);
}

/**
 * Check if a slug is available
 */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('study_groups')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is what we want
      logger.error('checkSlugAvailability', error.message, error);
      return false;
    }

    return !data; // Available if no data returned
  } catch (err: any) {
    logger.error('checkSlugAvailability', 'Unexpected error', err);
    return false;
  }
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100;

  while (counter < maxAttempts) {
    const isAvailable = await checkSlugAvailability(slug);
    if (isAvailable) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Fallback: use timestamp
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Create a public study group
 */
export async function createPublicGroup(
  payload: CreatePublicGroupPayload,
  creatorId: string,
): Promise<CreatePublicGroupResult> {
  try {
    // Validate topics count
    if (payload.topics.length < 1 || payload.topics.length > 3) {
      return {
        data: null,
        error: { message: 'Topics must be between 1 and 3', code: 'VALIDATION_ERROR' },
      };
    }

    // Ensure slug is unique
    let uniqueSlug = await generateUniqueSlug(payload.slug);
    const maxRetries = 5;
    let retryCount = 0;

    // Create the group with retry logic for slug conflicts
    while (retryCount < maxRetries) {
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: payload.name,
          description: payload.description,
          cover_image_url: payload.cover_image_url ?? null,
          icon_emoji: payload.icon_emoji ?? null,
          slug: uniqueSlug,
          privacy_type: 'public',
          creator_id: creatorId,
          topics: payload.topics,
          student_level: payload.student_level,
          main_language: payload.main_language,
          expected_activity_frequency: payload.expected_activity_frequency,
          requires_approval: payload.requires_approval,
          posting_permission: payload.posting_permission,
        })
        .select('*')
        .single();

      if (groupError) {
        // Check if error is due to unique constraint violation (slug conflict)
        const isSlugConflict =
          groupError.code === '23505' || // PostgreSQL unique violation
          groupError.message?.toLowerCase().includes('unique') ||
          groupError.message?.toLowerCase().includes('duplicate');

        if (isSlugConflict && retryCount < maxRetries - 1) {
          // Generate a new unique slug and retry
          retryCount++;
          uniqueSlug = await generateUniqueSlug(`${payload.slug}-${Date.now()}`);
          logger.warn(
            'createPublicGroup.slugConflict',
            `Slug conflict detected, retrying with new slug: ${uniqueSlug}`,
            { originalSlug: payload.slug, retryCount },
          );
          continue;
        }

        logger.error('createPublicGroup', groupError.message, groupError);
        return {
          data: null,
          error: {
            message: isSlugConflict
              ? 'Slug conflict occurred. Please try again.'
              : groupError.message,
            code: isSlugConflict ? 'SLUG_CONFLICT' : groupError.code || 'NETWORK_ERROR',
          },
        };
      }

      // Success - break out of retry loop
      const group = groupData as StudyGroup;

      // Add creator as owner member
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: creatorId,
        role: 'owner',
        status: 'active',
      });

      if (memberError) {
        logger.error('createPublicGroup.member', memberError.message, memberError);
        // Continue even if member insertion fails (shouldn't happen)
      }

      // Add rules if provided
      let rulesError: any | null = null;
      if (payload.rules && payload.rules.length > 0) {
        const rulesData = payload.rules.map((ruleText, index) => ({
          group_id: group.id,
          rule_text: ruleText,
          order_index: index,
        }));

        const { error: rulesInsertError } = await supabase.from('group_rules').insert(rulesData);

        if (rulesInsertError) {
          rulesError = rulesInsertError;
          logger.warn('createPublicGroup.rules', rulesInsertError.message, rulesInsertError);
        }
      }

      // Send invitations if provided
      let invitationsError: any | null = null;
      if (payload.invited_friend_ids && payload.invited_friend_ids.length > 0) {
        const invitationsData = payload.invited_friend_ids.map((friendId) => ({
          group_id: group.id,
          inviter_id: creatorId,
          invitee_id: friendId,
          status: 'pending',
        }));

        const { error: invitationsInsertError } = await supabase
          .from('group_invitations')
          .insert(invitationsData);

        if (invitationsInsertError) {
          invitationsError = invitationsInsertError;
          logger.warn(
            'createPublicGroup.invitations',
            invitationsInsertError.message,
            invitationsInsertError,
          );
        }
      }

      // Save topic labels to database for custom topics
      // This allows other users to see the correct labels even if they don't have the custom topic in their storage
      // NOTE: This requires the 'group_topic_labels' table to exist in the database.
      // The table should have columns: group_id, topic_id, topic_label with a unique constraint on (group_id, topic_id)
      // If the table doesn't exist, this operation will fail silently and group creation will still succeed.
      try {
        const topicLabels = await Promise.all(
          payload.topics.map(async (topicId) => {
            const label = await getTopicLabel(topicId);
            return { topic_id: topicId, topic_label: label };
          }),
        );

        // Try to insert into group_topic_labels table
        // Use upsert to handle duplicates gracefully
        const { error: topicLabelsError } = await supabase.from('group_topic_labels').upsert(
          topicLabels.map(({ topic_id, topic_label }) => ({
            group_id: group.id,
            topic_id,
            topic_label,
          })),
          {
            onConflict: 'group_id,topic_id',
          },
        );

        if (topicLabelsError) {
          // Log but don't fail - table might not exist yet or might have schema issues
          // Group creation will still succeed even if topic labels can't be saved
          logger.debug('createPublicGroup.topicLabels', topicLabelsError.message, topicLabelsError);
        }
      } catch (error) {
        // Silently fail - table might not exist or there might be other issues
        // This is a non-critical feature, so group creation should not fail because of it
        logger.debug('createPublicGroup.topicLabels', 'Error saving topic labels', error);
      }

      return {
        data: group,
        error: null,
        rulesError: rulesError || undefined,
        invitationsError: invitationsError || undefined,
      };
    }

    // If we get here, all retries failed
    return {
      data: null,
      error: {
        message: 'Failed to create group after multiple retries due to slug conflicts',
        code: 'SLUG_CONFLICT',
      },
    };
  } catch (err: any) {
    logger.error('createPublicGroup', 'Unexpected error', err);
    return { data: null, error: err };
  }
}
