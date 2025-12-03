import type { RootState } from '../store';
import type {
  BuddyFilters,
  FilterCount,
  BuddyProfile,
  BuddyCardData,
  AvailableTime,
  LearningStyle,
  IncomingRequest,
} from '../types/buddy';
import { DEFAULT_BUDDY_FILTERS } from '../constants/buddy';
import i18n from '../config/i18n';

/**
 * Get current user ID from Redux store
 */
export function getCurrentUserId(state: RootState): string | null {
  return state.auth.userId;
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: BuddyFilters): FilterCount {
  let total = 0;
  const byCategory = {
    learningGoals: 0,
    availableTimes: 0,
    learningStyle: 0,
    level: 0,
    advanced: 0,
  };

  // Learning goals
  if (filters.learningGoals && filters.learningGoals.length > 0) {
    byCategory.learningGoals = filters.learningGoals.length;
    total += filters.learningGoals.length;
  }

  // Available times
  if (filters.availableTimes && filters.availableTimes.length > 0) {
    byCategory.availableTimes = filters.availableTimes.length;
    total += filters.availableTimes.length;
  }

  // Learning style
  if (filters.learningStyle) {
    byCategory.learningStyle = 1;
    total += 1;
  }

  // Level
  if (filters.level) {
    byCategory.level = 1;
    total += 1;
  }

  // Advanced options
  if (filters.onlyOnline) {
    byCategory.advanced += 1;
    total += 1;
  }
  if (filters.onlyVerified) {
    byCategory.advanced += 1;
    total += 1;
  }
  if (filters.hideRejected) {
    byCategory.advanced += 1;
    total += 1;
  }
  if (filters.prioritizeFreeSchedule) {
    byCategory.advanced += 1;
    total += 1;
  }

  return {
    total,
    byCategory,
  };
}

/**
 * Get default filter values
 */
export function getDefaultFilters(): BuddyFilters {
  return { ...DEFAULT_BUDDY_FILTERS };
}

/**
 * Validate filters
 */
export function validateFilters(filters: BuddyFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available time icon
 */
function getAvailableTimeIcon(time: AvailableTime): string {
  const iconMap: Record<AvailableTime, string> = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    late_night: '🌙',
    weekend: '📅',
    flexible: '🕐',
  };
  return iconMap[time] || '🕐';
}

/**
 * Get learning style text
 */
function getLearningStyleText(style: LearningStyle | null): string {
  if (!style) return 'Chưa cập nhật';
  const textMap: Record<LearningStyle, string> = {
    serious: 'Nghiêm túc',
    relaxed: 'Thoải mái',
    balanced: 'Cân bằng',
    not_important: 'Không quan trọng',
  };
  return textMap[style] || 'Chưa cập nhật';
}

/**
 * Format location and age string
 */
function formatLocationAge(location: string | null, age: number | null): string {
  const parts: string[] = [];
  if (location) {
    parts.push(`📍 ${location}`);
  }
  if (age) {
    parts.push(i18n.t('card.age', { ns: 'buddy', age }));
  }
  return parts.join(' • ') || i18n.t('card.notUpdated', { ns: 'buddy' });
}

/**
 * Convert BuddyProfile to BuddyCardData
 */
export function profileToCardData(profile: BuddyProfile): BuddyCardData {
  // Format location and age
  const locationAge = formatLocationAge(profile.location, profile.age);

  // Format main goal
  const mainGoal =
    profile.main_learning_goal ||
    profile.learning_goals[0] ||
    i18n.t('card.notUpdated', { ns: 'buddy' });

  // Format available times with icons
  // Ensure available_times_detail exists and is an array to prevent errors
  const availableTimesDetail = profile.available_times_detail || [];
  const availableTimes = profile.available_times.map((time, index) => ({
    icon: getAvailableTimeIcon(time),
    text: availableTimesDetail[index] || time,
  }));

  // Format learning style
  const learningStyle = getLearningStyleText(profile.learning_style);

  // Use learning_interests if available, otherwise use interests
  const interests =
    profile.learning_interests.length > 0 ? profile.learning_interests : profile.interests;

  return {
    userId: profile.user_id,
    name: profile.display_name,
    avatar: profile.avatar_url,
    locationAge,
    mainGoal,
    interests,
    availableTimes,
    learningStyle,
    bio: profile.bio,
  };
}

/**
 * Convert IncomingRequest to BuddyCardData
 */
export function incomingRequestToCardData(request: IncomingRequest): BuddyCardData {
  return profileToCardData(request.sender);
}
