import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../../components/ui/Text/Text';
import { Button } from '../../components/ui/Button/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2 } from 'lucide-react-native';
import { formatISOToLocal, isoStringToDate, parseSessionDateTime } from '../../utils/date';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// Helper to parse a time string (e.g., "14:30" or "dd/mm/yyyy hh:mm") into a Date object for today
const parseTimeStringToDate = (s?: string): Date | null => {
  if (!s) return null;
  const tm = s.match(/(\d{1,2}):(\d{2})/);
  if (!tm) return null;
  const hh = parseInt(tm[1], 10);
  const mm = parseInt(tm[2], 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
};

// Consolidated function for computing and formatting start/end times
const computeStartEndTimes = (startDate: Date | null | undefined, durationMin?: number) => {
  if (!startDate || !durationMin) return null;
  const start = new Date(startDate.getTime());
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const fmt = (dt: Date) =>
    `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  return { start: fmt(start), end: fmt(end) };
};

// Custom hook to encapsulate session date formatting logic
const useSessionDateFormatting = (
  sessionDateTime: string | undefined,
  scheduledStartIso: string | undefined,
  durationMinutes: number | undefined,
) => {
  return useMemo(() => {
    const dateObj = parseSessionDateTime(sessionDateTime, scheduledStartIso);

    const startEnd = scheduledStartIso
      ? computeStartEndTimes(isoStringToDate(scheduledStartIso), durationMinutes)
      : computeStartEndTimes(dateObj, durationMinutes);

    const fallbackStartEnd =
      startEnd ?? computeStartEndTimes(parseTimeStringToDate(sessionDateTime), durationMinutes);

    const formattedDateOnly = scheduledStartIso
      ? (() => {
          const d = isoStringToDate(scheduledStartIso);
          if (!d) return undefined;
          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
        })()
      : dateObj
        ? `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`
        : undefined;

    return {
      dateObj,
      startEnd,
      fallbackStartEnd,
      formattedDateOnly,
    };
  }, [sessionDateTime, scheduledStartIso, durationMinutes]);
};

/**
 * This component can be used either as a modal (controlled via props)
 * or as a navigation screen. When used via navigation, it will read
 * params from the route: { sessionTitle?: string; sessionDateTime?: string }
 */
export type CreateSessionSuccessProps = {
  visible?: boolean;
  onClose?: () => void;
  sessionTitle?: string;
  sessionDateTime?: string;
};

const CreateSessionSuccessScreen: React.FC<CreateSessionSuccessProps> = ({
  visible: visibleProp,
  onClose: onCloseProp,
  sessionTitle: sessionTitleProp,
  sessionDateTime: sessionDateTimeProp,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const routeParams: any = (route && (route.params as any)) || {};

  const sessionTitle = sessionTitleProp ?? routeParams.sessionTitle;
  const sessionDateTime = sessionDateTimeProp ?? routeParams.sessionDateTime;

  const scheduledStartIso = (routeParams.scheduledStartIso as string) ?? undefined;

  const { t } = useTranslation('session');
  const durationMinutes = (() => {
    const raw = (routeParams.duration as string) ?? undefined;
    const n = raw ? parseInt(raw, 10) : undefined;
    return isNaN(n as number) ? undefined : n;
  })();

  const { dateObj, fallbackStartEnd, formattedDateOnly } = useSessionDateFormatting(
    sessionDateTime,
    scheduledStartIso,
    durationMinutes,
  );

  const weekdayLabel = (() => {
    if (!dateObj) return undefined;
    const day = dateObj.getDay();
    return t(`weekdays.${day}`);
  })();

  const onClose =
    onCloseProp ??
    (() => {
      // Navigate to Home in MainTabs
      (navigation as any).navigate('MainTabs', { screen: 'Home' });
    });
  const visible = typeof visibleProp === 'boolean' ? visibleProp : true;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.iconWrap}>
            <CheckCircle2 size={56} color={theme.colors.primary[500]} />
          </View>
          <Text
            variant="h4"
            style={{
              marginTop: theme.spacing[4],
              fontWeight: '700' as const,
              color: theme.colors.primary[500],
            }}
          >
            {t('successTitle')}
          </Text>

          {sessionTitle ? (
            <Text
              variant="h4"
              style={{
                marginTop: theme.spacing[2],
                fontWeight: '700' as const,
                color: theme.colors.text.primary,
                textAlign: 'center',
              }}
            >
              {sessionTitle}
            </Text>
          ) : null}

          {/* Show weekday + date and start:end on the same line when both available */}
          {dateObj && fallbackStartEnd ? (
            <Text
              variant="h5"
              color="tertiary"
              style={{
                marginTop: theme.spacing[1],
                fontWeight: '600' as const,
                textAlign: 'center',
              }}
            >
              {weekdayLabel ? `${weekdayLabel}, ` : ''}
              {formattedDateOnly} — {fallbackStartEnd.start} - {fallbackStartEnd.end}
            </Text>
          ) : dateObj ? (
            <Text
              variant="h5"
              color="tertiary"
              style={{
                marginTop: theme.spacing[1],
                fontWeight: '600' as const,
                textAlign: 'center',
              }}
            >
              {weekdayLabel ? `${weekdayLabel}, ` : ''}
              {formattedDateOnly}
            </Text>
          ) : sessionDateTime && fallbackStartEnd ? (
            <Text
              variant="h5"
              color="tertiary"
              style={{
                marginTop: theme.spacing[1],
                fontWeight: '600' as const,
                textAlign: 'center',
              }}
            >
              {sessionDateTime} — {fallbackStartEnd.start} : {fallbackStartEnd.end}
            </Text>
          ) : sessionDateTime ? (
            <Text
              variant="h5"
              color="tertiary"
              style={{
                marginTop: theme.spacing[1],
                fontWeight: '600' as const,
                textAlign: 'center',
              }}
            >
              {scheduledStartIso ? formatISOToLocal(scheduledStartIso) : sessionDateTime}
            </Text>
          ) : null}

          {/* Re-add centered descriptive paragraph under the session details per request */}
          <Text variant="body" style={{ marginTop: theme.spacing[3], textAlign: 'center' }}>
            {t('successDescription')}
          </Text>

          <View style={{ width: '100%', marginTop: theme.spacing[6] }}>
            <Button
              label={t('viewSession')}
              onPress={() => {
                alert(t('underDevelopment') ?? 'Feature under development');
              }}
              variant="primary"
              size="lg"
            />
          </View>

          <Pressable onPress={onClose} style={{ marginTop: theme.spacing[4] }}>
            <Text variant="body" color="tertiary" style={{ textAlign: 'center' }}>
              {t('close')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});

export default CreateSessionSuccessScreen;
