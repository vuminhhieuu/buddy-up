import type { RootState } from '../store';
import type { BuddyFilters, FilterCount } from '../types/buddy';
import { DEFAULT_BUDDY_FILTERS } from '../types/buddy';

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
    distance: 0,
    age: 0,
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

  // Distance (check if not default)
  if (filters.distance && filters.distance.max !== DEFAULT_BUDDY_FILTERS.distance?.max) {
    byCategory.distance = 1;
    total += 1;
  }

  // Age (check if not default)
  if (
    filters.age &&
    (filters.age.min !== DEFAULT_BUDDY_FILTERS.age?.min ||
      filters.age.max !== DEFAULT_BUDDY_FILTERS.age?.max)
  ) {
    byCategory.age = 1;
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

  // Validate age range
  if (filters.age) {
    if (filters.age.min && filters.age.max && filters.age.min > filters.age.max) {
      errors.push('Age min must be less than or equal to age max');
    }
    if (filters.age.min && filters.age.min < 18) {
      errors.push('Age min must be at least 18');
    }
    if (filters.age.max && filters.age.max > 100) {
      errors.push('Age max must be at most 100');
    }
  }

  // Validate distance range
  if (filters.distance) {
    if (
      filters.distance.min &&
      filters.distance.max &&
      filters.distance.min > filters.distance.max
    ) {
      errors.push('Distance min must be less than or equal to distance max');
    }
    if (filters.distance.min && filters.distance.min < 0) {
      errors.push('Distance min must be at least 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
