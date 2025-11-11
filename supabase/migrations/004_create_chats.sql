-- ============================================================================
-- Migration: 004_create_chats.sql
-- Description: Create chats table for direct and group conversations
-- Dependencies: auth.users
-- ============================================================================

-- Chats table
-- Stores chat/conversation information (both direct 1-1 and group chats)
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('direct', 'group')),
  title text, -- NULL for direct chats, name for group chats
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure title is provided for group chats
  CONSTRAINT chats_group_requires_title CHECK (
    (type = 'direct' AND title IS NULL) OR
    (type = 'group' AND title IS NOT NULL)
  )
);

-- Comments
COMMENT ON TABLE public.chats IS 'Chat conversations (direct 1-1 or group)';
COMMENT ON COLUMN public.chats.type IS 'Chat type: direct (1-1) or group';
COMMENT ON COLUMN public.chats.title IS 'Chat title (NULL for direct, required for group)';
COMMENT ON COLUMN public.chats.created_by IS 'User who created the chat';
COMMENT ON COLUMN public.chats.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Index for querying chats by creator
CREATE INDEX chats_created_by_idx ON public.chats(created_by) WHERE deleted_at IS NULL;

-- Index for querying by type
CREATE INDEX chats_type_idx ON public.chats(type) WHERE deleted_at IS NULL;

