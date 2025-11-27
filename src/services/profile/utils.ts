/**
 * Profile Service Utilities
 * Shared helper functions for profile calculations
 */

import {
  MS_PER_HOUR,
  SESSION_STATUS_ONGOING,
  BADGE_EMOJI_MAP,
  FALLBACK_EMOJI_ARRAY,
} from '../../constants/profile';

/**
 * Safely convert value to number, defaulting to 0 if invalid
 */
export const safeNumber = (value: number | null | undefined) =>
  Number.isFinite(value) ? Number(value) : 0;

/**
 * Calculate session duration in hours
 * @param start - Session start time (ISO string)
 * @param end - Session end time (ISO string). If null, returns 0 to avoid inflating statistics.
 * @param status - Optional session status. If 'ongoing', uses current time as end time.
 * @returns Duration in hours, or 0 if invalid, incomplete, or end time is before start time
 */
export const calculateSessionHours = (
  start?: string | null,
  end?: string | null,
  status?: string | null,
) => {
  if (!start) return 0;
  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) return 0;

  let endDate: Date;
  if (end) {
    endDate = new Date(end);
    if (isNaN(endDate.getTime())) return 0;
    if (endDate.getTime() <= startDate.getTime()) return 0;
  } else if (status === SESSION_STATUS_ONGOING) {
    endDate = new Date();
    if (endDate.getTime() <= startDate.getTime()) return 0;
  } else {
    return 0;
  }

  const diff = (endDate.getTime() - startDate.getTime()) / MS_PER_HOUR;
  return diff > 0 ? diff : 0;
};

/**
 * Map badge ID to emoji, with fallback
 */
export const mapBadgeToEmoji = (badgeId: string, index: number) =>
  BADGE_EMOJI_MAP[badgeId] || FALLBACK_EMOJI_ARRAY[index % FALLBACK_EMOJI_ARRAY.length];
