-- ============================================================================
-- Migration: 006_create_messages.sql
-- Description: Create messages table for chat messages
-- Dependencies: chats, auth.users
-- ============================================================================

-- Messages table
-- Stores individual messages within chats
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text,
  attachments jsonb DEFAULT '[]'::jsonb, -- Array of file metadata: [{url, type, name, size}]
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  
  -- Ensure message has either content or attachments
  CONSTRAINT messages_has_content CHECK (
    content IS NOT NULL OR 
    (attachments IS NOT NULL AND jsonb_array_length(attachments) > 0)
  )
);

-- Comments
COMMENT ON TABLE public.messages IS 'Messages within chats';
COMMENT ON COLUMN public.messages.chat_id IS 'Reference to chat this message belongs to';
COMMENT ON COLUMN public.messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN public.messages.content IS 'Message text content (nullable if only attachments)';
COMMENT ON COLUMN public.messages.attachments IS 'JSONB array of attachment metadata: [{url, type, name, size}]';
COMMENT ON COLUMN public.messages.edited_at IS 'Timestamp when message was edited (NULL = not edited)';
COMMENT ON COLUMN public.messages.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Composite index for pagination: get messages for a chat, ordered by created_at DESC
CREATE INDEX messages_chat_created_at_idx ON public.messages(chat_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for querying messages by sender (optional, for user message history)
CREATE INDEX messages_sender_id_idx ON public.messages(sender_id) WHERE deleted_at IS NULL;

