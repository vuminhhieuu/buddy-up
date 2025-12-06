/**
 * Profile Service Utilities
 * Shared helper functions for profile calculations
 */

import {
  MS_PER_HOUR,
  SESSION_STATUS_ONGOING,
  BADGE_EMOJI_MAP,
  FALLBACK_EMOJI_ARRAY,
  HOURS_FALLBACK,
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
  // Align calculation with Home service rules so totals are consistent across screens.
  // Behavior:
  // - If start is missing or invalid -> return 0
  // - If end exists and is valid and after start: compute raw hours
  //   - If raw < 1 hour, treat it as at least 1/3 hour
  // - If end is missing but status === 'ongoing' -> use now as end
  // - If end missing/invalid (and not ongoing) -> fallback to HOURS_FALLBACK
  if (!start) return 0;
  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) return 0;

  let endDate: Date | null = null;

  if (end) {
    const parsed = new Date(end);
    if (!isNaN(parsed.getTime()) && parsed.getTime() > startDate.getTime()) {
      endDate = parsed;
    }
  } else if (status === SESSION_STATUS_ONGOING) {
    const now = new Date();
    if (now.getTime() > startDate.getTime()) endDate = now;
  }

  if (!endDate) {
    // If we couldn't determine a valid end date, use a safe fallback to avoid
    // undercounting small/unfinished sessions. This matches Home's behavior.
    return HOURS_FALLBACK;
  }

  const diff = (endDate.getTime() - startDate.getTime()) / MS_PER_HOUR;
  if (!(diff > 0)) return 0;
  if (diff < 1) return Math.max(diff, 1 / 3);
  return diff;
};

/**
 * Map badge ID to emoji, with fallback
 */
export const mapBadgeToEmoji = (badgeId: string, index: number) =>
  BADGE_EMOJI_MAP[badgeId] || FALLBACK_EMOJI_ARRAY[index % FALLBACK_EMOJI_ARRAY.length];
