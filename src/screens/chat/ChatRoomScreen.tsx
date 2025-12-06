import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../styles';
import { Avatar, Chip, Icon, Text, Spacer, EmptyState, Button } from '../../components/ui';
import { MessageBubble } from '../../components/chat';
import { logger } from '../../utils/logger';
import type { ChatStackParamList } from '../../navigation/ChatStackNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchMessagesAsync,
  markConversationAsRead,
  selectMessagesForChat,
  selectSendingMessage,
  sendMessageAsync,
  setActiveChat,
} from '../../store/slices/chatSlice';
import { selectConversations } from '../../store/slices/chatSlice';
import type { Message } from '../../services/chat';
import { useChatRealtime } from '../../hooks/chat/useChatRealtime';
import { markMessagesRead } from '../../services/chat';
import * as Haptics from 'expo-haptics';

type ChatRoomRoute = {
  key: string;
  name: 'ChatRoom';
  params: ChatStackParamList['ChatRoom'];
};

type ChatListItem = { type: 'message'; data: Message } | { type: 'day'; id: string; label: string };

const formatTime = (input: string) =>
  new Date(input).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export const ChatRoomScreen: React.FC = () => {
  const route = useRoute<ChatRoomRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation('chat');
  const dispatch = useAppDispatch();

  const { chatId, participant, title } = route.params;
  const listRef = useRef<FlatList<ChatListItem>>(null);
  const [message, setMessage] = useState('');
  const [showTyping] = useState(false);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const conversations = useAppSelector(selectConversations);
  const conversation = conversations.find((c) => c.chatId === chatId);
  const currentUserId = useAppSelector((state) => state.auth.userId);
  const messages = useAppSelector(selectMessagesForChat(chatId));
  const sending = useAppSelector(selectSendingMessage(chatId));
  const currentUserAvatar = useAppSelector((state) => state.auth.profileData.avatarUrl);
  const currentUserDisplayName = useAppSelector(
    (state) => state.auth.displayName || state.auth.email || undefined,
  );

  const displayName =
    participant?.name || conversation?.participantName || conversation?.title || title || 'Buddy';
  const avatar = participant?.avatar || conversation?.participantAvatar || undefined;
  const tags = participant?.tags && participant.tags.length > 0 ? participant.tags : [];

  const chatItems: ChatListItem[] = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    const items: ChatListItem[] = [];
    let lastDay: string | null = null;
    messages.forEach((msg) => {
      const date = new Date(msg.created_at);
      const dayKey = date.toDateString();
      if (dayKey !== lastDay) {
        const label =
          dayKey === new Date().toDateString()
            ? t('todayLabel')
            : date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' });
        items.push({ type: 'day', id: dayKey, label });
        lastDay = dayKey;
      }
      items.push({ type: 'message', data: msg });
    });
    return items;
  }, [messages, t]);

  useChatRealtime(chatId, currentUserId);

  useEffect(() => {
    dispatch(fetchMessagesAsync({ chatId }));
    dispatch(setActiveChat(chatId));
    return () => {
      dispatch(setActiveChat(null));
    };
  }, [chatId, dispatch]);

  useEffect(() => {
    if (chatItems.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatItems.length]);

  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest.sender_id && latest.sender_id !== currentUserId) {
      markMessagesRead(chatId, currentUserId);
      dispatch(markConversationAsRead(chatId));
    }
  }, [messages, currentUserId, chatId, dispatch]);

  const handleSend = useCallback(async () => {
    const normalized = message.trim().replace(/\s+/g, ' ');
    if (!normalized) return;
    setMessage('');
    await dispatch(sendMessageAsync({ chatId, content: normalized }));
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [chatId, dispatch, message]);

  const handleOpenInfo = useCallback(() => {
    navigation.navigate('ChatInfo', {
      chatId,
      participantName: displayName,
      avatar,
      tags,
    });
  }, [avatar, chatId, displayName, navigation, tags]);

  const handleToggleTimestamp = useCallback((messageId: string) => {
    setSelectedMessageId((prev) => {
      const next = prev === messageId ? null : messageId;
      if (next) {
        Haptics.selectionAsync().catch(() => {});
      }
      return next;
    });
  }, []);

  const renderChatItem = useCallback(
    ({ item }: { item: ChatListItem }) => {
      if (item.type === 'day') {
        return (
          <View style={[styles.dayDivider, { backgroundColor: theme.colors.neutral[100] }]}>
            <Text variant="caption" color="secondary">
              {item.label}
            </Text>
          </View>
        );
      }

      const message = item.data;
      const isSent = message.sender_id === currentUserId;
      const isStatus = !message.sender_id;
      const isCode = Boolean(message.content && message.content.includes('```'));

      const statusIcon = isStatus && message.content ? message.content.trim().charAt(0) : undefined;

      const senderAvatar = isSent ? currentUserAvatar : avatar;
      const senderLabel = isSent ? currentUserDisplayName : displayName;

      const isSelected = selectedMessageId === message.id;

      return (
        <Pressable
          onPress={() => handleToggleTimestamp(message.id)}
          style={{
            paddingHorizontal: theme.spacing[2],
            marginBottom: theme.spacing[2],
            alignItems: isSent ? 'flex-end' : 'flex-start',
          }}
        >
          <MessageBubble
            message={message}
            isSent={isSent}
            variant={isStatus ? 'status' : isCode ? 'code' : 'text'}
            statusIcon={statusIcon}
            showTimestamp={false}
            showAvatar={!isSent}
            senderName={!isSent ? senderLabel : undefined}
            senderAvatar={senderAvatar}
            isSelected={isSelected}
          />
          {isSelected ? (
            <View style={[styles.timestampPill, { backgroundColor: theme.colors.neutral[100] }]}>
              <Text variant="caption" color="secondary">
                {formatTime(message.created_at)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    },
    [
      avatar,
      currentUserAvatar,
      currentUserDisplayName,
      currentUserId,
      displayName,
      handleToggleTimestamp,
      selectedMessageId,
      theme.spacing,
    ],
  );

  const typingIndicator = showTyping ? (
    <View style={styles.typingContainer}>
      <Avatar size="sm" name={displayName} uri={avatar} />
      <Spacer size={2} />
      <View
        style={[
          styles.typingBubble,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text variant="caption" color="secondary">
          {t('typingIndicator', { name: displayName })}
        </Text>
      </View>
    </View>
  ) : null;

  const emptyList = (
    <View style={{ paddingVertical: theme.spacing[12] }}>
      <EmptyState
        title={t('emptyChatTitle')}
        description={t('emptyChatDescription')}
        action={
          <Button
            label={t('startConversationCta')}
            onPress={() => setMessage(t('quickStartMessage'))}
          />
        }
      />
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      <View
        style={[
          styles.header,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.headerIcon,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            <Icon
              name="chevronRight"
              color={theme.colors.text.primary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </Pressable>
          <View style={[styles.headerInfo, { marginHorizontal: theme.spacing[3] }]}>
            <View style={styles.headerTitleRow}>
              <Avatar size="lg" name={displayName} uri={avatar} />
              <Spacer size={3} horizontal />
              <View style={{ flex: 1 }}>
                <Text variant="h4" numberOfLines={1}>
                  {displayName}
                </Text>
                <Spacer size={1} />
                <Text variant="bodySmall" color="success">
                  ● {t('statusOnline')}
                </Text>
              </View>
            </View>
            {tags.length > 0 ? (
              <>
                <Spacer size={1} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                    {tags.map((tag) => (
                      <Chip key={tag} label={tag} size="sm" />
                    ))}
                  </View>
                </ScrollView>
              </>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            {[
              { icon: 'phone', action: () => {} },
              { icon: 'video', action: () => {} },
              { icon: 'more', action: handleOpenInfo },
            ].map((btn) => (
              <Pressable
                key={btn.icon}
                onPress={btn.action}
                style={[styles.headerIcon, { borderColor: theme.colors.border }]}
              >
                <Icon name={btn.icon as any} color={theme.colors.primary[600]} size={20} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={chatItems}
          keyExtractor={(item, index) =>
            item.type === 'day' ? `day-${item.id}-${index}` : item.data.id
          }
          renderItem={renderChatItem}
          ListEmptyComponent={emptyList}
          contentContainerStyle={{ padding: theme.spacing[4], paddingBottom: theme.spacing[8] }}
          showsVerticalScrollIndicator={false}
        />

        <View style={{ paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[2] }}>
          {typingIndicator}
        </View>

        <View
          style={[
            styles.inputRow,
            { paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[5] },
          ]}
        >
          <Pressable
            style={[styles.circleButton, { backgroundColor: theme.colors.primary[100] }]}
            onPress={() => setShowAttachmentSheet(true)}
          >
            <Icon name="plus" color={theme.colors.primary[600]} />
          </Pressable>
          <View
            style={[
              styles.messageInput,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <TextInput
              placeholder={t('inputPlaceholder')}
              value={message}
              onChangeText={setMessage}
              style={styles.inputText}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable>
              <Icon name="smile" color={theme.colors.text.secondary} />
            </Pressable>
          </View>
          <Pressable
            onPress={handleSend}
            disabled={sending || message.trim().length === 0}
            style={[
              styles.circleButton,
              {
                backgroundColor:
                  sending || message.trim().length === 0
                    ? theme.colors.neutral[300]
                    : theme.colors.primary[500],
              },
            ]}
          >
            <Icon name="send" color={theme.colors.text.inverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={showAttachmentSheet}
        animationType="fade"
        onRequestClose={() => setShowAttachmentSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowAttachmentSheet(false)}>
          <Pressable
            style={[styles.sheetContainer, { backgroundColor: theme.colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text variant="h5" style={{ marginBottom: 12 }}>
              {t('moreActionsTitle')}
            </Text>
            {[
              { icon: 'image', label: t('actionSendPhoto') },
              { icon: 'paperclip', label: t('actionSendFile') },
              { icon: 'mic', label: t('actionVoiceNote') },
              { icon: 'calendar', label: t('actionCreateSchedule') },
            ].map((action) => (
              <Pressable
                key={action.label}
                style={styles.sheetItem}
                onPress={() => {
                  setShowAttachmentSheet(false);
                  logger.info('ChatRoomScreen', `Selected quick action: ${action.label}`);
                }}
              >
                <View style={[styles.sheetIcon, { backgroundColor: theme.colors.primary[50] }]}>
                  <Icon name={action.icon as any} color={theme.colors.primary[600]} size={20} />
                </View>
                <Text variant="body">{action.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dayDivider: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    marginVertical: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typingBubble: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timestampPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputText: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
