import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Pressable, View, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Text, Spacer, Button, Card } from '../../components/ui';
import { useTranslation } from 'react-i18next';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { useTheme } from '../../styles';
import { useAppSelector } from '../../store/hooks';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { BackButton } from '../../components/navigation/BackButton';
import { fetchFriends, type Friend } from '../../services/connections';

const SUPPORT_EMAIL = '22520451@gm.uit.edu.vn';

const SUPPORT_EMAIL = '22520451@gm.uit.edu.vn';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileSettings'>;
type RouteProps = RouteProp<ProfileStackParamList, 'ProfileSettings'>;

const SECTION_TRANSLATION_KEYS: Record<string, string> = {
  profile: 'settings.editProfile',
  friends: 'settings.friends',
  notifications: 'settings.notifications',
  security: 'settings.security',
  language: 'settings.language',
  help: 'settings.help',
};

export const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation('profile');
  const section = route.params?.section ?? 'profile';

  const { theme } = useTheme();
  const { userId } = useAppSelector((s) => s.auth);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(
    async (showSpinner = false) => {
      if (!userId) return;
      setError(null);
      if (showSpinner) setLoading(true);
      try {
        const data = await fetchFriends(userId);
        setFriends(data);
      } catch (err) {
        setError(
          t('settings.loadFriendsError', { defaultValue: 'Không thể tải danh sách bạn bè' }),
        );
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [userId, t],
  );

  useEffect(() => {
    if (section === 'friends' && userId) {
      void loadFriends(true);
    }
  }, [section, userId, loadFriends]);

  const handleRemoveFriend = (connectionId: string) => {
    // UI only - no functionality
  };

  const handleBlockFriend = (connectionId: string, name: string) => {
    // UI only - no functionality
  };

  const renderFriends = () => (
    <View>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text variant="h4" style={styles.headerTitle}>
          {t('settings.friends')}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <Spacer size={4} />
      {error ? (
        <Text variant="body" style={{ color: theme.colors.semantic.error }}>
          {error}
        </Text>
      ) : null}
      <View style={styles.friendList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary[500]} />
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="body" color="secondary">
              {t('settings.noFriends', { defaultValue: 'Chưa có bạn nào' })}
            </Text>
          </View>
        ) : (
          friends.map((f) => (
            <Card key={f.connectionId} style={styles.friendCard} padding={4}>
              <View style={styles.friendRow}>
                <View style={styles.friendInfo}>
                  <Avatar uri={f.avatarUrl} name={f.displayName} size="lg" />
                  <Spacer horizontal size={3} />
                  <View>
                    <Text variant="body" style={{ fontWeight: '600', fontSize: 16 }}>
                      {f.displayName}
                    </Text>
                  </View>
                </View>
                <View style={styles.friendActions}>
                  <Pressable
                    onPress={() => handleRemoveFriend(f.connectionId)}
                    style={[
                      styles.actionButton,
                      {
                        borderColor: theme.colors.primary[500],
                        backgroundColor: theme.colors.primary[50],
                      },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.primary[700], fontWeight: '700' }}
                    >
                      {t('settings.remove', { defaultValue: 'Xóa' })}
                    </Text>
                  </Pressable>
                  <Spacer horizontal size={2} />
                  <Pressable
                    onPress={() => handleBlockFriend(f.connectionId, f.displayName)}
                    style={[
                      styles.actionButton,
                      {
                        borderColor: theme.colors.semantic.error,
                        backgroundColor: theme.colors.primary[50],
                      },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.semantic.error, fontWeight: '700' }}
                    >
                      {t('settings.block', { defaultValue: 'Chặn' })}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </View>
  );

  const renderSecurity = () => (
    <View>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text variant="h4" style={styles.headerTitle}>
          {t('settings.security')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Spacer size={4} />

      <Card style={styles.card}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {t('settings.devices', { defaultValue: 'Thiết bị đăng nhập' })}
        </Text>
        <Spacer size={2} />
        {[{ name: 'Pixel 6 • Android' }, { name: 'MacBook • Chrome' }].map((d, idx) => (
          <View key={idx}>
            <View style={styles.settingRow}>
              <Text variant="body" color="secondary">
                {d.name}
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    t('settings.security'),
                    t('settings.removeDevice', {
                      defaultValue: 'Đã ký hiệu xóa thiết bị (UI only).',
                    }),
                  )
                }
                style={[styles.actionButton, { borderColor: theme.colors.border }]}
              >
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.text.secondary, fontWeight: '600' }}
                >
                  {t('settings.remove', { defaultValue: 'Gỡ' })}
                </Text>
              </Pressable>
            </View>
            {idx < 1 && <Spacer size={2} />}
          </View>
        ))}
      </Card>

      <Spacer size={4} />

      <Card style={styles.card}>
        <Button
          label={t('settings.logoutAll', { defaultValue: 'Đăng xuất tất cả thiết bị' })}
          onPress={() =>
            Alert.alert(
              t('settings.security'),
              t('settings.logoutAllConfirm', {
                defaultValue: 'Đã gửi yêu cầu đăng xuất (UI only)',
              }),
            )
          }
          variant="secondary"
        />
      </Card>
    </View>
  );

  const renderHelp = () => (
    <View>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text variant="h4" style={styles.headerTitle}>
          {t('settings.help')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Spacer size={4} />

      <Card style={styles.card}>
        <Button
          label={t('settings.contactSupport', { defaultValue: 'Liên hệ hỗ trợ' })}
          onPress={() => Alert.alert(t('settings.help'), `Hãy gửi email tới ${SUPPORT_EMAIL}`)}
        />
      </Card>

      <Spacer size={3} />

      <Card style={styles.card}>
        <Button
          label={t('settings.reportIssue', { defaultValue: 'Báo lỗi' })}
          onPress={() =>
            Alert.alert(t('settings.help'), `Hãy gửi phản hồi tới email ${SUPPORT_EMAIL}`)
          }
          style={[styles.dangerButton, { backgroundColor: theme.colors.semantic.error }]}
          labelStyle={{ color: theme.colors.text.inverse, fontWeight: '700' }}
        />
      </Card>
    </View>
  );

  return (
    <ScreenContainer scroll>
      {section === 'friends' && renderFriends()}
      {section === 'security' && renderSecurity()}
      {section === 'help' && renderHelp()}

      {section !== 'friends' && section !== 'security' && section !== 'help' && (
        <Text variant="body" color="secondary">
          {t('settings.placeholder')}
        </Text>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    padding: 12,
  },
  friendCard: {
    marginBottom: 16,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  friendList: {
    marginTop: 12,
  },
  dangerButton: {
    // color applied via inline theme.colors.semantic.error
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpItem: {
    paddingVertical: 10,
  },
});
