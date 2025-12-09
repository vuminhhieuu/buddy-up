import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatStartEndTimes, formatWeekdayDate } from '../../utils/date';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/tokens';
import type { HomeSessionFull } from '../../services/home';

const SCROLL_END_THRESHOLD = 120;

type WeekViewProps = {
  sessions?: HomeSessionFull[];
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

const formatWeekTabLabel = (start: Date) => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sDay = String(start.getDate()).padStart(2, '0');
  const eDay = String(end.getDate()).padStart(2, '0');
  return { range: `${sDay} - ${eDay}`, monthNumber: end.getMonth() + 1 };
};

const formatWeekTitleLines = (start: Date) => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sDay = String(start.getDate()).padStart(2, '0');
  const eDay = String(end.getDate()).padStart(2, '0');
  return { range: `${sDay} - ${eDay}`, monthNumber: end.getMonth() + 1, year: end.getFullYear() };
};

type SummaryCardProps = {
  selectedWeekStart: Date;
  setSelectedWeekStart: (d: Date) => void;
  weekOptions: Date[];
  onEndReached?: () => void;
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  selectedWeekStart,
  setSelectedWeekStart,
  weekOptions,
  onEndReached,
}) => {
  const { t } = useTranslation('shared');
  const scrollRef = useRef<ScrollView | null>(null);
  const PILL_WIDTH = 96;
  const PILL_GAP = 12;
  const pillLayouts = useRef<Record<number, { x: number; width: number }>>({});

  useEffect(() => {
    const idx = weekOptions.findIndex((w) => w.getTime() === selectedWeekStart.getTime());
    if (idx === -1) return;
    const containerPadding = SPACING[5] ?? 20;
    const layout = pillLayouts.current[idx];
    let scrollX: number;
    if (layout) scrollX = Math.max(0, layout.x - 0);
    else scrollX = Math.max(0, idx * (PILL_WIDTH + PILL_GAP) - containerPadding);
    if (scrollRef.current) {
      try {
        scrollRef.current.scrollTo({ x: scrollX, animated: true } as any);
      } catch (e) {
        console.warn('Scroll to pill failed:', e);
      }
    }
  }, [selectedWeekStart, weekOptions]);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.weekTitleWrapper}>
        {(() => {
          const lines = formatWeekTitleLines(selectedWeekStart);
          const currentWeekStart = startOfWeek(new Date());
          const msPerWeek = 7 * 24 * 60 * 60 * 1000;
          const diffWeeks = Math.round(
            (selectedWeekStart.getTime() - currentWeekStart.getTime()) / msPerWeek,
          );
          const showRelative = diffWeeks === 0 || diffWeeks === -1 || diffWeeks === 1;

          return (
            <View>
              <Text style={styles.weekLabel}>{t('week.label')}</Text>
              <Text style={styles.weekTitleRange}>{`${lines.range} ${lines.monthNumber}`}</Text>
              <Text style={styles.weekTitleMonth}>
                {`${t('calendar.month')} ${selectedWeekStart.getMonth() + 1} ${selectedWeekStart.getFullYear()}`}
              </Text>
              {showRelative ? (
                <Text style={styles.weekRelative}>
                  {diffWeeks === 0
                    ? t('week.this')
                    : diffWeeks === -1
                      ? t('week.prev')
                      : t('week.next')}
                </Text>
              ) : null}
            </View>
          );
        })()}
      </View>

      <View style={styles.weekSelectorWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekSelector}
          onScroll={({ nativeEvent }) => {
            try {
              const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
              const x = contentOffset.x;
              const visibleW = layoutMeasurement.width;
              const totalW = contentSize.width;
              const threshold = SCROLL_END_THRESHOLD;
              if (x + visibleW >= totalW - threshold) {
                onEndReached && onEndReached();
              }
            } catch (e) {
              console.warn('Scroll event handling failed:', e);
            }
          }}
          scrollEventThrottle={200}
        >
          {weekOptions.map((w, idx) => {
            const key = `${w.getFullYear()}-${w.getMonth()}-${w.getDate()}`;
            const isActive = w.getTime() === selectedWeekStart.getTime();
            const label = formatWeekTabLabel(w);
            const monthLabel = `${t('calendar.month')} ${w.getMonth() + 1}`;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedWeekStart(w)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  pillLayouts.current[idx] = { x, width };
                }}
                style={[
                  styles.weekPill,
                  { marginRight: PILL_GAP },
                  isActive ? styles.weekPillActiveLarge : styles.weekPillInactive,
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.weekPillRange, isActive && styles.weekPillRangeActive]}>
                  {label.range}
                </Text>
                <Text style={[styles.weekPillMonth, isActive && styles.weekPillMonthActive]}>
                  {monthLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

type DayListProps = {
  days: Date[];
  sessionsByDate: Map<string, HomeSessionFull[]>;
};

const DayList: React.FC<DayListProps> = ({ days, sessionsByDate }) => {
  return (
    <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
      <View style={styles.list}>
        {days.map((d, idx) => {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const events = sessionsByDate.get(key) ?? [];
          const isLast = idx === days.length - 1;
          return <DayRow key={key} date={d} events={events} isLast={isLast} />;
        })}
      </View>
    </ScrollView>
  );
};

const DayRow: React.FC<{ date: Date; events: HomeSessionFull[]; isLast?: boolean }> = ({
  date,
  events,
  isLast = false,
}) => {
  const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
  const dayNum = date.getDate();
  const dayMonth = `${String(dayNum).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const navigation = useNavigation<any>();
  const { t } = useTranslation('shared');

  return (
    <View style={[styles.dayRow, !isLast && styles.dayRowDivider]}>
      <View style={styles.dayLeft}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Text style={styles.dayNum}>{dayMonth}</Text>
      </View>
      <View style={styles.dayRight}>
        {events.length === 0 ? (
          <View style={styles.allDayBox}>
            <Text style={styles.allDayText}>{t('session.allDay')}</Text>
          </View>
        ) : (
          events.map((ev) => (
            <Pressable
              key={ev.id}
              style={[styles.eventBlock, { backgroundColor: COLORS.primary[50] }]}
              accessibilityRole="button"
              onPress={() => {
                try {
                  navigation.navigate('SessionDetail', { sessionId: ev.id });
                } catch (e) {
                  // ignore navigation errors in case route not available
                }
              }}
            >
              <Text style={styles.eventTitle} numberOfLines={1}>
                {ev.title || ev.subject}
              </Text>
              <Text style={styles.eventTime} numberOfLines={1}>
                {formatStartEndTimes(ev.scheduledStart, ev.scheduledEnd ?? null)}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
};

const WeekView: React.FC<WeekViewProps> = ({ sessions = [] }) => {
  const { t, i18n } = useTranslation('shared');
  const locale = i18n?.language ?? undefined;

  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  useFocusEffect(
    useCallback(() => {
      setSelectedWeekStart(startOfWeek(new Date()));
    }, []),
  );

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedWeekStart]);

  const getWeekOptions = (base: Date) => {
    const year = base.getFullYear();
    const start = startOfWeek(new Date(year, 0, 1));
    const end = new Date(year + 1, 0, 1);
    const opts: Date[] = [];
    let cursor = new Date(start);
    while (cursor < end) {
      opts.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return opts;
  };

  const getWeeksForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStart = startOfWeek(new Date(year, month, 1));
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const opts: Date[] = [];
    let cursor = new Date(monthStart);
    while (cursor <= monthEnd) {
      opts.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return opts;
  };
  const createWeekRange = (center: Date, before = 52, after = 52) => {
    const start = new Date(center);
    start.setDate(start.getDate() - before * 7);
    start.setHours(0, 0, 0, 0);
    const opts: Date[] = [];
    const cursor = new Date(start);
    const total = before + after + 1;
    for (let i = 0; i < total; i++) {
      opts.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return opts;
  };

  const [weekOptions, setWeekOptions] = useState<Date[]>(() =>
    createWeekRange(startOfWeek(new Date()), 52, 52),
  );

  const appendWeeks = (count = 52) => {
    setWeekOptions((prev) => {
      const last = prev[prev.length - 1];
      const out: Date[] = [];
      const cursor = new Date(last);
      cursor.setDate(cursor.getDate() + 7);
      for (let i = 0; i < count; i++) {
        out.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
      return [...prev, ...out];
    });
  };

  const formatWeekTabLabel = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sDay = String(start.getDate()).padStart(2, '0');
    const eDay = String(end.getDate()).padStart(2, '0');
    return { range: `${sDay} - ${eDay}`, monthNumber: end.getMonth() + 1 };
  };

  const formatWeekTitleLines = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sDay = String(start.getDate()).padStart(2, '0');
    const eDay = String(end.getDate()).padStart(2, '0');
    return { range: `${sDay} - ${eDay}`, monthNumber: end.getMonth() + 1, year: end.getFullYear() };
  };

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, HomeSessionFull[]>();
    for (const d of days) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, []);
    }
    for (const s of sessions) {
      if (!s.scheduledStart) continue;
      const sd = new Date(s.scheduledStart);
      const key = `${sd.getFullYear()}-${sd.getMonth()}-${sd.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [sessions, days]);

  return (
    <View style={styles.container}>
      <View style={styles.topFixed}>
        <SummaryCard
          selectedWeekStart={selectedWeekStart}
          setSelectedWeekStart={setSelectedWeekStart}
          weekOptions={weekOptions}
          onEndReached={() => appendWeeks(52)}
        />
      </View>

      <DayList days={days} sessionsByDate={sessionsByDate} />
    </View>
  );
};

export default WeekView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral[50],
    borderWidth: 1.5,
    borderColor: COLORS.neutral[300],
    borderRadius: 12,
  },
  contentContainer: { padding: SPACING[4] },
  weekTitleWrapper: {
    alignItems: 'center',
    paddingTop: SPACING[2],
    paddingBottom: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
    marginBottom: SPACING[2],
  },

  summaryCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingVertical: SPACING[1],
    paddingHorizontal: 0,
    marginBottom: SPACING[2],
  },
  weekTitleRange: {
    fontSize: TYPOGRAPHY.scale.lg,
    fontWeight: '700',
    color: COLORS.neutral[900],
    textAlign: 'center',
  },
  weekTitleMonth: {
    fontSize: TYPOGRAPHY.scale.base,
    color: COLORS.neutral[600],
    marginTop: 2,
    textAlign: 'center',
  },
  weekRelative: {
    marginTop: 6,
    fontSize: TYPOGRAPHY.scale.sm,
    color: COLORS.neutral[600],
    textAlign: 'center',
    fontWeight: '600',
  },
  weekLabel: {
    fontSize: TYPOGRAPHY.scale.sm,
    color: COLORS.neutral[900],
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  list: { gap: 12 },
  topFixed: { paddingHorizontal: SPACING[5], backgroundColor: 'transparent' },
  listScroll: { flex: 1 },
  listContent: { padding: SPACING[5], paddingBottom: 0 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayRowDivider: {
    borderBottomWidth: 4,
    borderBottomColor: COLORS.neutral[100],
    paddingBottom: SPACING[3],
    marginBottom: SPACING[2],
  },
  weekSelectorWrapper: {
    paddingTop: SPACING[2],
    paddingBottom: SPACING[2],
    marginBottom: SPACING[2],
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  weekSelector: { paddingHorizontal: SPACING[5] },
  weekPill: {
    minWidth: 84,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPillActiveLarge: {
    minWidth: 96,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[500],
  },
  weekPillActive: {
    backgroundColor: COLORS.primary[500],
  },
  weekPillInactive: {
    backgroundColor: COLORS.neutral[50],
    borderWidth: 0,
  },
  weekPillRange: { fontWeight: '700', color: COLORS.neutral[900] },
  weekPillMonth: { fontSize: TYPOGRAPHY.scale.sm, color: COLORS.neutral[600], marginTop: 2 },
  weekPillRangeActive: { color: ' COLORS.neutral[0] ' },
  weekPillMonthActive: { color: ' COLORS.neutral[0] ' },
  dayLeft: { width: 72, alignItems: 'flex-start' },
  dayLabel: { color: COLORS.neutral[600], fontSize: TYPOGRAPHY.scale.base },
  dayNum: { fontSize: TYPOGRAPHY.scale.lg, fontWeight: '700', color: COLORS.neutral[900] },
  dayRight: { flex: 1 },
  allDayBox: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 12,
    backgroundColor: COLORS.neutral[50],
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  allDayText: { color: COLORS.neutral[600], fontWeight: '600' },
  eventBlock: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.primary[50],
    borderWidth: 1,
    borderColor: COLORS.primary[100],
  },
  eventTitle: { fontWeight: '700', color: COLORS.neutral[900], marginBottom: 4 },
  eventTime: { color: COLORS.neutral[600], fontSize: TYPOGRAPHY.scale.sm },
});
