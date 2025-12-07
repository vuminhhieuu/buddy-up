import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../styles/tokens';
import { SessionCard } from '../../components/session/SessionCard';

function getMonthDays(year: number, month: number, sessions: any[]) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [] as Array<{ date: number; events: any[] }>;
  for (let d = 1; d <= lastDay; d++) {
    const events = sessions.filter((s) => {
      const sd = new Date(s.scheduledStart);
      return sd.getFullYear() === year && sd.getMonth() === month && sd.getDate() === d;
    });
    days.push({ date: d, events });
  }
  return days;
}

const MonthView: React.FC<{ sessions: any[] }> = ({ sessions }) => {
  const { t, i18n } = useTranslation('shared');
  const tr = (key: string, fallback: string) => {
    try {
      const v = t(key);
      if (typeof v === 'string' && v !== key) return v;
    } catch (e) {
      // ignore
    }
    return fallback;
  };
  const capitalize = (s: any) => {
    if (typeof s !== 'string' || s.length === 0) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const navigation: any = useNavigation();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<{ date: number; events: any[] } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(year);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() => Math.floor(year / 10) * 10);

  const days = useMemo(() => getMonthDays(year, month, sessions), [year, month, sessions]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const offset = (firstDayOfMonth + 6) % 7;
  const prevMonthDays: Array<any> = [];
  if (offset > 0) {
    const prevMonthDate = new Date(year, month, 0);
    const prevLastDay = prevMonthDate.getDate();
    for (let i = 0; i < offset; i++) {
      const dayNum = prevLastDay - offset + 1 + i;
      prevMonthDays.push({ date: dayNum, events: [], isOtherMonth: true });
    }
  }
  const grid = [...prevMonthDays, ...days.map((d) => ({ ...d, isOtherMonth: false }))];
  let nextDay = 1;
  while (grid.length % 7 !== 0) {
    grid.push({ date: nextDay, events: [], isOtherMonth: true });
    nextDay += 1;
  }

  const weeks: any[] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  const dayNamesRaw = t('calendar.dayNames', { returnObjects: true });
  const dayNames = Array.isArray(dayNamesRaw) ? (dayNamesRaw as string[]) : [];

  const monthNamesRaw = t('calendar.monthNames', { returnObjects: true });
  const monthNames = Array.isArray(monthNamesRaw)
    ? (monthNamesRaw as string[])
    : Array.from({ length: 12 }, (_, i) => {
        const lang = i18n?.language ?? undefined;
        try {
          return new Date(0, i).toLocaleString(lang || undefined, { month: 'short' });
        } catch (e) {
          return new Date(0, i).toLocaleString('default', { month: 'short' });
        }
      });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            setMonth((m) => {
              if (m === 0) {
                setYear((y) => y - 1);
                return 11;
              }
              return m - 1;
            })
          }
          style={styles.arrowBtn}
        >
          <Text style={styles.arrow}>{'\u25C0'}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setPickerYear(year);
            setShowMonthPicker(true);
          }}
          style={({ pressed }) => [styles.headerText, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.headerText}>
            {t('calendar.month')} {month + 1}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            setMonth((m) => {
              if (m === 11) {
                setYear((y) => y + 1);
                return 0;
              }
              return m + 1;
            })
          }
          style={styles.arrowBtn}
        >
          <Text style={styles.arrow}>{'\u25B6'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subHeader}>
        {t('calendar.month')} {month + 1} {capitalize(t('calendar.year'))} {year}
      </Text>

      <View style={styles.calendarContainer}>
        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {dayNames.map((d: string, idx: number) => (
              <Text key={idx} style={styles.weekDay}>
                {d}
              </Text>
            ))}
          </View>

          {weeks.map((week, i) => (
            <View key={i} style={styles.weekRow}>
              {week.map((cell: any, j: number) => {
                const isToday =
                  !cell.isOtherMonth &&
                  cell.date === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();
                const isLastCol = j === week.length - 1;
                const isLastRow = i === weeks.length - 1;
                return (
                  <Pressable
                    key={j}
                    style={[
                      styles.dayCell,
                      cell.isOtherMonth && styles.otherMonthCell,
                      !isLastCol && styles.cellBorderRight,
                      !isLastRow && styles.cellBorderBottom,
                    ]}
                    disabled={cell.isOtherMonth || !cell.date}
                    onPress={() => {
                      if (cell && cell.date) {
                        setSelectedDay(cell);
                        if (cell.events.length > 0) setShowModal(true);
                      }
                    }}
                  >
                    <Text style={[styles.dayText, { color: isToday ? '#1976d2' : '#222' }]}>
                      {cell.date ?? ''}
                    </Text>
                    <View style={styles.eventsContainer}>
                      {cell.events?.slice(0, 2).map((ev: any, idx: number) => (
                        <View key={idx} style={styles.eventBadge}>
                          <Text style={styles.eventText} numberOfLines={1}>
                            {ev.title || ev.subject}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('calendar.scheduleFor', { date: `${selectedDay?.date}/${month + 1}/${year}` })}
            </Text>
            {selectedDay?.events.map((ev: any, idx: number) => (
              <SessionCard
                key={ev.id ?? idx}
                session={ev}
                onPress={() => navigation.navigate('SessionDetail', { sessionId: ev.id })}
                style={{ marginBottom: 8 }}
              />
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {tr('calendar.close', 'Close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Month picker modal (reintroduced) */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerContent}>
            <View style={styles.monthTitleRowCentered}>
              <Pressable onPress={() => setPickerYear((y) => y - 1)} style={styles.yearNavBtn}>
                <Text style={[styles.arrow, { lineHeight: 32, textAlignVertical: 'center' }]}>
                  {'\u25C0'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowMonthPicker(false);
                  setShowYearPicker(true);
                  setYearPageStart(Math.floor(pickerYear / 10) * 10);
                }}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 32,
                  paddingHorizontal: 4,
                }}
              >
                <View
                  style={{
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 64,
                  }}
                >
                  <Text
                    style={[
                      styles.monthPickerTitle,
                      {
                        lineHeight: 32,
                        textAlignVertical: 'center',
                        color: '#6DD400',
                        fontWeight: '700',
                      },
                    ]}
                  >{`${capitalize(t('calendar.year'))} ${pickerYear}`}</Text>
                </View>
              </Pressable>

              <Pressable onPress={() => setPickerYear((y) => y + 1)} style={styles.yearNavBtn}>
                <Text style={[styles.arrow, { lineHeight: 32, textAlignVertical: 'center' }]}>
                  {'\u25B6'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.monthGrid}>
              {monthNames.map((mName, idx) => {
                const active = idx === month && pickerYear === year;
                const isCurrentMonth =
                  idx === today.getMonth() && pickerYear === today.getFullYear();
                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setMonth(idx);
                      setYear(pickerYear);
                      setShowMonthPicker(false);
                    }}
                    style={[
                      styles.monthButton,
                      active && styles.monthButtonActive,
                      isCurrentMonth && styles.currentMonthButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthButtonText,
                        active && styles.monthButtonTextActive,
                        isCurrentMonth && styles.currentMonthText,
                      ]}
                    >
                      {mName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMonthPicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {tr('calendar.close', 'Close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Year picker modal (decade grid, 3x4) */}
      {showYearPicker && (
        <Modal
          visible={showYearPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.monthPickerContent}>
              {/* Header row with left/right triangles and centered decade title */}
              <View style={{ width: '100%', marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 44,
                  }}
                >
                  <Pressable
                    onPress={() => setYearPageStart((s) => s - 12)}
                    style={[
                      styles.yearNavBtn,
                      { marginRight: 12, opacity: yearPageStart <= 0 ? 0.3 : 1 },
                    ]}
                    disabled={yearPageStart <= 0}
                  >
                    <Text
                      style={{ fontSize: 20, color: '#6DD400', fontWeight: '700', lineHeight: 28 }}
                    >
                      {'\u25C0'}
                    </Text>
                  </Pressable>

                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: COLORS.primary[500],
                      textAlign: 'center',
                      marginHorizontal: 4,
                    }}
                  >
                    {`${yearPageStart} – ${yearPageStart + 11}`}
                  </Text>

                  <Pressable
                    onPress={() => setYearPageStart((s) => s + 12)}
                    style={[styles.yearNavBtn, { marginLeft: 12 }]}
                  >
                    <Text
                      style={{ fontSize: 20, color: '#6DD400', fontWeight: '700', lineHeight: 28 }}
                    >
                      {'\u25B6'}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const y = yearPageStart + i;
                  const isCurrent = y === today.getFullYear();
                  const isSelected = y === pickerYear;
                  return (
                    <Pressable
                      key={y}
                      onPress={() => {
                        setPickerYear(y);
                        setShowYearPicker(false);
                        setShowMonthPicker(true);
                      }}
                      style={{
                        width: 70,
                        height: 44,
                        margin: 4,
                        borderRadius: 10,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? COLORS.primary[500] : COLORS.neutral[300],
                        backgroundColor: isCurrent ? COLORS.primary[50] : '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? COLORS.primary[500] : '#222',
                          fontWeight: '400',
                          fontSize: 16,
                        }}
                      >
                        {y}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowYearPicker(false)}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {tr('calendar.close', 'Close')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  headerText: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.primary[500],
    marginHorizontal: 12,
  },
  subHeader: { textAlign: 'center', color: COLORS.neutral[700], fontSize: 16, marginBottom: 4 },
  arrowBtn: { padding: 6, borderRadius: 6, backgroundColor: 'transparent' },
  arrow: { fontSize: 20, color: COLORS.primary[500], fontWeight: '700' as any },
  calendar: { padding: 2 },
  calendarContainer: {
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    backgroundColor: COLORS.neutral[50],
    paddingVertical: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 2,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: COLORS.primary[500],
    fontSize: 13,
    paddingVertical: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 0.5,
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: COLORS.neutral[50],
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 2,
  },
  otherMonthCell: {
    backgroundColor: COLORS.neutral[100],
    borderColor: COLORS.neutral[400],
    borderRadius: 0,
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: COLORS.neutral[200],
  },
  cellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  dayText: { fontWeight: '700', fontSize: 15, alignSelf: 'flex-start' },
  eventsContainer: { width: '100%', alignItems: 'center', marginTop: 4 },
  eventBadge: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
    maxWidth: '100%',
  },
  eventText: { fontSize: 11, color: COLORS.primary[500], fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.neutral[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'stretch',
  },
  modalTitle: { fontWeight: '700', fontSize: 18, marginBottom: 12, textAlign: 'center' },
  closeBtn: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'center',
  },
  /* month picker styles */
  monthPickerContent: {
    width: '90%',
    backgroundColor: COLORS.neutral[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'stretch',
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitleRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    height: 44,
    paddingHorizontal: 4,
    position: 'relative',
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  yearNavBtn: {
    padding: 6,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  leftNav: { position: 'absolute', left: 12, top: 4, zIndex: 4 },
  rightNav: { position: 'absolute', right: 12, top: 4, zIndex: 4 },
  decadeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary[500],
    flex: 1,
    textAlign: 'center',
  },
  monthPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    color: COLORS.primary[500],
    marginHorizontal: 12,
  },
  monthPickerTitleContainer: { alignItems: 'center', justifyContent: 'center' },
  /* centerBox removed - showing plain year text in header */
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthButton: {
    width: '30%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    backgroundColor: '#fff',
  },
  currentMonthButton: { backgroundColor: COLORS.primary[50], borderRadius: 8 },
  currentMonthText: { color: COLORS.primary[600], fontWeight: '700' },
  yearButton: {
    width: '46%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currentYearButton: { backgroundColor: COLORS.primary[50], borderRadius: 8 },
  currentYearText: { color: COLORS.primary[600], fontWeight: '700' },
  yearSelected: { borderWidth: 2, borderColor: COLORS.primary[500], borderRadius: 8 },
  monthButtonActive: {
    borderWidth: 2,
    borderColor: COLORS.primary[500],
    backgroundColor: 'transparent',
  },
  monthButtonText: { color: '#000', fontWeight: '400', fontSize: 16 },
  monthButtonTextActive: { color: COLORS.primary[500], fontWeight: '400', fontSize: 16 },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  yearButtonActive: { backgroundColor: COLORS.primary[50] },
  yearButtonPlaceholder: {
    width: '46%',
    height: 44,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  yearListContainer: { height: 220, width: '100%' },
  yearListContent: { alignItems: 'center', paddingVertical: 8 },
  yearItem: {
    width: '90%',
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  yearItemActive: {
    backgroundColor: COLORS.primary[100],
    borderWidth: 1,
    borderColor: COLORS.primary[500],
  },
  yearItemText: { color: '#000', fontWeight: '400', fontSize: 16 },
  yearItemTextActive: { color: COLORS.primary[500], fontWeight: '400', fontSize: 16 },
  yearToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  yearChipsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  yearChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.neutral[100],
  },
  yearChipActive: { backgroundColor: COLORS.primary[50] },
});

export default MonthView;
