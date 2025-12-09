/**
 * Chat Service Types
 * Type definitions for chat-related data structures
 */

/**
 * Chat room data
 */
export interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Chat participant data
 */
export interface ChatParticipant {
  chat_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'owner';
  joined_at: string;
  last_read_at: string | null;
}

/**
 * Message data
 */
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string | null;
  attachments: MessageAttachment[];
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

/**
 * Response from creating a chat room
 */
export interface CreateDirectChatResponse {
  success: boolean;
  chat?: ChatRoom;
  error?: string;
  errorCode?: 'ALREADY_EXISTS' | 'INVALID_USERS' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Response from sending a message
 */
export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
  errorCode?: 'INVALID_CHAT' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

export interface MessageAttachment {
  url: string;
  type: 'image' | 'pdf' | 'session' | 'other';
  name?: string | null;
  size?: number | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Response from fetching messages
 */
export interface FetchMessagesResponse {
  success: boolean;
  messages?: Message[];
  error?: string;
  errorCode?: 'INVALID_CHAT' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Chat conversation with last message and participant info
 */
export interface ChatConversation {
  chatId: string;
  type: 'direct' | 'group';
  title: string | null;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  unreadCount: number;
  participantId: string | null; // For direct chats: the other user's ID
  participantName: string | null; // For direct chats: the other user's display name
  participantAvatar: string | null; // For direct chats: the other user's avatar
  updatedAt: string;
}

/**
 * Response from fetching user conversations
 */
export interface FetchConversationsResponse {
  success: boolean;
  conversations?: ChatConversation[];
  error?: string;
  errorCode?: 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Chat participant info (for direct chats)
 */
export interface ChatParticipantInfo {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Response from getting chat participant info
 */
export interface GetParticipantInfoResponse {
  success: boolean;
  participant?: ChatParticipantInfo;
  error?: string;
  errorCode?: 'INVALID_CHAT' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}
