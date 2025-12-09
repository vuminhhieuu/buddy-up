/**
 * ConversationList Component
 * Displays a list of conversations with last message preview and unread badges
 */

import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, Pressable, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Spacer } from '../../ui/Spacer/Spacer';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { Loading } from '../../ui/Loading/Loading';
import { formatRelativeTime } from '../../../utils/date';
import type { ChatConversation, MessageAttachment } from '../../../services/chat';
import { useTranslation } from 'react-i18next';

export type ConversationListProps = {
  conversations: ChatConversation[];
  onSelectConversation: (conversation: ChatConversation) => void;
  currentUserId?: string | null;
  loading?: boolean;
  emptyMessage?: string;
  header?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement;
};

const ConversationItem: React.FC<{
  conversation: ChatConversation;
  onPress: () => void;
  currentUserId?: string | null;
}> = ({ conversation, onPress, currentUserId }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('chat');

  const getAttachmentPreview = (attachments: MessageAttachment[] | null | undefined) => {
    if (!attachments || attachments.length === 0) return null;
    const images = attachments.filter((a) => a.type === 'image').length;
    const pdfs = attachments.filter((a) => a.type === 'pdf').length;
    const sessions = attachments.filter((a) => a.type === 'session').length;
    const others = attachments.filter(
      (a) => a.type !== 'image' && a.type !== 'pdf' && a.type !== 'session',
    ).length;

    if (images > 0 && pdfs === 0 && sessions === 0 && others === 0) {
      return t('previewImages', { count: images, defaultValue: 'đã gửi ảnh' });
    }
    if (pdfs > 0 && images === 0 && sessions === 0 && others === 0) {
      return t('previewPdfs', { count: pdfs, defaultValue: 'đã gửi PDF' });
    }
    if (sessions > 0 && images === 0 && pdfs === 0 && others === 0) {
      return t('previewSessions', { count: sessions, defaultValue: 'đã gửi lịch học' });
    }
    return t('previewAttachment', 'đã gửi đính kèm');
  };

  const senderName =
    conversation.lastMessage?.sender_id === currentUserId
      ? t('youLabel', 'Bạn')
      : conversation.participantName || conversation.title || t('senderUnknown', 'Người gửi');

  const messageText = conversation.lastMessage?.content?.trim();
  const attachmentsPreview = getAttachmentPreview(
    conversation.lastMessage?.attachments as MessageAttachment[] | undefined,
  );

  const lastMessagePreview =
    (messageText && `${senderName}: ${messageText}`) ||
    (attachmentsPreview && `${senderName}: ${attachmentsPreview}`) ||
    t('noMessages', 'Chưa có tin nhắn');
  const displayName = conversation.participantName || conversation.title || 'Unknown';
  const displayAvatar = conversation.participantAvatar;

  const itemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [itemStyle, pressed && { backgroundColor: theme.colors.neutral[50] }]}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${displayName}`}
    >
      <Avatar uri={displayAvatar || undefined} name={displayName} size="md" />
      <Spacer size={3} horizontal />
      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text variant="body" style={{ fontWeight: '600' as const }} numberOfLines={1}>
            {displayName}
          </Text>
          {conversation.lastMessageAt && (
            <Text variant="caption" color="tertiary">
              {formatRelativeTime(conversation.lastMessageAt, 'short')}
            </Text>
          )}
        </View>
        <Spacer size={1} />
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text
            variant="bodySmall"
            color="secondary"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ flex: 1 }}
          >
            {lastMessagePreview}
          </Text>
          {conversation.unreadCount > 0 && (
            <>
              <Spacer size={2} horizontal />
              <View
                accessibilityLabel={`${conversation.unreadCount} tin nhắn chưa đọc`}
                accessibilityRole="text"
                style={{
                  backgroundColor: theme.colors.primary[500],
                  borderRadius: theme.radius.full,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal:
                    conversation.unreadCount > 9 ? theme.spacing[2] : theme.spacing[1],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  variant="caption"
                  color="inverse"
                  style={{ fontSize: 11, fontWeight: '600' as const }}
                >
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  currentUserId,
  loading = false,
  emptyMessage = 'Chưa có cuộc trò chuyện nào',
  header,
  contentContainerStyle,
  refreshControl,
}) => {
  const { theme } = useTheme();

  const renderItem: ListRenderItem<ChatConversation> = useCallback(
    ({ item }) => (
      <ConversationItem
        conversation={item}
        onPress={() => onSelectConversation(item)}
        currentUserId={currentUserId}
      />
    ),
    [onSelectConversation, currentUserId],
  );

  const keyExtractor = useCallback((item: ChatConversation) => item.chatId, []);

  const renderEmptyState = () => (
    <View style={{ paddingVertical: theme.spacing[10] }}>
      {loading ? (
        <Loading />
      ) : (
        <EmptyState title={emptyMessage} description="Bắt đầu trò chuyện với bạn học của bạn" />
      )}
    </View>
  );

  return (
    <FlatList
      data={conversations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header ? <View>{header}</View> : null}
      ListEmptyComponent={renderEmptyState}
      contentContainerStyle={[
        {
          backgroundColor: theme.colors.background,
          paddingBottom: theme.spacing[16],
        },
        contentContainerStyle,
      ]}
      refreshControl={refreshControl}
      removeClippedSubviews
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};
