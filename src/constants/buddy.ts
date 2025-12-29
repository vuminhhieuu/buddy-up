import type { BuddyFilters } from '../types/buddy';
import { STORAGE_KEYS } from './storage';

/**
 * Buddy feature constants
 */

// ============================================================================
// Enum-like arrays (single source of truth)
// ============================================================================

/**
 * Available time slot values
 */
export const AVAILABLE_TIME_VALUES = [
  'morning',
  'afternoon',
  'evening',
  'late_night',
  'weekend',
  'flexible',
] as const;

/**
 * Learning style values
 */
export const LEARNING_STYLE_VALUES = ['serious', 'relaxed', 'balanced', 'not_important'] as const;

/**
 * Learning level values
 */
export const LEVEL_VALUES = ['beginner', 'intermediate', 'advanced'] as const;

/**
 * Sort option values
 */
export const SORT_OPTION_VALUES = ['best_match', 'nearest', 'newest'] as const;

/**
 * Connection status values
 */
export const CONNECTION_STATUS_VALUES = ['pending', 'accepted', 'blocked', 'rejected'] as const;

/**
 * Default learning goals list
 */
export const DEFAULT_LEARNING_GOALS = [
  'JLPT N3',
  'React Native',
  'TOEIC',
  'IELTS',
  'Python',
  'Data Science',
  'UI/UX',
  'Marketing',
] as const;

// ============================================================================
// Config arrays with translation keys
// ============================================================================

/**
 * Available times configuration with translation keys
 */
export const AVAILABLE_TIMES_CONFIG = [
  { value: 'morning' as const, translationKey: 'filter.availableTime.morning' },
  { value: 'afternoon' as const, translationKey: 'filter.availableTime.afternoon' },
  { value: 'evening' as const, translationKey: 'filter.availableTime.evening' },
  { value: 'late_night' as const, translationKey: 'filter.availableTime.lateNight' },
  { value: 'weekend' as const, translationKey: 'filter.availableTime.weekend' },
  { value: 'flexible' as const, translationKey: 'filter.availableTime.flexible' },
] as const;

/**
 * Learning styles configuration with translation keys
 */
export const LEARNING_STYLES_CONFIG = [
  { value: 'serious' as const, translationKey: 'filter.learningStyleOptions.serious' },
  { value: 'relaxed' as const, translationKey: 'filter.learningStyleOptions.relaxed' },
  { value: 'balanced' as const, translationKey: 'filter.learningStyleOptions.balanced' },
  {
    value: 'not_important' as const,
    translationKey: 'filter.learningStyleOptions.notImportant',
  },
] as const;

/**
 * Levels configuration with translation keys
 */
export const LEVELS_CONFIG = [
  { value: 'beginner' as const, translationKey: 'filter.levelOptions.beginner' },
  { value: 'intermediate' as const, translationKey: 'filter.levelOptions.intermediate' },
  { value: 'advanced' as const, translationKey: 'filter.levelOptions.advanced' },
] as const;

// ============================================================================
// Default objects
// ============================================================================

/**
 * Default buddy filter values
 */
export const DEFAULT_BUDDY_FILTERS: BuddyFilters = {
  searchQuery: undefined,
  learningGoals: [],
  availableTimes: [],
  learningStyle: undefined,
  level: undefined,
  sortBy: 'best_match',
  onlyOnline: false,
  onlyVerified: false,
  hideRejected: false,
  prioritizeFreeSchedule: false,
  onlySaved: false,
};

// ============================================================================
// Storage keys
// ============================================================================

export const SWIPE_HINT_STORAGE_KEY = STORAGE_KEYS.buddySwipeHint;

// ============================================================================
// Timing constants
// ============================================================================

export const SEARCH_DEBOUNCE_MS = 500;
export const SWIPE_HINT_DURATION_MS = 3000;

// ============================================================================
// Pagination defaults
// ============================================================================

/**
 * Default page number for buddy search
 */
export const DEFAULT_PAGE = 1;

/**
 * Default page limit for buddy search
 */
export const DEFAULT_PAGE_LIMIT = 20;

// ============================================================================
// Swipe gesture constants (calculated as percentage of screen width)
// ============================================================================

export const SWIPE_THRESHOLD_PERCENTAGE = 0.22; // 22% of screen width
export const SWIPE_OUT_DISTANCE_PERCENTAGE = 1.4; // 140% of screen width

// ============================================================================
// Card dimensions
// ============================================================================

export const CARD_HEIGHT = 520;
export const SCALE_DIVISOR = 1000; // Used for scale calculation during swipe
