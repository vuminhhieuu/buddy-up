import type { Achievement, Subject, StudyStats, UserProfile } from '../types/profile';

/**
 * Profile feature constants
 */

// ============================================================================
// Enum-like arrays
// ============================================================================

/**
 * Subject badge colors (used for subject cards)
 */
export const SUBJECT_COLORS = ['blue', 'orange', 'green'] as const;

/**
 * Week days (hardcoded in Vietnamese - TODO: move to i18n)
 */
export const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

// ============================================================================
// Magic numbers & config values
// ============================================================================

/**
 * Target hours per subject to reach 100% progress
 */
export const HOURS_PER_SUBJECT_GOAL = 40;

/**
 * Weekly streak goal (days)
 */
export const WEEKLY_STREAK_GOAL = 7;

/**
 * Number of upcoming sessions to display on home screen
 */
export const UPCOMING_SESSIONS_DISPLAY_LIMIT = 2;

/**
 * Number of recent sessions to fetch
 */
export const RECENT_SESSIONS_LIMIT = 10;

/**
 * Fallback hours value when session duration cannot be calculated
 */
export const HOURS_FALLBACK = 1;

/**
 * Days in a week
 */
export const DAYS_IN_WEEK = 7;

/**
 * Number of days ahead to fetch upcoming sessions
 */
export const UPCOMING_DAYS_AHEAD = 7;

/**
 * Milliseconds per hour (for time calculations)
 */
export const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Maximum progress percentage
 */
export const PROGRESS_MAX_PERCENTAGE = 100;

/**
 * Offset to calculate Monday as start of week: (day + MONDAY_OFFSET) % 7
 */
export const MONDAY_OFFSET = 6;

/**
 * Days to add for end of week calculation
 */
export const WEEK_END_OFFSET = 6;

// ============================================================================
// Fallback objects
// ============================================================================

/**
 * Badge ID to emoji mapping
 */
export const BADGE_EMOJI_MAP: Record<string, string> = {
  streak_master: '🔥',
  night_owl: '🦉',
  team_player: '🤝',
  speed_learner: '⚡',
};

/**
 * Fallback emoji array (used when badge not found in map)
 */
export const FALLBACK_EMOJI_ARRAY = ['🏅', '🎖️', '⭐️'] as const;

/**
 * Fallback profile object (used when profile fetch fails)
 */
export const FALLBACK_PROFILE: UserProfile = {
  id: 'unknown',
  name: 'Learner', // TODO: move to i18n
  level: 1,
  subtitle: undefined,
  streak: 0,
  totalTime: 0,
  xp: 0,
};

/**
 * Fallback study stats object (used when stats fetch fails)
 */
export const FALLBACK_STUDY_STATS: StudyStats = {
  weeklyActivity: WEEK_DAYS.map((day) => ({ day, value: 0 })),
  completedSessions: 0,
  averagePerDay: '0h',
};

/**
 * Fallback subjects array (used when subjects fetch fails)
 */
export const FALLBACK_SUBJECTS: Subject[] = [];

/**
 * Fallback achievements array (used when achievements fetch fails)
 */
export const FALLBACK_ACHIEVEMENTS: Achievement[] = [];

// ============================================================================
// String literals
// ============================================================================

/**
 * Fallback user ID string
 */
export const FALLBACK_USER_ID = 'unknown';

/**
 * Time format suffix for hours
 */
export const TIME_FORMAT_HOURS = 'h';

/**
 * Session status value for ongoing sessions
 */
export const SESSION_STATUS_ONGOING = 'ongoing';
