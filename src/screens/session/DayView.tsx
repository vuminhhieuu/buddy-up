import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/tokens';
import type { HomeSessionFull } from '../../services/home';
import { isoStringToDate, formatStartEndTimes } from '../../utils/date';

type DayViewProps = {
  sessions?: HomeSessionFull[];
};

const DAY_START = 0;
const DAY_END = 24;
const ROW_HEIGHT = 64;
const TIME_COL_WIDTH = 72;
const MIN_COL_WIDTH = 180;
const SCROLL_OFFSET_ROWS = 1;
const SCROLL_ANIMATION_DELAY = 80;
const EVENT_GAP = 8;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

const DayView: React.FC<DayViewProps> = ({ sessions = [] }) => {
  const { t, i18n } = useTranslation('shared');
  const locale = i18n?.language;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const userInteractedRef = useRef(false);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const weekRangeLabel = useMemo(() => {
    const start = startOfWeek(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale || undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    return `${fmt(start)} - ${fmt(end)}`;
  }, [selectedDate, locale]);

  const eventsForDay = useMemo(() => {
    const dayWindowStart = new Date(selectedDate);
    dayWindowStart.setHours(DAY_START, 0, 0, 0);
    const dayWindowEnd = new Date(selectedDate);
    dayWindowEnd.setHours(DAY_END, 0, 0, 0);

    return sessions.filter((s) => {
      const sStart = isoStringToDate(s.scheduledStart);
      const sEnd = isoStringToDate(s.scheduledEnd ?? s.scheduledStart);
      if (!sStart || !sEnd) return false;
      return sEnd.getTime() > dayWindowStart.getTime() && sStart.getTime() < dayWindowEnd.getTime();
    });
  }, [sessions, selectedDate]);

  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

  const containerHeight = hours.length * ROW_HEIGHT;

  const screenW = Dimensions.get('window').width;
  const gridScrollRef = useRef<ScrollView | null>(null);

  const positionedEvents = useMemo(() => {
    const dayWindowStart = new Date(selectedDate);
    dayWindowStart.setHours(DAY_START, 0, 0, 0);
    const items = eventsForDay
      .map((ev) => {
        const s = isoStringToDate(ev.scheduledStart);
        const e = isoStringToDate(ev.scheduledEnd ?? ev.scheduledStart);
        if (!s || !e) return null;
        const rawStartMin = Math.floor((s.getTime() - dayWindowStart.getTime()) / 60000);
        const rawEndMin = Math.ceil((e.getTime() - dayWindowStart.getTime()) / 60000);
        const totalWindowMinutes = (DAY_END - DAY_START) * 60;
        const startMin = Math.max(0, Math.min(totalWindowMinutes, rawStartMin));
        const endMin = Math.max(0, Math.min(totalWindowMinutes, rawEndMin));
        if (endMin <= startMin) return null;
        return {
          ev,
          id: ev.id,
          startMin,
          endMin,
          top: (startMin / 60) * ROW_HEIGHT,
          height: Math.max(12, ((endMin - startMin) / 60) * ROW_HEIGHT),
        } as const;
      })
      .filter(Boolean) as Array<{
      ev: HomeSessionFull;
      id: string;
      startMin: number;
      endMin: number;
      top: number;
      height: number;
    }>;

    items.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

    const gap = EVENT_GAP;
    const availableWidth = screenW - TIME_COL_WIDTH - SPACING[4] * 2;

    const columnsEnd: number[] = [];
    const assignments: Record<string, number> = {};

    for (const it of items) {
      let placed = false;
      for (let c = 0; c < columnsEnd.length; c++) {
        if (columnsEnd[c] <= it.startMin) {
          assignments[it.id] = c;
          columnsEnd[c] = it.endMin;
          placed = true;
          break;
        }
      }
      if (!placed) {
        assignments[it.id] = columnsEnd.length;
        columnsEnd.push(it.endMin);
      }
    }

    const totalCols = Math.max(1, columnsEnd.length);
    const colWidth = Math.max(MIN_COL_WIDTH, (availableWidth - gap * (totalCols - 1)) / totalCols);

    const positions = new Map<
      string,
      { top: number; height: number; left: number; width: number }
    >();
    let maxRight = 0;

    for (const it of items) {
      const col = assignments[it.id];
      const left = SPACING[4] + col * (colWidth + gap);
      const width = Math.max(40, colWidth);
      positions.set(it.id, { top: it.top, height: it.height, left, width });
      maxRight = Math.max(maxRight, left + width);
    }

    const defaultVisibleWidth = Math.max(0, screenW - TIME_COL_WIDTH - SPACING[4] * 2);
    const contentWidth = Math.max(defaultVisibleWidth, Math.ceil(maxRight + SPACING[4]));

    return { map: positions, contentWidth };
  }, [eventsForDay, selectedDate, screenW]);

  const MIN_EVENT_HEIGHT = 48;

  useEffect(() => {
    if (!gridScrollRef.current) return;
    if (!eventsForDay || eventsForDay.length === 0) return;

    const dayWindowStart = new Date(selectedDate);
    dayWindowStart.setHours(DAY_START, 0, 0, 0);

    let earliestMin = Infinity;
    for (const ev of eventsForDay) {
      const s = isoStringToDate(ev.scheduledStart);
      if (!s) continue;
      const rawStartMin = Math.floor((s.getTime() - dayWindowStart.getTime()) / 60000);
      if (rawStartMin < earliestMin) earliestMin = rawStartMin;
    }
    if (!isFinite(earliestMin)) return;

    const y = Math.max(0, (earliestMin / 60) * ROW_HEIGHT - ROW_HEIGHT * SCROLL_OFFSET_ROWS);
    setTimeout(() => {
      try {
        gridScrollRef.current && gridScrollRef.current.scrollTo({ y, animated: true } as any);
      } catch (e) {
        console.warn('ScrollView scrollTo failed:', e);
      }
    }, SCROLL_ANIMATION_DELAY);
  }, [eventsForDay, selectedDate]);

  const navigation = useNavigation<any>();

  const changeWeek = (deltaDays: number) => {
    userInteractedRef.current = true;
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaDays);
      return d;
    });
  };

  const prevWeek = () => changeWeek(-7);
  const nextWeek = () => changeWeek(7);

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekLabel}>{t('week.label')}</Text>
        <View style={styles.weekRangeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('week.prev')}
            onPress={prevWeek}
            style={styles.arrowBtn}
            hitSlop={8}
          >
            <Text style={styles.arrow}>{'\u25C0'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {}}
            style={styles.weekRangePressable}
          >
            <Text style={styles.weekRange}>{weekRangeLabel}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('week.next')}
            onPress={nextWeek}
            style={styles.arrowBtn}
            hitSlop={8}
          >
            <Text style={styles.arrow}>{'\u25B6'}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.topRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPills}
        >
          {weekDays.map((d) => {
            const isActive =
              d.getFullYear() === selectedDate.getFullYear() &&
              d.getMonth() === selectedDate.getMonth() &&
              d.getDate() === selectedDate.getDate();
            return (
              <Pressable
                key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                style={[styles.dayPill, isActive && styles.dayPillActive]}
                onPress={() => {
                  userInteractedRef.current = true;
                  setSelectedDate(new Date(d));
                }}
              >
                <Text style={[styles.dayPillWeekday, isActive && styles.dayPillWeekdayActive]}>
                  {d.toLocaleDateString(locale || undefined, { weekday: 'short' })}
                </Text>
                <Text style={[styles.dayPillDayNum, isActive && styles.dayPillDayNumActive]}>
                  {String(d.getDate()).padStart(2, '0')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {/* follow button removed */}
      {/* top debug removed for production - DayView now renders hour-based events overlayed on grid */}

      <ScrollView
        ref={(r) => {
          gridScrollRef.current = r;
        }}
        style={styles.gridWrap}
        contentContainerStyle={{ paddingBottom: SPACING[8] }}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
      >
        <View style={[styles.grid, { height: containerHeight }]}>
          {/* time labels column */}
          <View style={styles.timeCol}>
            {hours.map((h) => (
              <View key={h} style={[styles.timeRow, { height: ROW_HEIGHT }]}>
                <Text style={styles.timeLabel}>{String(h).padStart(2, '0')}:00</Text>
              </View>
            ))}
          </View>

          {/* events area (horizontally scrollable when many overlapping events) */}
          <View style={[styles.eventsCol, { width: screenW - TIME_COL_WIDTH }]}>
            <ScrollView
              horizontal
              nestedScrollEnabled={true}
              showsHorizontalScrollIndicator={true}
              snapToInterval={
                (positionedEvents && positionedEvents.contentWidth > 0
                  ? Math.round(
                      positionedEvents.contentWidth /
                        Math.max(1, Math.ceil(positionedEvents.contentWidth / (MIN_COL_WIDTH + 8))),
                    )
                  : MIN_COL_WIDTH) + 8
              }
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ width: positionedEvents.contentWidth, position: 'relative' }}
            >
              {hours.map((h, idx) => (
                <View key={`line-${h}`} style={[styles.hourLine, { top: idx * ROW_HEIGHT }]} />
              ))}

              {eventsForDay.map((ev) => {
                const pos = positionedEvents.map.get(ev.id);
                if (!pos) return null;

                const displayHeight = Math.max(pos.height, MIN_EVENT_HEIGHT);
                let topOffset = Math.round(pos.top - (displayHeight - pos.height) / 2);
                topOffset = Math.max(0, topOffset);
                topOffset = Math.min(topOffset, Math.max(0, containerHeight - displayHeight));

                return (
                  <Pressable
                    key={ev.id}
                    style={[
                      styles.eventBlock,
                      { top: topOffset, height: displayHeight, left: pos.left, width: pos.width },
                    ]}
                    accessibilityRole="button"
                    onPress={() => {
                      try {
                        navigation.navigate('SessionDetail', { sessionId: ev.id });
                      } catch (e) {
                        console.warn('Navigation to SessionDetail failed:', e);
                      }
                    }}
                  >
                    {/* left accent bar */}
                    <View style={styles.eventAccent} />

                    <View style={styles.eventContent}>
                      {/* Minimal: only show the session name (title or subject) */}
                      <Text style={styles.eventTitleOnly} numberOfLines={1}>
                        {(ev as any).title ?? (ev as any).subject}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DayView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral[50],
    borderWidth: 1.5,
    borderColor: COLORS.neutral[300],
    borderRadius: 12,
  },
  weekHeader: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[2],
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
  },
  weekRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },

  weekNavButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* reuse MonthView arrow visuals */
  arrowBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 20, color: COLORS.primary[500], fontWeight: '700' as any },
  weekNavButtonText: {
    fontSize: TYPOGRAPHY.scale.lg,
    color: COLORS.neutral[700],
    fontWeight: '700',
  },
  triangleLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: COLORS.primary[500],
  },
  triangleRight: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: COLORS.primary[500],
  },
  weekLabel: {
    fontSize: TYPOGRAPHY.scale.lg,
    color: COLORS.neutral[900],
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  weekRange: {
    fontSize: TYPOGRAPHY.scale.lg,
    color: COLORS.primary[500],
    fontWeight: '700',
    textAlign: 'center',
  },
  weekRangePressable: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  debugRow: { paddingHorizontal: SPACING[5], paddingVertical: SPACING[2] },
  debugTitle: { fontSize: TYPOGRAPHY.scale.sm, color: COLORS.neutral[600], marginBottom: 6 },
  debugLine: { fontSize: TYPOGRAPHY.scale.sm, color: COLORS.neutral[600] },
  topRow: {
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
  },
  dayPills: { paddingHorizontal: SPACING[5], gap: 12 },
  dayPill: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dayPillActive: {
    backgroundColor: COLORS.primary[500],
  },
  dayPillWeekday: { fontSize: TYPOGRAPHY.scale.sm, color: COLORS.neutral[600] },
  dayPillWeekdayActive: { color: COLORS.neutral[50] },
  dayPillDayNum: { fontSize: TYPOGRAPHY.scale.lg, fontWeight: '700', color: COLORS.neutral[900] },
  dayPillDayNumActive: { color: COLORS.neutral[50] },
  gridWrap: { flex: 1 },
  grid: { flexDirection: 'row', position: 'relative' },
  timeCol: { width: TIME_COL_WIDTH, paddingLeft: SPACING[4], backgroundColor: 'transparent' },
  timeRow: { justifyContent: 'center' },
  timeLabel: { color: COLORS.neutral[600], fontSize: TYPOGRAPHY.scale.sm },
  eventsCol: { flex: 1, position: 'relative', paddingVertical: 0, paddingHorizontal: SPACING[4] },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.neutral[100],
    zIndex: 0,
  },
  eventBlock: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: COLORS.neutral[50],
    borderWidth: 1.5,
    borderColor: COLORS.primary ? COLORS.primary[200] : '#D1FAE5',
    padding: SPACING[3],
    ...SHADOWS.sm,
    elevation: 6,
    marginHorizontal: 0,
    overflow: 'visible',
    zIndex: 20,
  },
  eventAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: COLORS.primary ? COLORS.primary[500] : '#10B981',
    zIndex: 21,
  },
  eventContent: {
    marginLeft: 10,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: SPACING[3],
  },
  eventContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventContentRowCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[3],
  },
  eventTextCol: {
    flex: 1,
    marginLeft: 8,
    paddingRight: SPACING[3],
  },
  eventDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary[500],
  },
  eventTitle: {
    fontWeight: '700',
    color: COLORS.neutral[900],
    marginBottom: 6,
    fontSize: TYPOGRAPHY.scale.lg,
  },
  eventTitleOnly: {
    fontWeight: '700',
    color: COLORS.neutral[900],
    fontSize: TYPOGRAPHY.scale.lg,
    textAlign: 'left',
  },
  eventSubject: {
    fontSize: TYPOGRAPHY.scale.xs,
    color: COLORS.neutral[600],
    marginBottom: 4,
  },
  eventTime: { color: COLORS.neutral[600], fontSize: TYPOGRAPHY.scale.sm, marginBottom: 4 },
  eventTag: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primary ? COLORS.primary[50] : '#ECFDF5',
    borderWidth: 1,
    borderColor: COLORS.primary ? COLORS.primary[200] : '#34D399',
  },
  eventTagText: {
    color: COLORS.primary ? COLORS.primary[700] : '#047857',
    fontSize: TYPOGRAPHY.scale.xs,
    fontWeight: '600',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTimeSmall: { fontSize: TYPOGRAPHY.scale.xs, color: COLORS.neutral[600] },
  eventTagInline: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.primary ? COLORS.primary[50] : '#ECFDF5',
    borderWidth: 1,
    borderColor: COLORS.primary ? COLORS.primary[200] : '#34D399',
  },
  eventTagTextInline: {
    color: COLORS.primary ? COLORS.primary[700] : '#047857',
    fontSize: TYPOGRAPHY.scale.xs,
    fontWeight: '700',
  },
  eventFooterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  eventAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  eventFooterText: { fontSize: TYPOGRAPHY.scale.xs, color: COLORS.neutral[600] },
});
