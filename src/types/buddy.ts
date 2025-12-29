/**
 * Buddy Search Feature Types
 * Types and interfaces for buddy search, filtering, and matching functionality
 */

import type {
  AVAILABLE_TIME_VALUES,
  LEARNING_STYLE_VALUES,
  LEVEL_VALUES,
  SORT_OPTION_VALUES,
  CONNECTION_STATUS_VALUES,
  DEFAULT_LEARNING_GOALS,
} from '../constants/buddy';

// ============================================================================
// Enums & Literal Types (derived from constants)
// ============================================================================

/**
 * Learning goal options (matching UI filter screen)
 * Allows custom goals in addition to default ones
 */
export type LearningGoal = (typeof DEFAULT_LEARNING_GOALS)[number] | string;

/**
 * Available time slots (matching UI filter screen)
 * Derived from AVAILABLE_TIME_VALUES constant
 */
export type AvailableTime = (typeof AVAILABLE_TIME_VALUES)[number];

/**
 * Learning style options (matching UI filter screen)
 * Derived from LEARNING_STYLE_VALUES constant
 */
export type LearningStyle = (typeof LEARNING_STYLE_VALUES)[number];

/**
 * Learning level options (matching UI filter screen)
 * Derived from LEVEL_VALUES constant
 */
export type Level = (typeof LEVEL_VALUES)[number];

/**
 * Sort options for buddy search results
 * Derived from SORT_OPTION_VALUES constant
 */
export type SortOption = (typeof SORT_OPTION_VALUES)[number];

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

// Note: DEFAULT_BUDDY_FILTERS has been moved to src/constants/buddy.ts

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
  /** Location and age string (e.g., "TP.HCM • 23 tuổi") */
  locationAge: string;
  /** Main learning goal badge (e.g., "JLPT N3 - Tháng 12/2024") */
  mainGoal: string;
  /** Learning interests tags */
  interests: string[];
  /** Available times with details */
  availableTimes: Array<{
    icon: string; // Deprecated: kept for backward compatibility, use timeValue instead
    text: string;
    timeValue?: AvailableTime; // Added to support lucide icons
  }>;
  /** Learning style text */
  learningStyle: string;
  /** Bio text */
  bio: string | null;
  /** Connection request status for UI */
  requestStatus?: 'idle' | 'pending' | 'sent' | 'error';
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
// Connection Request Types
// ============================================================================

/**
 * Connection status enum (matches database enum)
 * Derived from CONNECTION_STATUS_VALUES constant
 */
export type ConnectionStatus = (typeof CONNECTION_STATUS_VALUES)[number];

/**
 * Connection request from database
 */
export interface ConnectionRequest {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: ConnectionStatus;
  requested_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Response from sending a buddy request
 */
export interface SendBuddyRequestResponse {
  success: boolean;
  connection?: ConnectionRequest;
  error?: string;
  errorCode?: 'ALREADY_EXISTS' | 'SELF_CONNECTION' | 'INVALID_USER' | 'NETWORK_ERROR';
}

/**
 * Connection status between two users
 */
export interface ConnectionStatusResult {
  exists: boolean;
  status: ConnectionStatus | null;
  connectionId: string | null;
  isRequestedByMe: boolean;
}

/**
 * Incoming connection request with sender information
 */
export interface IncomingRequest {
  id: string; // connection.id
  connection: ConnectionRequest;
  sender: BuddyProfile; // Profile của người gửi request
  read: boolean;
  createdAt: string;
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
    level: number;
    advanced: number;
  };
}
