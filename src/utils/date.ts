export function formatISOToLocal(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function isoStringToDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatTimeOnly(iso?: string | null, locale?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale || undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatWeekdayDateAndRange(
  startIso?: string | null,
  endIso?: string | null,
  locale?: string,
) {
  if (!startIso) return '';
  try {
    const start = new Date(startIso);
    if (isNaN(start.getTime())) return startIso;

    const weekday = start.toLocaleDateString(locale || undefined, { weekday: 'long' });
    const datePart = start.toLocaleDateString(locale || undefined, {
      day: '2-digit',
      month: '2-digit',
    });
    const startTime = start.toLocaleTimeString(locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    let endTime = '';
    if (endIso) {
      const e = new Date(endIso);
      if (!isNaN(e.getTime())) {
        endTime = e.toLocaleTimeString(locale || undefined, { hour: '2-digit', minute: '2-digit' });
      }
    }

    if (endTime) {
      return `${weekday} ${datePart} · ${startTime} - ${endTime}`;
    }

    return `${weekday} ${datePart} · ${startTime}`;
  } catch (e) {
    return startIso;
  }
}

export function formatWeekdayDate(iso?: string | null, locale?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale || undefined, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return iso;
  }
}

export function formatStartEndTimes(
  startIso?: string | null,
  endIso?: string | null,
  locale?: string,
) {
  if (!startIso) return '';
  try {
    const s = new Date(startIso);
    if (isNaN(s.getTime())) return startIso;
    const startTime = s.toLocaleTimeString(locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (!endIso) return startTime;
    const e = new Date(endIso);
    if (isNaN(e.getTime())) return startTime;
    const endTime = e.toLocaleTimeString(locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${startTime} - ${endTime}`;
  } catch (e) {
    return startIso || '';
  }
}

/**
 * Format a Date into "DD/MM/YYYY HH:MM" using locale-aware two-digit parts.
 * Falls back to empty string if the date is invalid.
 */
export function formatDateTimeDDMMYYYYHHMM(date?: Date | null, locale?: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString(locale || undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} ${timePart}`;
}

export function parseSessionDateTime(sessionDateTime?: string, scheduledIso?: string): Date | null {
  if (scheduledIso) {
    const d = isoStringToDate(scheduledIso);
    if (d) return d;
  }

  if (!sessionDateTime) return null;
  const trimmed = sessionDateTime.trim();

  // Fast-path: try Date.parse
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return new Date(parsed);

  // Try DD/MM/YYYY [HH:MM]
  const parts = trimmed.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] ?? '';
  const m = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = parseInt(m[3], 10);
    let hour = 0;
    let minute = 0;
    const tm = timePart.match(/^(\d{1,2}):(\d{2})$/);
    if (tm) {
      hour = parseInt(tm[1], 10);
      minute = parseInt(tm[2], 10);
    }
    return new Date(year, month, day, hour, minute);
  }

  // Time-only HH:MM -> treat as today
  const tmOnly = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (tmOnly) {
    const hh = parseInt(tmOnly[1], 10);
    const mm = parseInt(tmOnly[2], 10);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
  }

  return null;
}

/**
 * Format timestamp to relative time string (e.g., "Vừa xong", "5 phút trước")
 * @param timestamp - ISO timestamp string
 * @param format - Format type: 'full' (with "trước") or 'short' (without "trước")
 * @param locale - Locale string (default: 'vi-VN')
 * @returns Formatted time string
 */
export function formatRelativeTime(
  timestamp: string | null,
  format: 'full' | 'short' = 'full',
  locale = 'vi-VN',
): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();

  if (isNaN(date.getTime())) return '';

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Vừa xong';
  }
  if (diffMins < 60) {
    return format === 'full' ? `${diffMins} phút trước` : `${diffMins} phút`;
  }
  if (diffHours < 24) {
    return format === 'full' ? `${diffHours} giờ trước` : `${diffHours} giờ`;
  }
  if (diffDays < 7) {
    return format === 'full' ? `${diffDays} ngày trước` : `${diffDays} ngày`;
  }

  // Format as date
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
