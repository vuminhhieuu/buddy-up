-- ============================================================================
-- Migration: 005_create_chat_participants.sql
-- Description: Create chat_participants junction table (N:M relationship)
-- Dependencies: chats, auth.users
-- ============================================================================

-- Chat participants table
-- Junction table for many-to-many relationship between chats and users
CREATE TABLE public.chat_participants (
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role participant_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  
  PRIMARY KEY (chat_id, user_id)
);

-- Comments
COMMENT ON TABLE public.chat_participants IS 'Junction table: users participating in chats';
COMMENT ON COLUMN public.chat_participants.chat_id IS 'Reference to chat';
COMMENT ON COLUMN public.chat_participants.user_id IS 'Reference to user';
COMMENT ON COLUMN public.chat_participants.role IS 'Participant role (member/admin/owner)';
COMMENT ON COLUMN public.chat_participants.joined_at IS 'When user joined the chat';
COMMENT ON COLUMN public.chat_participants.last_read_at IS 'Last time user read messages (for unread count)';

-- Indexes
-- Index for querying all chats a user participates in
CREATE INDEX chat_participants_user_id_idx ON public.chat_participants(user_id);

-- Index for querying all participants in a chat
CREATE INDEX chat_participants_chat_id_idx ON public.chat_participants(chat_id);

