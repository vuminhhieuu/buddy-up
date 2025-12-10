import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { ScreenContainer, Spacer, Loading, Card } from '../../components/ui';
import { useTheme } from '../../styles';
import { COLORS } from '../../styles/tokens';
import { useAppSelector } from '../../store/hooks';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { fetchAllSessionsForUser, type HomeSessionFull } from '../../services/home';
import { Text } from '../../components/ui/Text/Text';
import { SessionCard } from '../../components/session/SessionCard';
import { BackButton } from '../../components/navigation/BackButton';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import { useTranslation } from 'react-i18next';

type RouteProps = RouteProp<RootStackParamList, 'UpcomingSessionsAll'>;

const UpcomingSessionsAllScreen: React.FC = () => {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const initialTab = route.params?.initialTab ?? 0;
  const userId = useAppSelector((s) => s.auth.userId);
  const [sessions, setSessions] = useState<HomeSessionFull[]>([]);
  const [loading, setLoading] = useState(true);

  const tabLabels = [t('tabs.list'), t('tabs.month'), t('tabs.week'), t('tabs.day')];
  const [activeTab, setActiveTab] = useState<number>(initialTab);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const resp = await fetchAllSessionsForUser(userId);
      setSessions(resp || []);
    } catch (e) {
      console.warn('Failed to load sessions', e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);
  const sortedSessions = useMemo(() => {
    const now = Date.now();

    const parseTime = (iso?: string | null) => {
      if (!iso) return NaN;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? t : NaN;
    };

    const sessionsCopy = [...sessions];

    const ongoing: typeof sessionsCopy = [];
    const upcoming: typeof sessionsCopy = [];
    const past: typeof sessionsCopy = [];

    for (const s of sessionsCopy) {
      const start = parseTime(s.scheduledStart);
      const end = parseTime(s.scheduledEnd ?? s.scheduledStart);

      if (!Number.isNaN(end) && end <= now) {
        past.push(s);
        continue;
      }

      if (!Number.isNaN(start) && start <= now && (Number.isNaN(end) || end > now)) {
        ongoing.push(s);
        continue;
      }

      upcoming.push(s);
    }

    const sortAscByStart = (a: (typeof sessionsCopy)[number], b: (typeof sessionsCopy)[number]) => {
      const ta = parseTime(a.scheduledStart);
      const tb = parseTime(b.scheduledStart);
      if (ta === tb) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta < tb ? -1 : 1;
    };

    const sortAscByEnd = (a: (typeof sessionsCopy)[number], b: (typeof sessionsCopy)[number]) => {
      const ea = parseTime(a.scheduledEnd ?? a.scheduledStart);
      const eb = parseTime(b.scheduledEnd ?? b.scheduledStart);
      if (ea === eb) return 0;
      if (Number.isNaN(ea)) return 1;
      if (Number.isNaN(eb)) return -1;
      return ea < eb ? -1 : 1;
    };

    ongoing.sort(sortAscByStart);
    upcoming.sort(sortAscByStart);
    past.sort(sortAscByEnd);

    return [...ongoing, ...upcoming, ...past];
  }, [sessions]);

  if (loading) {
    return (
      <ScreenContainer>
        <Loading />
      </ScreenContainer>
    );
  }

  const hasAnySessions = sessions.length > 0;

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} accessibilityLabel={t('common.back')} />
        <Text variant="h4" style={{ fontWeight: '700' }}>
          {t('upcoming.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <Spacer size={12} />
      <View style={styles.tabBar}>
        {tabLabels.map((label, idx) => {
          const isActive = activeTab === idx;
          return (
            <Pressable
              key={label}
              onPress={() => setActiveTab(idx)}
              style={[
                styles.tabButton,
                isActive
                  ? {
                      backgroundColor: theme.colors.primary[500],
                    }
                  : {
                      backgroundColor: 'transparent',
                    },
              ]}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: isActive ? theme.colors.text.inverse : theme.colors.text.secondary,
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Spacer size={16} />
      <View style={styles.content}>
        {activeTab === 0 && (
          <FlatList
            data={sortedSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SessionCard
                session={item as HomeSessionFull}
                onPress={() => {
                  navigation.navigate('SessionDetail', { sessionId: item.id });
                }}
                style={{
                  marginBottom: 14,
                  borderRadius: 16,
                  marginHorizontal: 0,
                }}
              />
            )}
          />
        )}
        {activeTab === 1 && <MonthView sessions={sessions} />}
        {activeTab === 2 && <WeekView sessions={sessions} />}
        {activeTab === 3 && <DayView sessions={sessions} />}
        {activeTab > 3 && <Text>{t('upcoming.notImplemented')}</Text>}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutral[100],
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: 'center',
    marginBottom: 6,
    gap: 0,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 999,
    marginHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  content: {
    marginTop: 8,
    flex: 1,
  },
});

export default UpcomingSessionsAllScreen;
