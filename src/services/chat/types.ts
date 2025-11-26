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
  attachments: Array<{
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
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
