/**
 * Chat Slice
 * Redux slice for managing chat state (conversations, messages, active chat)
 */

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { signOutState } from './authSlice';
import * as chatService from '../../services/chat';
import type {
  ChatConversation,
  Message,
  FetchConversationsResponse,
  FetchMessagesResponse,
  SendMessageResponse,
} from '../../services/chat';
import { logger } from '../../utils/logger';
import { formatErrorMessage } from '../../services/helpers';

/**
 * Chat state interface
 */
export interface ChatState {
  conversations: ChatConversation[];
  messagesByChatId: Record<string, Message[]>; // Key: chatId, Value: array of messages
  activeChatId: string | null;
  loading: boolean;
  sendingMessage: Record<string, boolean>; // Key: chatId, Value: sending status
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messagesByChatId: {},
  activeChatId: null,
  loading: false,
  sendingMessage: {},
  error: null,
};

/**
 * Async thunk to fetch user conversations
 */
export const fetchConversationsAsync = createAsyncThunk<
  ChatConversation[],
  void,
  { state: RootState }
>('chat/fetchConversations', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const currentUserId = state.auth.userId;

    if (!currentUserId) {
      return rejectWithValue('User not authenticated');
    }

    const response = await chatService.fetchUserConversations(currentUserId);

    if (!response.success || !response.conversations) {
      return rejectWithValue(response.error || 'Failed to fetch conversations');
    }

    return response.conversations;
  } catch (error: unknown) {
    const errorMessage = formatErrorMessage(error) || 'Failed to fetch conversations';
    logger.error('fetchConversationsAsync', errorMessage, error);
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async thunk to fetch messages for a chat
 */
export const fetchMessagesAsync = createAsyncThunk<
  { chatId: string; messages: Message[] },
  { chatId: string; limit?: number },
  { state: RootState }
>('chat/fetchMessages', async ({ chatId, limit }, { rejectWithValue }) => {
  try {
    const response = await chatService.fetchMessages(chatId, limit);

    if (!response.success || !response.messages) {
      return rejectWithValue(response.error || 'Failed to fetch messages');
    }

    return {
      chatId,
      messages: response.messages,
    };
  } catch (error: unknown) {
    const errorMessage = formatErrorMessage(error) || 'Failed to fetch messages';
    logger.error('fetchMessagesAsync', errorMessage, error);
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async thunk to send a message
 */
export const sendMessageAsync = createAsyncThunk<
  { chatId: string; message: Message },
  { chatId: string; content: string },
  { state: RootState }
>('chat/sendMessage', async ({ chatId, content }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const currentUserId = state.auth.userId;

    if (!currentUserId) {
      return rejectWithValue('User not authenticated');
    }

    const response = await chatService.sendMessage(chatId, currentUserId, content);

    if (!response.success || !response.message) {
      return rejectWithValue(response.error || 'Failed to send message');
    }

    return {
      chatId,
      message: response.message,
    };
  } catch (error: unknown) {
    const errorMessage = formatErrorMessage(error) || 'Failed to send message';
    logger.error('sendMessageAsync', errorMessage, error);
    return rejectWithValue(errorMessage);
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /**
     * Set active chat ID
     */
    setActiveChat(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
    },

    /**
     * Add a message to a chat (for realtime updates)
     */
    addMessage(state, action: PayloadAction<{ chatId: string; message: Message }>) {
      const { chatId, message } = action.payload;

      // Initialize messages array if it doesn't exist
      if (!state.messagesByChatId[chatId]) {
        state.messagesByChatId[chatId] = [];
      }

      // Check if message already exists (avoid duplicates)
      const existingIndex = state.messagesByChatId[chatId].findIndex((m) => m.id === message.id);
      if (existingIndex === -1) {
        // Insert message in chronological order (oldest first)
        const messages = state.messagesByChatId[chatId];
        const insertIndex = messages.findIndex((m) => m.created_at > message.created_at);
        if (insertIndex === -1) {
          // Append to end
          messages.push(message);
        } else {
          // Insert at correct position
          messages.splice(insertIndex, 0, message);
        }
      }

      // Update conversation's last message
      const conversation = state.conversations.find((c) => c.chatId === chatId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastMessageAt = message.created_at;
        conversation.updatedAt = message.created_at;
        // Increment unread count if message is not from current user
        // Note: We'll need to check sender_id in the component/hook
      }
    },

    /**
     * Update a conversation (e.g., after receiving new message via realtime)
     */
    updateConversation(state, action: PayloadAction<ChatConversation>) {
      const index = state.conversations.findIndex((c) => c.chatId === action.payload.chatId);
      if (index !== -1) {
        state.conversations[index] = action.payload;
      } else {
        // Add new conversation if it doesn't exist
        state.conversations.push(action.payload);
      }
      // Sort by updatedAt DESC (most recent first)
      state.conversations.sort((a, b) => {
        const timeA = a.lastMessageAt || a.updatedAt;
        const timeB = b.lastMessageAt || b.updatedAt;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
    },

    /**
     * Clear messages for a specific chat
     */
    clearMessages(state, action: PayloadAction<string>) {
      const chatId = action.payload;
      delete state.messagesByChatId[chatId];
    },

    /**
     * Mark conversation as read (update unread count)
     */
    markConversationAsRead(state, action: PayloadAction<string>) {
      const conversation = state.conversations.find((c) => c.chatId === action.payload);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    },

    /**
     * Increment unread count for a conversation
     */
    incrementUnreadCount(state, action: PayloadAction<string>) {
      const conversation = state.conversations.find((c) => c.chatId === action.payload);
      if (conversation) {
        conversation.unreadCount += 1;
      }
    },

    /**
     * Clear error
     */
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchConversationsAsync
    builder
      .addCase(fetchConversationsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationsAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Merge with existing conversations (preserve messages and activeChatId)
        const existingMap = new Map(state.conversations.map((c) => [c.chatId, c]));
        const mergedConversations: ChatConversation[] = [];

        action.payload.forEach((newConv) => {
          const existing = existingMap.get(newConv.chatId);
          if (existing) {
            // Preserve unread count if it's higher (user might have read messages)
            // But update other fields
            mergedConversations.push({
              ...newConv,
              unreadCount: Math.max(existing.unreadCount, newConv.unreadCount),
            });
          } else {
            mergedConversations.push(newConv);
          }
        });

        // Sort by updatedAt DESC (most recent first)
        mergedConversations.sort((a, b) => {
          const timeA = a.lastMessageAt || a.updatedAt;
          const timeB = b.lastMessageAt || b.updatedAt;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });

        state.conversations = mergedConversations;
        state.error = null;
      })
      .addCase(fetchConversationsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchMessagesAsync
    builder
      .addCase(fetchMessagesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessagesAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        state.messagesByChatId[chatId] = messages;
        state.error = null;
      })
      .addCase(fetchMessagesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // sendMessageAsync
    builder
      .addCase(sendMessageAsync.pending, (state, action) => {
        const { chatId } = action.meta.arg;
        state.sendingMessage[chatId] = true;
        state.error = null;
      })
      .addCase(sendMessageAsync.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        state.sendingMessage[chatId] = false;

        // Add message to messagesByChatId
        if (!state.messagesByChatId[chatId]) {
          state.messagesByChatId[chatId] = [];
        }
        const messages = state.messagesByChatId[chatId];
        const existingIndex = messages.findIndex((m) => m.id === message.id);
        if (existingIndex === -1) {
          messages.push(message);
        }

        // Update conversation's last message
        const conversation = state.conversations.find((c) => c.chatId === chatId);
        if (conversation) {
          conversation.lastMessage = message;
          conversation.lastMessageAt = message.created_at;
          conversation.updatedAt = message.created_at;
          // Sort conversations by updatedAt
          state.conversations.sort((a, b) => {
            const timeA = a.lastMessageAt || a.updatedAt;
            const timeB = b.lastMessageAt || b.updatedAt;
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          });
        }

        state.error = null;
      })
      .addCase(sendMessageAsync.rejected, (state, action) => {
        const { chatId } = action.meta.arg;
        state.sendingMessage[chatId] = false;
        state.error = action.payload as string;
      });

    // Clear chat state when user signs out
    builder.addCase(signOutState, (state) => {
      state.conversations = [];
      state.messagesByChatId = {};
      state.activeChatId = null;
      state.loading = false;
      state.sendingMessage = {};
      state.error = null;
    });
  },
});

export const {
  setActiveChat,
  addMessage,
  updateConversation,
  clearMessages,
  markConversationAsRead,
  incrementUnreadCount,
  clearError,
} = chatSlice.actions;

// Selectors
export const selectConversations = (state: RootState) => state.chat.conversations;

export const selectMessagesForChat = (chatId: string) => (state: RootState) =>
  state.chat.messagesByChatId[chatId] || [];

export const selectActiveChat = (state: RootState) => {
  const activeChatId = state.chat.activeChatId;
  if (!activeChatId) return null;
  return state.chat.conversations.find((c) => c.chatId === activeChatId) || null;
};

export const selectActiveChatId = (state: RootState) => state.chat.activeChatId;

export const selectChatLoading = (state: RootState) => state.chat.loading;

export const selectSendingMessage = (chatId: string) => (state: RootState) =>
  state.chat.sendingMessage[chatId] || false;

export const selectChatError = (state: RootState) => state.chat.error;

export const selectUnreadCount = (state: RootState) => {
  return state.chat.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
};

export const selectUnreadCountForChat = (chatId: string) => (state: RootState) => {
  const conversation = state.chat.conversations.find((c) => c.chatId === chatId);
  return conversation?.unreadCount || 0;
};

export default chatSlice.reducer;
