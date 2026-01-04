/**
 * Buddy Profile Normalization
 * Shared utilities for normalizing raw profile data from database
 */

import type { BuddyProfile } from '../../types/buddy';

/**
 * Supabase profile row type (raw data from database)
 * This represents the actual structure returned by Supabase queries
 */
export type SupabaseProfileRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  learning_goals: string[] | null;
  available_times: string[] | null;
  available_times_detail: string[] | null;
  learning_style: string | null;
  age: number | null;
  level: string | null;
  is_online: boolean | null;
  is_verified: boolean | null;
  location: string | null;
  main_learning_goal: string | null;
  learning_interests: string[] | null;

  // Academic fields (NEW)
  university: string | null;
  major: string | null;
  current_subjects: string[] | null;
  current_projects: string[] | null;

  created_at: string;
  updated_at: string;
};

/**
 * Normalize raw profile data from database to BuddyProfile
 * Ensures all fields have proper default values to prevent runtime errors
 *
 * @param row - Raw profile data from Supabase database
 * @returns Normalized BuddyProfile with all fields properly typed and defaulted
 */
export function normalizeProfile(row: SupabaseProfileRow): BuddyProfile {
  return {
    user_id: row.user_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url ?? null,
    bio: row.bio ?? null,
    interests: row.interests ?? [],
    learning_goals: row.learning_goals ?? [],
    available_times: (row.available_times ?? []) as BuddyProfile['available_times'],
    available_times_detail: row.available_times_detail ?? [],
    learning_style: (row.learning_style as BuddyProfile['learning_style']) ?? null,
    age: row.age ?? null,
    level: (row.level as BuddyProfile['level']) ?? null,
    is_online: row.is_online ?? false,
    is_verified: row.is_verified ?? false,
    location: row.location ?? null,
    main_learning_goal: row.main_learning_goal ?? null,
    learning_interests: row.learning_interests ?? [],

    // Academic fields (NEW)
    university: row.university ?? null,
    major: row.major ?? null,
    current_subjects: row.current_subjects ?? [],
    current_projects: row.current_projects ?? [],

    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
