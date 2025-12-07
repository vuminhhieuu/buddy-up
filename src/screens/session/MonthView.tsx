import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
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
  // calendar strings live in the 'shared' namespace
  const { t } = useTranslation('shared');
  const navigation: any = useNavigation();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<{ date: number; events: any[] } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const days = useMemo(() => getMonthDays(year, month, sessions), [year, month, sessions]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const offset = (firstDayOfMonth + 6) % 7;
  const prevMonthDays: Array<any> = [];
  for (let i = 0; i < offset; i++)
    prevMonthDays.push({ date: null, events: [], isOtherMonth: true });
  const grid = [...prevMonthDays, ...days.map((d) => ({ ...d, isOtherMonth: false }))];
  while (grid.length % 7 !== 0) grid.push({ date: null, events: [], isOtherMonth: true });

  const weeks: any[] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  const dayNamesRaw = t('calendar.dayNames', { returnObjects: true });
  const dayNames = Array.isArray(dayNamesRaw) ? (dayNamesRaw as string[]) : [];

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
        <Text style={styles.headerText}>
          {t('calendar.month')} {month + 1}
        </Text>
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
        {t('calendar.month')} {month + 1} {t('calendar.year')} {year}
      </Text>

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
              return (
                <Pressable
                  key={j}
                  style={[styles.dayCell, cell.isOtherMonth && styles.otherMonthCell]}
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
                {t('calendar.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral[50], paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  headerText: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.secondary[500],
    marginHorizontal: 12,
  },
  subHeader: { textAlign: 'center', color: COLORS.neutral[700], fontSize: 14, marginBottom: 4 },
  arrowBtn: { padding: 6, borderRadius: 6, backgroundColor: COLORS.neutral[100] },
  arrow: { fontSize: 18, color: COLORS.secondary[500] },
  calendar: { padding: 8 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: COLORS.secondary[500],
    fontSize: 13,
    paddingVertical: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 0.35,
    margin: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    backgroundColor: COLORS.neutral[50],
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 6,
  },
  otherMonthCell: { backgroundColor: COLORS.neutral[100], borderColor: COLORS.neutral[400] },
  dayText: { fontWeight: '700', fontSize: 15, alignSelf: 'flex-start' },
  eventsContainer: { width: '100%', alignItems: 'center', marginTop: 4 },
  eventBadge: {
    backgroundColor: COLORS.secondary[50],
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
    maxWidth: '100%',
  },
  eventText: { fontSize: 11, color: COLORS.secondary[500], fontWeight: '600' },
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
  modalTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  closeBtn: {
    backgroundColor: COLORS.secondary[500],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'center',
  },
});

export default MonthView;
