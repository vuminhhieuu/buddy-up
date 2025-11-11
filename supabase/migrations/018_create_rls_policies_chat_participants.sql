-- ============================================================================
-- Migration: 018_create_rls_policies_chat_participants.sql
-- Description: Create RLS policies for chat_participants table
-- ============================================================================

-- Chat participants: SELECT policy
-- Users can see participants of chats they are in
CREATE POLICY "chat_participants_select_in_chat"
  ON public.chat_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_participants cp2
      WHERE cp2.chat_id = chat_participants.chat_id
        AND cp2.user_id = auth.uid()
    )
  );

-- Chat participants: INSERT policy
-- Only chat creator or admin/owner can add participants
CREATE POLICY "chat_participants_insert_admin_or_creator"
  ON public.chat_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats
      WHERE chats.id = chat_participants.chat_id
        AND (
          chats.created_by = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.chat_participants cp
            WHERE cp.chat_id = chats.id
              AND cp.user_id = auth.uid()
              AND cp.role IN ('admin', 'owner')
          )
        )
    )
  );

-- Chat participants: UPDATE policy
-- Users can update their own participation (e.g., last_read_at)
-- Admins/owners can update roles of other participants
CREATE POLICY "chat_participants_update_own_or_admin"
  ON public.chat_participants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.chats
      WHERE chats.id = chat_participants.chat_id
        AND (
          chats.created_by = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.chat_participants cp
            WHERE cp.chat_id = chats.id
              AND cp.user_id = auth.uid()
              AND cp.role IN ('admin', 'owner')
          )
        )
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.chats
      WHERE chats.id = chat_participants.chat_id
        AND (
          chats.created_by = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.chat_participants cp
            WHERE cp.chat_id = chats.id
              AND cp.user_id = auth.uid()
              AND cp.role IN ('admin', 'owner')
          )
        )
    )
  );

-- Chat participants: DELETE policy
-- Users can leave chats (delete themselves)
-- Admins/owners can remove other participants
CREATE POLICY "chat_participants_delete_own_or_admin"
  ON public.chat_participants
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.chats
      WHERE chats.id = chat_participants.chat_id
        AND (
          chats.created_by = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.chat_participants cp
            WHERE cp.chat_id = chats.id
              AND cp.user_id = auth.uid()
              AND cp.role IN ('admin', 'owner')
          )
        )
    )
  );

-- Comments
COMMENT ON POLICY "chat_participants_select_in_chat" ON public.chat_participants IS 
  'Users can see participants of chats they are in';
COMMENT ON POLICY "chat_participants_insert_admin_or_creator" ON public.chat_participants IS 
  'Only creator or admin/owner can add participants';
COMMENT ON POLICY "chat_participants_update_own_or_admin" ON public.chat_participants IS 
  'Users can update their own participation, admins can update roles';
COMMENT ON POLICY "chat_participants_delete_own_or_admin" ON public.chat_participants IS 
  'Users can leave chats, admins can remove participants';

