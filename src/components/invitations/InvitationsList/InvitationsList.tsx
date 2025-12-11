import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInvitations } from '../../../hooks/useInvitations';
import Toast from 'react-native-toast-message';
import { useTranslation, Trans } from 'react-i18next';
import { useTheme } from '../../../styles';
import { supabase } from '../../../config/supabase';
import { useAppSelector } from '../../../store/hooks';
import { notificationRouter } from '../../../services/notifications/NotificationRouter';
import type { NotificationData } from '../../../types/notifications';
import { Bell, Calendar, Users, Award, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: NotificationData;
  read: boolean;
  created_at: string;
  // For invitations
  isInvitation?: boolean;
  session_id?: string;
  creator_name?: string;
  creator_avatar?: string;
}

export const InvitationsList: React.FC = () => {
  const { t: tInvitations } = useTranslation('invitations');
  const { t: tNotifications } = useTranslation('notifications');
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const themedStyles = styles(theme);
  const userId = useAppSelector((state) => state.auth.userId);
  const {
    invitations,
    loading: invitationsLoading,
    acceptInvitation,
    declineInvitation,
  } = useInvitations();

  const [allItems, setAllItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllItems = useCallback(async () => {
    if (!userId) return;

    try {
      let items: Notification[] = [];

      // 1. Add invitations (pending)
      if (invitations && invitations.length > 0) {
        const invitationItems: Notification[] = invitations.map((inv: any) => ({
          id: `invitation_${inv.session_id}`,
          user_id: userId,
          type: 'session_invitation',
          title: '',
          body: '',
          data: {
            type: 'session_invitation' as any,
            sessionId: inv.session_id,
            sessionTitle: inv.title,
            creatorName: inv.creator_name,
          },
          read: false,
          created_at: inv.created_at,
          isInvitation: true,
          session_id: inv.session_id,
          creator_name: inv.creator_name,
          creator_avatar: inv.creator_avatar,
        }));

        items = [...invitationItems];
      }

      // 2. Load notifications from database
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'chat_message') // Exclude chat messages
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (notificationsData) {
        items = [...items, ...notificationsData];
      }

      // 3. Sort by created_at descending (newest first)
      items.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Descending: newest first
      });

      setAllItems(items);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, invitations]);

  useEffect(() => {
    if (!invitationsLoading) {
      loadAllItems();
    }
  }, [invitationsLoading, loadAllItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllItems();
  };

  // Invitation handlers
  const handleInvitationPress = (invitation: Notification) => {
    navigation.navigate('SessionDetail', {
      sessionId: invitation.session_id,
      readOnly: true,
      fromNotification: true,
    });
  };

  const handleAccept = async (sessionId: string) => {
    const ok = await acceptInvitation(sessionId);
    if (ok) {
      Toast.show({ type: 'success', text1: tInvitations('accepted') });
      // No need to call loadAllItems() - it will auto-reload when invitations change
    }
  };

  const handleDecline = async (sessionId: string) => {
    const ok = await declineInvitation(sessionId);
    if (ok) {
      Toast.show({ type: 'info', text1: tInvitations('declined') });
      // No need to call loadAllItems() - it will auto-reload when invitations change
    }
  };

  // Notification handlers
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id);

      // Update local state
      setAllItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    }

    // Route to appropriate screen
    notificationRouter.routeNotification(notification.data);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) throw error;

      setAllItems((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Lỗi', 'Không thể xóa thông báo. Vui lòng thử lại.');
    }
  };

  const confirmDelete = (notification: Notification) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => handleDeleteNotification(notification.id),
        },
      ],
      { cancelable: true },
    );
  };

  const renderRightActions = (notification: Notification) => {
    return (
      <Pressable style={themedStyles.deleteButton} onPress={() => confirmDelete(notification)}>
        <Trash2 size={24} color="#fff" />
        <Text style={themedStyles.deleteButtonText}>Xóa</Text>
      </Pressable>
    );
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 24, color: theme.colors.primary[500] };
    switch (type) {
      case 'session_reminder':
      case 'session_invitation':
      case 'session_cancelled':
        return <Calendar {...iconProps} />;
      case 'buddy_request':
      case 'buddy_accepted':
      case 'buddy_rejected':
        return <Users {...iconProps} />;
      case 'achievement_unlocked':
        return <Award {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tNotifications('justNow');
    if (diffMins < 60) return tNotifications('minutesAgo', { count: diffMins });
    if (diffHours < 24) return tNotifications('hoursAgo', { count: diffHours });
    if (diffDays < 7) return tNotifications('daysAgo', { count: diffDays });

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getLocalizedContent = (notification: Notification) => {
    const { type, data } = notification;
    const typeKey = type.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    try {
      switch (type) {
        case 'session_reminder':
          return {
            title: tNotifications(`${typeKey}.title`),
            body: tNotifications(`${typeKey}.body`, { sessionTitle: data.sessionTitle || 'N/A' }),
          };
        case 'session_invitation':
          return {
            title: tNotifications(`${typeKey}.title`),
            body: tNotifications(`${typeKey}.body`, {
              creatorName: data.creatorName || 'Someone',
              sessionTitle: data.sessionTitle || 'N/A',
            }),
          };
        case 'session_cancelled':
          return {
            title: tNotifications(`${typeKey}.title`),
            body: tNotifications(`${typeKey}.body`, { sessionTitle: data.sessionTitle || 'N/A' }),
          };
        case 'buddy_request':
          return {
            title: tNotifications(`${typeKey}.title`),
            body: tNotifications(`${typeKey}.body`, { senderName: data.senderName || 'Someone' }),
          };
        case 'buddy_accepted':
          return {
            title: tNotifications(`${typeKey}.title`),
            body: tNotifications(`${typeKey}.body`, {
              accepterName: data.accepterName || 'Someone',
            }),
          };
        case 'achievement_unlocked':
          return {
            title: tNotifications(`${typeKey}.title`),
            body: tNotifications(`${typeKey}.body`, {
              achievementName: data.achievementName || 'N/A',
            }),
          };
        default:
          return { title: notification.title, body: notification.body };
      }
    } catch (error) {
      return { title: notification.title, body: notification.body };
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    // Render invitation item
    if (item.isInvitation) {
      return (
        <Pressable style={themedStyles.card} onPress={() => handleInvitationPress(item)}>
          <View style={themedStyles.row}>
            <View style={themedStyles.avatarCircle}>
              {item.creator_avatar ? (
                <Image
                  source={{ uri: item.creator_avatar }}
                  style={themedStyles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={themedStyles.avatarText}>{item.creator_name?.charAt(0) || 'U'}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={themedStyles.inviteText} numberOfLines={2} ellipsizeMode="tail">
                <Trans
                  i18nKey="invitationText"
                  ns="invitations"
                  values={{ title: item.data.sessionTitle, creatorName: item.creator_name }}
                  components={{
                    1: <Text style={themedStyles.bold} />,
                    3: <Text style={themedStyles.bold} />,
                  }}
                />
              </Text>
              <Text style={themedStyles.time}>{formatTime(item.created_at)}</Text>
            </View>
          </View>
          <View style={themedStyles.actionsRow}>
            <Pressable
              style={themedStyles.acceptBtn}
              onPress={() => handleAccept(item.session_id!)}
            >
              <Text style={themedStyles.acceptText}>{tInvitations('accept')}</Text>
            </Pressable>
            <Pressable
              style={themedStyles.declineBtn}
              onPress={() => handleDecline(item.session_id!)}
            >
              <Text style={themedStyles.declineText}>{tInvitations('decline')}</Text>
            </Pressable>
          </View>
        </Pressable>
      );
    }

    // Render notification item
    const localizedContent = getLocalizedContent(item);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <Pressable
          style={[themedStyles.card, !item.read && themedStyles.unreadCard]}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={themedStyles.row}>
            <View style={themedStyles.iconContainer}>{getNotificationIcon(item.type)}</View>
            <View style={themedStyles.content}>
              <Text style={[themedStyles.title, !item.read && themedStyles.unreadTitle]}>
                {localizedContent.title}
              </Text>
              <Text style={themedStyles.body} numberOfLines={2}>
                {localizedContent.body}
              </Text>
              <Text style={themedStyles.time}>{formatTime(item.created_at)}</Text>
            </View>
            {!item.read && <View style={themedStyles.unreadDot} />}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  if (loading || invitationsLoading) {
    return <ActivityIndicator style={{ marginTop: theme.spacing[8] }} />;
  }

  if (allItems.length === 0) {
    return (
      <View style={themedStyles.emptyContainer}>
        <Bell size={48} color={theme.colors.text.tertiary} />
        <Text style={themedStyles.emptyText}>{tNotifications('noNotifications')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={allItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={themedStyles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary[500]}
        />
      }
    />
  );
};

const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    listContainer: {
      padding: theme.spacing[4],
    },
    avatarImg: {
      width: theme.sizes.avatar.md,
      height: theme.sizes.avatar.md,
      borderRadius: theme.sizes.avatar.md / 2,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing[4],
      padding: theme.spacing[4],
      ...theme.shadows.sm,
    },
    unreadCard: {
      backgroundColor: theme.colors.primary[50],
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary[500],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing[2],
    },
    avatarCircle: {
      width: theme.sizes.avatar.md,
      height: theme.sizes.avatar.md,
      borderRadius: theme.sizes.avatar.md / 2,
      backgroundColor: theme.colors.primary[500],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing[3],
    },
    avatarText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.weights.bold,
      fontSize: theme.typography.scale.lg,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary[100],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing[3],
    },
    content: {
      flex: 1,
    },
    inviteText: {
      fontSize: theme.typography.scale.base,
      color: theme.colors.text.primary,
      flexShrink: 1,
      flexWrap: 'wrap',
      marginBottom: theme.spacing[1],
    },
    title: {
      fontSize: theme.typography.scale.base,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing[1],
    },
    unreadTitle: {
      fontWeight: theme.typography.weights.bold,
    },
    body: {
      fontSize: theme.typography.scale.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing[1],
      lineHeight: 20,
    },
    bold: {
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    time: {
      fontSize: theme.typography.scale.xs,
      color: theme.colors.text.tertiary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary[500],
      marginLeft: theme.spacing[2],
      marginTop: 6,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing[2],
      paddingTop: theme.spacing[2],
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    acceptBtn: {
      backgroundColor: theme.colors.primary[500],
      borderRadius: theme.radius.sm,
      paddingVertical: theme.spacing[1] + 2,
      paddingHorizontal: theme.spacing[4],
      marginRight: theme.spacing[2],
    },
    acceptText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.weights.bold,
    },
    declineBtn: {
      backgroundColor: theme.colors.semantic.error,
      borderRadius: theme.radius.sm,
      paddingVertical: theme.spacing[1] + 2,
      paddingHorizontal: theme.spacing[4],
    },
    declineText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.weights.bold,
    },
    deleteButton: {
      backgroundColor: theme.colors.error || '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginBottom: theme.spacing[4],
      borderRadius: theme.radius.md,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: theme.typography.scale.xs,
      fontWeight: theme.typography.weights.semibold,
      marginTop: theme.spacing[1],
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: theme.spacing[12],
    },
    emptyText: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.scale.lg,
      marginTop: theme.spacing[4],
    },
  });
