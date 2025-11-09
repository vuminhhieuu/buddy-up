-- ============================================================================
-- Migration: 016_create_rls_policies_connections.sql
-- Description: Create RLS policies for connections table
-- ============================================================================

-- Connections: SELECT policy
-- Users can only see connections where they are involved (user_id_1 or user_id_2)
CREATE POLICY "connections_select_involved"
  ON public.connections
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  );

-- Connections: INSERT policy
-- Users can create connection requests (must be the requester)
CREATE POLICY "connections_insert_own_request"
  ON public.connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requested_by AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2) AND
    user_id_1 <> user_id_2
  );

-- Connections: UPDATE policy
-- Users can update connections where they are involved
-- This allows accepting/rejecting requests, blocking, etc.
CREATE POLICY "connections_update_involved"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  )
  WITH CHECK (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  );

-- Connections: DELETE policy
-- Users can soft-delete connections where they are involved
CREATE POLICY "connections_delete_involved"
  ON public.connections
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  );

-- Comments
COMMENT ON POLICY "connections_select_involved" ON public.connections IS 
  'Users can only see connections where they are involved';
COMMENT ON POLICY "connections_insert_own_request" ON public.connections IS 
  'Users can create connection requests where they are the requester';
COMMENT ON POLICY "connections_update_involved" ON public.connections IS 
  'Users can update connections where they are involved (accept/reject/block)';
COMMENT ON POLICY "connections_delete_involved" ON public.connections IS 
  'Users can soft-delete connections where they are involved';

