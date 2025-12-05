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
import type { ChatConversation } from '../../../services/chat';

export type ConversationListProps = {
  conversations: ChatConversation[];
  onSelectConversation: (conversation: ChatConversation) => void;
  loading?: boolean;
  emptyMessage?: string;
  header?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement;
};

const ConversationItem: React.FC<{
  conversation: ChatConversation;
  onPress: () => void;
}> = ({ conversation, onPress }) => {
  const { theme } = useTheme();

  const lastMessagePreview = conversation.lastMessage?.content || 'Chưa có tin nhắn';
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
  loading = false,
  emptyMessage = 'Chưa có cuộc trò chuyện nào',
  header,
  contentContainerStyle,
  refreshControl,
}) => {
  const { theme } = useTheme();

  const renderItem: ListRenderItem<ChatConversation> = useCallback(
    ({ item }) => (
      <ConversationItem conversation={item} onPress={() => onSelectConversation(item)} />
    ),
    [onSelectConversation],
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
