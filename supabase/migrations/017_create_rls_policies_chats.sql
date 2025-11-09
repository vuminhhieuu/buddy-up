-- ============================================================================
-- Migration: 017_create_rls_policies_chats.sql
-- Description: Create RLS policies for chats table
-- ============================================================================

-- Chats: SELECT policy
-- Users can only see chats where they are participants
CREATE POLICY "chats_select_participants"
  ON public.chats
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_participants.chat_id = chats.id
        AND chat_participants.user_id = auth.uid()
    )
  );

-- Chats: INSERT policy
-- Authenticated users can create chats
CREATE POLICY "chats_insert_authenticated"
  ON public.chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Chats: UPDATE policy
-- Only chat creator or participants with admin/owner role can update
CREATE POLICY "chats_update_creator_or_admin"
  ON public.chats
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = created_by OR
      EXISTS (
        SELECT 1
        FROM public.chat_participants
        WHERE chat_participants.chat_id = chats.id
          AND chat_participants.user_id = auth.uid()
          AND chat_participants.role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL AND
    (
      auth.uid() = created_by OR
      EXISTS (
        SELECT 1
        FROM public.chat_participants
        WHERE chat_participants.chat_id = chats.id
          AND chat_participants.user_id = auth.uid()
          AND chat_participants.role IN ('admin', 'owner')
      )
    )
  );

-- Chats: DELETE policy
-- Only chat creator or participants with owner role can delete
CREATE POLICY "chats_delete_creator_or_owner"
  ON public.chats
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = created_by OR
      EXISTS (
        SELECT 1
        FROM public.chat_participants
        WHERE chat_participants.chat_id = chats.id
          AND chat_participants.user_id = auth.uid()
          AND chat_participants.role = 'owner'
      )
    )
  );

-- Comments
COMMENT ON POLICY "chats_select_participants" ON public.chats IS 
  'Users can only see chats where they are participants';
COMMENT ON POLICY "chats_insert_authenticated" ON public.chats IS 
  'Authenticated users can create chats';
COMMENT ON POLICY "chats_update_creator_or_admin" ON public.chats IS 
  'Only creator or admin/owner participants can update chats';
COMMENT ON POLICY "chats_delete_creator_or_owner" ON public.chats IS 
  'Only creator or owner participants can delete chats';

