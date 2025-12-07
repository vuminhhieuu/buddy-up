import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { ScreenContainer, Spacer, Loading } from '../../components/ui';
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
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime(),
      ),
    [sessions],
  );

  if (loading) {
    return (
      <ScreenContainer>
        <Loading />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <BackButton
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={{
            width: 35,
            height: 35,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: theme.spacing[2],
            alignSelf: 'flex-start',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 0,
            shadowOpacity: 0,
          }}
        />
        <Text variant="h2" style={{ fontWeight: '700' }}>
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
                  // If you want to match the CreateSessionScreen's full width, ensure parent padding is correct
                }}
              />
            )}
          />
        )}
        {activeTab === 1 && <MonthView sessions={sessions} />}
        {activeTab > 1 && <Text>{t('upcoming.notImplemented')}</Text>}
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
    padding: 4,
    alignSelf: 'center',
    marginBottom: 8,
    gap: 0,
  },
  tabButton: {
    paddingVertical: 8,
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
