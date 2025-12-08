/**
 * Groups List Service
 * Functions for fetching and listing groups
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type { StudyGroup } from './types';

export interface FetchGroupsOptions {
  limit?: number;
  offset?: number;
  privacyType?: 'public' | 'private';
}

export interface FetchGroupsResponse {
  data: StudyGroup[] | null;
  error: { message: string; code?: string } | null;
}

/**
 * Get groups created by the user
 */
export async function getMyGroups(userId: string): Promise<FetchGroupsResponse> {
  try {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('creator_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('getMyGroups', error.message, error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      data: data as StudyGroup[],
      error: null,
    };
  } catch (err: any) {
    logger.error('getMyGroups', 'Unexpected error', err);
    return {
      data: null,
      error: { message: err.message || 'Failed to fetch my groups' },
    };
  }
}

/**
 * Get groups the user has joined
 */
export async function getJoinedGroups(userId: string): Promise<FetchGroupsResponse> {
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (memberError) {
      logger.error('getJoinedGroups', memberError.message, memberError);
      return {
        data: null,
        error: { message: memberError.message, code: memberError.code },
      };
    }

    if (!memberData || memberData.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const groupIds = memberData.map((m: any) => m.group_id);

    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .in('id', groupIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('getJoinedGroups', error.message, error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      data: data as StudyGroup[],
      error: null,
    };
  } catch (err: any) {
    logger.error('getJoinedGroups', 'Unexpected error', err);
    return {
      data: null,
      error: { message: err.message || 'Failed to fetch joined groups' },
    };
  }
}

/**
 * Get public groups (discoverable groups)
 */
export async function getPublicGroups(
  options: FetchGroupsOptions = {},
): Promise<FetchGroupsResponse> {
  try {
    const { limit = 20, offset = 0 } = options;

    let query = supabase
      .from('study_groups')
      .select('*')
      .eq('privacy_type', 'public')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('getPublicGroups', error.message, error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      data: data as StudyGroup[],
      error: null,
    };
  } catch (err: any) {
    logger.error('getPublicGroups', 'Unexpected error', err);
    return {
      data: null,
      error: { message: err.message || 'Failed to fetch public groups' },
    };
  }
}
