-- ============================================================================
-- Migration: 034_fix_chats_rls_policy_for_creator.sql
-- Description: Fix RLS policy recursion issue when creating direct chats
-- Problem: When creating a new chat, the chat_participants INSERT policy
--          needs to SELECT from chats, but chats SELECT policy requires
--          user to be a participant (which doesn't exist yet for new chats)
-- Solution: Allow chat creator to SELECT their own chats even before
--           participants are added
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "chats_select_participants" ON public.chats;

-- Create updated SELECT policy that allows creator to see their chats
-- even before participants are added (fixes race condition/recursion)
CREATE POLICY "chats_select_participants_or_creator"
  ON public.chats
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      -- Allow creator to see their own chats (even without participants yet)
      auth.uid() = created_by OR
      -- Allow participants to see chats they're in
      EXISTS (
        SELECT 1
        FROM public.chat_participants
        WHERE chat_participants.chat_id = chats.id
          AND chat_participants.user_id = auth.uid()
      )
    )
  );

-- Add comment
COMMENT ON POLICY "chats_select_participants_or_creator" ON public.chats IS 
  'Users can see chats where they are creator or participants';

