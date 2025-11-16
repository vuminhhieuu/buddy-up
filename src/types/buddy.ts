/**
 * Buddy Search Feature Types
 * Types and interfaces for buddy search, filtering, and matching functionality
 */

// ============================================================================
// Enums & Literal Types
// ============================================================================

/**
 * Learning goal options (matching UI filter screen)
 */
export type LearningGoal =
  | 'JLPT N3'
  | 'React Native'
  | 'TOEIC'
  | 'IELTS'
  | 'Python'
  | 'Data Science'
  | 'UI/UX'
  | 'Marketing'
  | string; // Allow custom goals

/**
 * Available time slots (matching UI filter screen)
 */
export type AvailableTime =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'late_night'
  | 'weekend'
  | 'flexible';

/**
 * Learning style options (matching UI filter screen)
 */
export type LearningStyle = 'serious' | 'relaxed' | 'balanced' | 'not_important';

/**
 * Learning level options (matching UI filter screen)
 */
export type Level = 'beginner' | 'intermediate' | 'advanced';

/**
 * Sort options for buddy search results
 */
export type SortOption = 'best_match' | 'nearest' | 'newest';

// ============================================================================
// Filter Interfaces
// ============================================================================

/**
 * Buddy search filters
 * Matches all filter options from the filter modal UI
 */
export interface BuddyFilters {
  /** Search query text (for searching by name) */
  searchQuery?: string;
  /** Selected learning goals (multi-select) */
  learningGoals?: LearningGoal[];
  /** Selected available times (multi-select) */
  availableTimes?: AvailableTime[];
  /** Selected learning style (single-select) */
  learningStyle?: LearningStyle;
  /** Distance range in kilometers */
  distance?: {
    min: number;
    max: number;
  };
  /** Age range */
  age?: {
    min: number;
    max: number;
  };
  /** Learning level (single-select) */
  level?: Level;
  /** Sort option */
  sortBy?: SortOption;
  /** Only show online users */
  onlyOnline?: boolean;
  /** Only show verified profiles */
  onlyVerified?: boolean;
  /** Hide users who previously rejected connection */
  hideRejected?: boolean;
  /** Prioritize users with free schedule */
  prioritizeFreeSchedule?: boolean;
}

/**
 * Default filter values
 */
export const DEFAULT_BUDDY_FILTERS: BuddyFilters = {
  searchQuery: undefined,
  learningGoals: [],
  availableTimes: [],
  learningStyle: undefined,
  distance: {
    min: 0,
    max: 50,
  },
  age: {
    min: 18,
    max: 60,
  },
  level: undefined,
  sortBy: 'best_match',
  onlyOnline: false,
  onlyVerified: false,
  hideRejected: false,
  prioritizeFreeSchedule: false,
};

// ============================================================================
// Profile Interfaces
// ============================================================================

/**
 * Extended buddy profile (from database)
 * Extends base profile with buddy search specific fields
 */
export interface BuddyProfile {
  /** User ID (from auth.users) */
  user_id: string;
  /** Display name */
  display_name: string;
  /** Avatar URL */
  avatar_url: string | null;
  /** User biography */
  bio: string | null;
  /** General interests (legacy field) */
  interests: string[];
  /** Learning goals array */
  learning_goals: LearningGoal[];
  /** Available time slots */
  available_times: AvailableTime[];
  /** Detailed available time descriptions */
  available_times_detail: string[];
  /** Learning style */
  learning_style: LearningStyle | null;
  /** User age */
  age: number | null;
  /** Learning level */
  level: Level | null;
  /** Online status */
  is_online: boolean;
  /** Verification status */
  is_verified: boolean;
  /** Location */
  location: string | null;
  /** Main learning goal (displayed on card) */
  main_learning_goal: string | null;
  /** Learning interests/tags */
  learning_interests: string[];
  /** Timestamps */
  created_at: string;
  updated_at: string;
}

/**
 * Buddy card data (formatted for UI display)
 * Optimized data structure for card component
 */
export interface BuddyCardData {
  /** User ID */
  userId: string;
  /** Display name */
  name: string;
  /** Avatar (emoji or URL) */
  avatar: string | null;
  /** Location and age string (e.g., "📍 TP.HCM • 23 tuổi") */
  locationAge: string;
  /** Main learning goal badge (e.g., "🎯 JLPT N3 - Tháng 12/2024") */
  mainGoal: string;
  /** Learning interests tags */
  interests: string[];
  /** Available times with details */
  availableTimes: Array<{
    icon: string;
    text: string;
  }>;
  /** Learning style text */
  learningStyle: string;
  /** Bio text */
  bio: string | null;
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Pagination options for buddy search
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Buddy search result
 */
export interface BuddySearchResult {
  profiles: BuddyProfile[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Filter count result
 */
export interface FilterCount {
  total: number;
  byCategory: {
    learningGoals: number;
    availableTimes: number;
    learningStyle: number;
    distance: number;
    age: number;
    level: number;
    advanced: number;
  };
}
