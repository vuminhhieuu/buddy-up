-- ============================================================================
-- Migration: 029_fix_rls_study_session_participants_select.sql
-- Description: Replace SELECT policy on study_session_participants to avoid
--              nested self-referential EXISTS that causes infinite recursion
-- ============================================================================

-- Drop the old policy if it exists (safe to run multiple times)
DROP POLICY IF EXISTS "study_session_participants_select_creator_or_participant" ON public.study_session_participants;

-- Create a safer SELECT policy that does NOT perform a nested EXISTS query
-- against the same table. Behavior:
-- - A user can SELECT a participant row if they are the row owner (user_id = auth.uid())
-- - OR the session's creator can see all participant rows for their session
CREATE POLICY "study_session_participants_select_creator_or_participant"
  ON public.study_session_participants
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.study_sessions
      WHERE study_sessions.id = study_session_participants.session_id
        AND study_sessions.creator_id = auth.uid()
    )
  );

-- Recreate comments for policy clarity
COMMENT ON POLICY "study_session_participants_select_creator_or_participant" ON public.study_session_participants IS
  'Users can see participant rows if they are the row owner or the session creator';

-- Notes:
-- This migration intentionally removes the nested EXISTS that queried
-- `public.study_session_participants` (the cause of recursion). The trade-off is
-- that participants will only be able to SELECT their own participant row; they
-- will not automatically be allowed to SELECT the entire participant list for a
-- session. If you want participants to see the full list, consider one of the
-- longer-term solutions: a SECURITY DEFINER RPC (recommended) or a
-- SECURITY DEFINER helper function.
