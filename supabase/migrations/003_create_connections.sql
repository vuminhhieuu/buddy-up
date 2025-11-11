-- ============================================================================
-- Migration: 003_create_connections.sql
-- Description: Create connections table for friend/connection system
-- Dependencies: auth.users
-- ============================================================================

-- Connections table
-- Manages friend requests and connections between users (self-referential N:M)
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure user cannot connect to themselves
  CONSTRAINT connections_no_self_connection CHECK (user_id_1 <> user_id_2)
);

-- Comments
COMMENT ON TABLE public.connections IS 'Friend requests and connections between users';
COMMENT ON COLUMN public.connections.user_id_1 IS 'First user in the connection pair';
COMMENT ON COLUMN public.connections.user_id_2 IS 'Second user in the connection pair';
COMMENT ON COLUMN public.connections.status IS 'Connection status (pending/accepted/blocked/rejected)';
COMMENT ON COLUMN public.connections.requested_by IS 'User who initiated the connection request';
COMMENT ON COLUMN public.connections.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Index for querying connections by user_id_1
CREATE INDEX connections_user_id_1_idx ON public.connections(user_id_1) WHERE deleted_at IS NULL;

-- Index for querying connections by user_id_2
CREATE INDEX connections_user_id_2_idx ON public.connections(user_id_2) WHERE deleted_at IS NULL;

-- Index for querying by status
CREATE INDEX connections_status_idx ON public.connections(status) WHERE deleted_at IS NULL;

-- Unique index to prevent duplicate pairs regardless of order
CREATE UNIQUE INDEX connections_unique_pair_idx
  ON public.connections (
    LEAST(user_id_1, user_id_2),
    GREATEST(user_id_1, user_id_2)
  )
  WHERE deleted_at IS NULL;

