import React from 'react';
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
import { AVAILABLE_SUBJECTS } from '../constants/subjects';

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
  if (filters.onlySaved) {
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
 * Get available time icon (emoji - for backward compatibility)
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
 * Get available time lucide icon component
 * Returns React component from lucide-react-native
 */
export function getAvailableTimeLucideIcon(
  time: AvailableTime,
): React.ComponentType<{ size?: number; color?: string }> {
  // Dynamic import to avoid circular dependencies
  const { Sun, SunMedium, Moon, Calendar, Clock } = require('lucide-react-native');

  const iconMap: Record<AvailableTime, React.ComponentType<{ size?: number; color?: string }>> = {
    morning: Sun,
    afternoon: SunMedium,
    evening: Moon,
    late_night: Moon,
    weekend: Calendar,
    flexible: Clock,
  };
  return iconMap[time] || Clock;
}

/**
 * Get learning style lucide icon component
 * Returns React component from lucide-react-native
 */
export function getLearningStyleLucideIcon(
  style: LearningStyle,
): React.ComponentType<{ size?: number; color?: string }> {
  // Dynamic import to avoid circular dependencies
  const { ClipboardList, Smile, Target, Star } = require('lucide-react-native');

  const iconMap: Record<LearningStyle, React.ComponentType<{ size?: number; color?: string }>> = {
    serious: ClipboardList,
    relaxed: Smile,
    balanced: Target,
    not_important: Star,
  };
  return iconMap[style] || Star;
}

/**
 * Get available time text (i18n mapped)
 */
export function getAvailableTimeText(time: string): string {
  const timeMap: Record<string, string> = {
    morning: i18n.t('filter.availableTime.morning', { ns: 'buddy' }),
    afternoon: i18n.t('filter.availableTime.afternoon', { ns: 'buddy' }),
    evening: i18n.t('filter.availableTime.evening', { ns: 'buddy' }),
    late_night: i18n.t('filter.availableTime.lateNight', { ns: 'buddy' }),
    weekend: i18n.t('filter.availableTime.weekend', { ns: 'buddy' }),
    flexible: i18n.t('filter.availableTime.flexible', { ns: 'buddy' }),
  };
  return timeMap[time] || time;
}

/**
 * Map interest/subject key to i18n label
 */
export function mapInterestToLabel(interest: string): string {
  const subj = AVAILABLE_SUBJECTS.find((s) => s.key === interest);
  if (subj) {
    const ns = (subj as any).namespace || 'common';
    return i18n.t(subj.label, { ns });
  }
  return interest;
}

/**
 * Get learning style text
 */
export function getLearningStyleText(style: LearningStyle | null): string {
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
export function formatLocationAge(location: string | null, age: number | null): string {
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

  // Format available times with icons and i18n labels
  const availableTimes = profile.available_times.map((time) => ({
    icon: getAvailableTimeIcon(time), // Keep for backward compatibility
    text: getAvailableTimeText(time),
    timeValue: time, // Add time value for lucide icon mapping
  }));

  // Format learning style
  const learningStyle = getLearningStyleText(profile.learning_style);

  // Use learning_interests if available, otherwise use interests
  // Map through i18n if they match AVAILABLE_SUBJECTS keys
  const rawInterests =
    profile.learning_interests.length > 0 ? profile.learning_interests : profile.interests;
  const interests = rawInterests.map(mapInterestToLabel);

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
