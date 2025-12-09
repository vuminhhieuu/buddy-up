import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../styles';
import { Avatar, Chip, Icon, Text, Spacer, EmptyState } from '../../components/ui';
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
import type { Message, MessageAttachment } from '../../services/chat';
import { useChatRealtime } from '../../hooks/chat/useChatRealtime';
import { markMessagesRead } from '../../services/chat';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { showErrorToast } from '../../utils/toast';
import { uploadChatImage, uploadChatPdf } from '../../services/chat/uploads';

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
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

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

  const pickImageFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showErrorToast('Permission required', 'Cho phép truy cập thư viện để gửi ảnh.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return null;
    const uri = result.assets?.[0]?.uri;
    return uri ?? null;
  }, []);

  type SelectedPdf = {
    uri: string;
    name: string;
  };

  const pickPdfDocument = useCallback(async (): Promise<SelectedPdf | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    const asset = result.assets[0];
    return { uri: asset.uri, name: asset.name };
  }, []);

  const uploadAndSendAttachment = useCallback(
    async (uploader: (uri: string) => Promise<MessageAttachment>) => {
      if (!chatId) return;
      setIsUploadingAttachment(true);
      try {
        const attachment = await uploader(chatId);
        await dispatch(
          sendMessageAsync({
            chatId,
            content: null,
            attachments: [attachment],
          }),
        );
      } catch (error) {
        showErrorToast('Upload failed', 'Không thể gửi file. Vui lòng thử lại.');
        logger.error('ChatRoomScreen', 'Attachment upload error', error);
      } finally {
        setIsUploadingAttachment(false);
        setShowAttachmentSheet(false);
      }
    },
    [chatId, dispatch],
  );

  const handleImageSelection = useCallback(async () => {
    const uri = await pickImageFromLibrary();
    if (!uri) return;
    await uploadAndSendAttachment((id) => uploadChatImage(id, uri));
  }, [pickImageFromLibrary, uploadAndSendAttachment]);

  const handlePdfSelection = useCallback(async () => {
    const selection = await pickPdfDocument();
    if (!selection) return;
    await uploadAndSendAttachment((id) => uploadChatPdf(id, selection.uri, selection.name));
  }, [pickPdfDocument, uploadAndSendAttachment]);

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

      const attachments = (message.attachments as MessageAttachment[]) || [];
      const contentOnly = Boolean(message.content && message.content.trim().length > 0);
      const hasOnlyAttachments = attachments.length > 0 && !contentOnly;
      return (
        <Pressable
          onPress={() => handleToggleTimestamp(message.id)}
          style={{
            paddingHorizontal: theme.spacing[2],
            marginBottom: theme.spacing[2],
            alignItems: isSent ? 'flex-end' : 'flex-start',
          }}
        >
          {!hasOnlyAttachments && (
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
          )}
          {attachments.length > 0 && (
            <View
              style={[
                styles.attachmentsRow,
                {
                  paddingHorizontal: theme.spacing[1],
                  marginTop: theme.spacing[1],
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: isSent ? 'flex-end' : 'flex-start',
                },
              ]}
            >
              {!isSent ? (
                <Avatar
                  size="sm"
                  name={senderLabel}
                  uri={senderAvatar}
                  style={{ marginRight: theme.spacing[1] }}
                />
              ) : null}
              <View
                style={{
                  gap: 8,
                  flexShrink: 1,
                  alignItems: isSent ? 'flex-end' : 'flex-start',
                  maxWidth: Math.min(windowWidth * 0.65, windowWidth - theme.spacing[6]),
                }}
              >
                {attachments.map((attachment) => {
                  const bubbleMaxWidth = Math.min(
                    windowWidth * 0.65,
                    windowWidth - theme.spacing[6],
                  );
                  if (attachment.type === 'image') {
                    const maxWidth = Math.min(bubbleMaxWidth, 240);
                    const computedHeight =
                      attachment.width && attachment.height
                        ? (maxWidth * attachment.height) / attachment.width
                        : maxWidth * 0.75;
                    return (
                      <Pressable
                        key={attachment.url}
                        style={styles.imageAttachment}
                        onPress={() => setVisibleImage(attachment.url)}
                      >
                        <Image
                          source={{ uri: attachment.url }}
                          style={[
                            styles.attachmentImage,
                            {
                              width: maxWidth,
                              height: computedHeight,
                            },
                          ]}
                        />
                      </Pressable>
                    );
                  }
                  if (attachment.type === 'pdf') {
                    return (
                      <Pressable
                        key={attachment.url}
                        style={[styles.pdfCard, { maxWidth: bubbleMaxWidth }]}
                        onPress={() => Linking.openURL(attachment.url)}
                      >
                        <Icon name="book" color={theme.colors.primary[600]} size={20} />
                        <Text
                          variant="bodySmall"
                          style={styles.pdfName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {attachment.name || 'Document'}
                        </Text>
                      </Pressable>
                    );
                  }
                  return null;
                })}
              </View>
            </View>
          )}
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
      windowWidth,
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
        actionLabel={t('startConversationCta')}
        onActionPress={() => setMessage(t('quickStartMessage'))}
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
                      <Chip key={tag} label={tag} />
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
              {
                key: 'photo',
                icon: 'image',
                label: t('actionSendPhoto'),
                handler: handleImageSelection,
              },
              {
                key: 'file',
                icon: 'paperclip',
                label: t('actionSendFile'),
                handler: handlePdfSelection,
              },
              { key: 'voice', icon: 'mic', label: t('actionVoiceNote'), handler: () => {} },
              {
                key: 'schedule',
                icon: 'calendar',
                label: t('actionCreateSchedule'),
                handler: () => {},
              },
            ].map((action) => (
              <Pressable
                key={action.key}
                style={styles.sheetItem}
                onPress={() => {
                  setShowAttachmentSheet(false);
                  if (action.handler) {
                    action.handler();
                  }
                }}
                disabled={isUploadingAttachment}
              >
                <View style={[styles.sheetIcon, { backgroundColor: theme.colors.primary[50] }]}>
                  <Icon name={action.icon as any} color={theme.colors.primary[600]} size={20} />
                </View>
                <Text variant="body">{action.label}</Text>
              </Pressable>
            ))}
            {isUploadingAttachment && (
              <>
                <ActivityIndicator style={{ marginTop: 8 }} />
                <Text variant="caption" color="secondary">
                  Uploading...
                </Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={Boolean(visibleImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setVisibleImage(null)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setVisibleImage(null)}>
          <Pressable style={styles.imagePreviewContainer} onPress={(e) => e.stopPropagation()}>
            <Pressable style={styles.imagePreviewCloseButton} onPress={() => setVisibleImage(null)}>
              <Icon name="chevronRight" color="#000" style={{ transform: [{ rotate: '90deg' }] }} />
            </Pressable>
            {visibleImage && (
              <Image
                source={{ uri: visibleImage }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            )}
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
  attachmentsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  imageAttachment: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    backgroundColor: 'transparent',
  },
  attachmentImage: {
    width: '100%',
    height: undefined,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    minWidth: 180,
    alignSelf: 'flex-start',
  },
  pdfName: {
    flex: 1,
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
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePreviewCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 6,
  },
});
