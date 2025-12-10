import i18n from '../../../config/i18n';
import type { NotificationPayload } from '../../../types/notifications';
import { NotificationType } from '../../../types/notifications';

export interface PrepareSessionReminderParams {
  sessionId: string;
  startIso: string;
  locale?: string; // 'vi' | 'en' etc.
  sessionTitle?: string;
  titleOverride?: string;
}

export function prepareSessionReminderNotification(
  params: PrepareSessionReminderParams,
): NotificationPayload {
  const { sessionId, startIso, locale = 'vi', sessionTitle, titleOverride } = params;

  // Use i18n fixed translator for the provided locale and 'session' namespace
  const t = i18n.getFixedT(locale, 'session');

  const startDate = new Date(startIso);
  const timeStr = startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const title = titleOverride || t('reminderTitle');
  const body = t('reminderBody', { time: timeStr, title: sessionTitle });

  return {
    title,
    body,
    data: {
      type: NotificationType.SESSION_REMINDER,
      sessionId,
      sessionTitle,
    },
  } as NotificationPayload;
}
