-- ============================================================================
-- Migration: 019_create_rls_policies_messages.sql
-- Description: Create RLS policies for messages table
-- ============================================================================

-- Messages: SELECT policy
-- Users can only see messages in chats where they are participants
CREATE POLICY "messages_select_participants"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
        AND chat_participants.user_id = auth.uid()
    )
  );

-- Messages: INSERT policy
-- Users can only send messages in chats where they are participants
CREATE POLICY "messages_insert_participants"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
        AND chat_participants.user_id = auth.uid()
    )
  );

-- Messages: UPDATE policy
-- Users can only edit their own messages
-- Chat admins/owners can edit any message in their chat
CREATE POLICY "messages_update_own_or_admin"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = sender_id OR
      EXISTS (
        SELECT 1
        FROM public.chats
        JOIN public.chat_participants ON chat_participants.chat_id = chats.id
        WHERE chats.id = messages.chat_id
          AND chat_participants.user_id = auth.uid()
          AND chat_participants.role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL AND
    (
      auth.uid() = sender_id OR
      EXISTS (
        SELECT 1
        FROM public.chats
        JOIN public.chat_participants ON chat_participants.chat_id = chats.id
        WHERE chats.id = messages.chat_id
          AND chat_participants.user_id = auth.uid()
          AND chat_participants.role IN ('admin', 'owner')
      )
    )
  );

-- Messages: DELETE policy
-- Users can delete their own messages
-- Chat admins/owners can delete any message in their chat
CREATE POLICY "messages_delete_own_or_admin"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = sender_id OR
      EXISTS (
        SELECT 1
        FROM public.chats
        JOIN public.chat_participants ON chat_participants.chat_id = chats.id
        WHERE chats.id = messages.chat_id
          AND chat_participants.user_id = auth.uid()
          AND chat_participants.role IN ('admin', 'owner')
      )
    )
  );

-- Comments
COMMENT ON POLICY "messages_select_participants" ON public.messages IS 
  'Users can only see messages in chats where they are participants';
COMMENT ON POLICY "messages_insert_participants" ON public.messages IS 
  'Users can only send messages in chats where they are participants';
COMMENT ON POLICY "messages_update_own_or_admin" ON public.messages IS 
  'Users can edit their own messages, admins can edit any message';
COMMENT ON POLICY "messages_delete_own_or_admin" ON public.messages IS 
  'Users can delete their own messages, admins can delete any message';

