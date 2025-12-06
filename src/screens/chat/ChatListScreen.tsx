import React, { useCallback, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../styles';
import { Spacer, Text, Avatar, Icon, ScreenContainer } from '../../components/ui';
import { ConversationList } from '../../components/chat';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchConversationsAsync,
  selectChatLoading,
  selectConversations,
} from '../../store/slices/chatSlice';
import type { ChatConversation } from '../../services/chat';
import type { ChatStackParamList } from '../../navigation/ChatStackNavigator';
import { logger } from '../../utils/logger';
import { fetchAcceptedBuddies } from '../../services/buddy/connections';
import type { BuddyProfile } from '../../types/buddy';
import { createDirectChat } from '../../services/chat';
import { showErrorToast } from '../../utils/toast';

type ChatListNavigation = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;

const FILTER_SEGMENTS = ['buddies', 'groups'] as const;

export const ChatListScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('chat');
  const navigation = useNavigation<ChatListNavigation>();
  const dispatch = useAppDispatch();

  const conversations = useAppSelector(selectConversations);
  const chatStateLoading = useAppSelector(selectChatLoading);
  const currentUserId = useAppSelector((state) => state.auth.userId);

  const [filterIndex, setFilterIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptedBuddies, setAcceptedBuddies] = useState<BuddyProfile[]>([]);
  const [buddiesLoading, setBuddiesLoading] = useState(false);
  const [creatingChatWith, setCreatingChatWith] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchConversationsAsync());
    }, [dispatch]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) {
        setAcceptedBuddies([]);
        return;
      }
      let isActive = true;
      setBuddiesLoading(true);
      fetchAcceptedBuddies(currentUserId)
        .then((data) => {
          if (isActive) {
            setAcceptedBuddies(data);
          }
        })
        .catch((error) => {
          logger.warn('ChatListScreen', 'Failed to fetch buddies', error);
          if (isActive) {
            setAcceptedBuddies([]);
          }
        })
        .finally(() => {
          if (isActive) {
            setBuddiesLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, [currentUserId]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchConversationsAsync())
      .unwrap()
      .catch((error) => {
        logger.warn('ChatListScreen', 'Failed to refresh conversations', error);
      })
      .finally(() => setRefreshing(false));
  }, [dispatch]);

  const selectedType = filterIndex === 0 ? 'direct' : 'group';

  const filteredConversations = useMemo(
    () => conversations.filter((conversation) => conversation.type === selectedType),
    [conversations, selectedType],
  );

  const handleSelectConversation = useCallback(
    (conversation: ChatConversation) => {
      navigation.navigate('ChatRoom', {
        chatId: conversation.chatId,
        type: conversation.type,
        title: conversation.title,
        participant: {
          name: conversation.participantName,
          avatar: conversation.participantAvatar,
          tags: conversation.type === 'direct' ? [] : undefined,
        },
      });
    },
    [navigation],
  );

  const handlePressBuddy = useCallback(
    async (buddy: BuddyProfile) => {
      if (!currentUserId) {
        return;
      }
      const existingConversation = conversations.find(
        (conv) => conv.type === 'direct' && conv.participantId === buddy.user_id,
      );
      if (existingConversation) {
        handleSelectConversation(existingConversation);
        return;
      }

      try {
        setCreatingChatWith(buddy.user_id);
        const response = await createDirectChat(currentUserId, buddy.user_id);
        if (response.success && response.chat) {
          await dispatch(fetchConversationsAsync());
          navigation.navigate('ChatRoom', {
            chatId: response.chat.id,
            type: 'direct',
            participant: {
              name: buddy.display_name,
              avatar: buddy.avatar_url,
            },
          });
        } else {
          logger.warn('ChatListScreen', 'Unable to create chat', response.error);
          showErrorToast(t('createChatError'), response.error || t('createChatErrorDescription'));
        }
      } catch (error) {
        logger.error('ChatListScreen', 'Error creating chat', error);
        showErrorToast(t('createChatError'), t('createChatErrorDescription'));
      } finally {
        setCreatingChatWith(null);
      }
    },
    [conversations, currentUserId, dispatch, handleSelectConversation, navigation],
  );

  const handleCreateGroup = useCallback(() => {
    logger.info('ChatListScreen', 'Create group CTA pressed');
    // TODO: open group creation flow when available
  }, []);

  const showBuddiesSection =
    selectedType === 'direct' && (buddiesLoading || acceptedBuddies.length > 0);

  const buddiesCarousel = showBuddiesSection ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.avatarRow}>
        {acceptedBuddies.map((buddy) => {
          const displayName = buddy.display_name || 'Buddy';
          const isCreating = creatingChatWith === buddy.user_id;
          return (
            <Pressable
              key={buddy.user_id}
              accessibilityRole="button"
              accessibilityLabel={displayName}
              onPress={() => handlePressBuddy(buddy)}
              style={({ pressed }) => [
                styles.avatarItem,
                (pressed || isCreating) && styles.avatarItemPressed,
              ]}
            >
              <View style={styles.avatarWrapper}>
                <Avatar uri={buddy.avatar_url || undefined} name={displayName} size="lg" />
                <View style={styles.onlineBadge} />
              </View>
              <Spacer size={2} />
              <Text variant="caption" color="secondary" numberOfLines={1} style={styles.avatarName}>
                {displayName}
              </Text>
            </Pressable>
          );
        })}
        {buddiesLoading && acceptedBuddies.length === 0 ? (
          <Text variant="caption" color="tertiary">
            ...
          </Text>
        ) : null}
      </View>
    </ScrollView>
  ) : null;

  const groupHero =
    selectedType === 'group' ? (
      <LinearGradient
        colors={['#E7F8D9', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.groupHero}
      >
        <Text variant="h5" style={styles.groupHeroTitle}>
          {t('createGroupTitle')}
        </Text>
        <Spacer size={2} />
        <Text variant="bodySmall" color="secondary">
          {t('createGroupDescription')}
        </Text>
        <Spacer size={4} />
        <Pressable onPress={handleCreateGroup} style={styles.groupHeroCta}>
          <Text variant="bodySmall" color="inverse" style={{ fontWeight: '600' }}>
            {t('createGroupCta')}
          </Text>
        </Pressable>
      </LinearGradient>
    ) : null;

  const listHeader = (
    <View style={{ gap: theme.spacing[4] }}>
      <View style={styles.headerRow}>
        <Text variant="h3">{t('title')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('searchPlaceholder')}
          style={styles.searchButton}
        >
          <Icon name="search" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>
      <View style={styles.segmentContainer}>
        {FILTER_SEGMENTS.map((segment, index) => {
          const isActive = index === filterIndex;
          return (
            <Pressable
              key={segment}
              onPress={() => setFilterIndex(index)}
              style={[
                styles.segmentPill,
                {
                  borderColor: isActive ? theme.colors.primary[500] : theme.colors.neutral[200],
                  backgroundColor: isActive ? 'transparent' : theme.colors.surface,
                },
              ]}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#DFF7C8', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.segmentGradient}
                >
                  <Text variant="bodySmall" style={styles.segmentTextActive}>
                    {index === 0 ? t('buddiesTab') : t('groupsTab')}
                  </Text>
                </LinearGradient>
              ) : (
                <Text variant="bodySmall" color="secondary" style={styles.segmentText}>
                  {index === 0 ? t('buddiesTab') : t('groupsTab')}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {buddiesCarousel}
      {groupHero}
    </View>
  );

  const emptyMessage = selectedType === 'direct' ? t('emptyDirect') : t('emptyGroup');
  const isInitialLoading = chatStateLoading && conversations.length === 0 && !refreshing;

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.colors.primary[500]}
      colors={[theme.colors.primary[500]]}
    />
  );

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0 }}>
      <ConversationList
        conversations={filteredConversations}
        onSelectConversation={handleSelectConversation}
        loading={isInitialLoading}
        emptyMessage={emptyMessage}
        header={listHeader}
        contentContainerStyle={{ paddingHorizontal: theme.spacing[4] }}
        refreshControl={refreshControl}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    borderColor: '#E4F0D5',
    padding: 4,
    gap: 4,
  },
  segmentPill: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentGradient: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontWeight: '600',
    paddingVertical: 8,
  },
  segmentTextActive: {
    fontWeight: '600',
    color: '#1F2A37',
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 4,
  },
  avatarItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  avatarItemPressed: {
    transform: [{ scale: 0.96 }],
  },
  avatarWrapper: {
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#58CC02',
  },
  avatarName: {
    maxWidth: 72,
    textAlign: 'center',
  },
  groupHero: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4F5AF',
  },
  groupHeroTitle: {
    fontWeight: '600',
  },
  groupHeroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#58CC02',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
