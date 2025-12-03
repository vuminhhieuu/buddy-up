import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { Button } from '../../ui/Button/Button';
import { Avatar } from '../../ui';
import { useTheme } from '../../../styles';
import { useInvitations } from '../../../hooks/useInvitations';
import type { SessionInvitation } from '../../../services/invitations';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

type InvitationItemProps = {
  invitation: SessionInvitation;
  onAccept?: (sessionId: string) => Promise<void>;
  onDecline?: (sessionId: string) => Promise<void>;
  onPress?: (invitation: SessionInvitation) => void;
};

const InvitationItem: React.FC<InvitationItemProps> = ({
  invitation,
  onAccept,
  onDecline,
  onPress,
}) => {
  const { theme } = useTheme();
  const [processing, setProcessing] = useState(false);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await onAccept?.(invitation.session_id);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await onDecline?.(invitation.session_id);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Pressable
      onPress={() => onPress?.(invitation)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        },
      ]}
    >
      <View style={styles.header}>
        <Avatar
          size="sm"
          name={invitation.creator_name || 'User'}
          uri={invitation.creator_avatar || undefined}
        />
        <View style={styles.headerText}>
          <Text variant="body" style={styles.title}>
            Bạn có một lời mời tham gia{' '}
            <Text style={{ fontWeight: '700' }}>{invitation.session_title}</Text> từ{' '}
            <Text style={{ fontWeight: '700' }}>{invitation.creator_name || 'một người bạn'}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Từ chối"
          variant="outline"
          size="sm"
          onPress={handleDecline}
          disabled={processing}
          style={styles.button}
        />
        <Button
          label="Chấp nhận"
          variant="primary"
          size="sm"
          onPress={handleAccept}
          disabled={processing}
          style={styles.button}
        />
      </View>
    </Pressable>
  );
};

export type InvitationsListProps = {
  onInvitationPress?: (invitation: SessionInvitation) => void;
};

export const InvitationsList: React.FC<InvitationsListProps> = ({ onInvitationPress }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { invitations, loading, acceptInvitation, declineInvitation, loadInvitations } =
    useInvitations();

  useFocusEffect(
    React.useCallback(() => {
      void loadInvitations();
    }, [loadInvitations]),
  );

  const handleAccept = async (sessionId: string) => {
    try {
      await acceptInvitation(sessionId);
      await loadInvitations();
      const { showSuccessToast } = await import('../../../utils/toast');
      showSuccessToast('Đã chấp nhận lời mời tham gia buổi học');
    } catch (err: any) {
      const { showErrorToast } = await import('../../../utils/toast');
      showErrorToast('Không thể chấp nhận lời mời. Vui lòng thử lại.');
    }
  };

  const handleDecline = async (sessionId: string) => {
    try {
      await declineInvitation(sessionId);
      await loadInvitations();
      const { showSuccessToast } = await import('../../../utils/toast');
      showSuccessToast('Đã từ chối lời mời tham gia buổi học');
    } catch (err: any) {
      const { showErrorToast } = await import('../../../utils/toast');
      showErrorToast('Không thể từ chối lời mời. Vui lòng thử lại.');
    }
  };

  const handleRefresh = () => {
    void loadInvitations();
  };

  if (invitations.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color="secondary" style={styles.emptyText}>
          Không có thông báo nào
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={invitations}
      keyExtractor={(item) => item.session_id}
      renderItem={({ item }) => (
        <InvitationItem
          invitation={item}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onPress={(inv) => onInvitationPress?.(inv)}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshing={loading}
      onRefresh={handleRefresh}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '600',
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
});
