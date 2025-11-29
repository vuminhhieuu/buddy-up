-- ============================================================================
-- Migration: 031_recreate_is_session_participant_and_update_policies.sql
-- Description: DROP existing is_session_participant function if present (to
--              allow parameter renaming) and recreate it, then re-apply the
--              updated policies. This addresses errors like:
-- ERROR: 42P13: cannot change name of input parameter "session_id_param"
-- HINT: Use DROP FUNCTION is_session_participant(uuid,uuid) first.
-- ============================================================================

-- Drop the function if it exists (safe to run multiple times)
DROP FUNCTION IF EXISTS public.is_session_participant(uuid, uuid);

-- Recreate the helper function as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_session_participant(p_user uuid, p_session uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.study_session_participants
    WHERE session_id = p_session
      AND user_id = p_user
  );
$$;

COMMENT ON FUNCTION public.is_session_participant(uuid, uuid) IS
  'Helper (SECURITY DEFINER): returns true if given user_id is participant of session_id';

-- Recreate/replace the policies to ensure they reference the helper
DROP POLICY IF EXISTS "study_sessions_select_creator_or_participant" ON public.study_sessions;

CREATE POLICY "study_sessions_select_creator_or_participant"
  ON public.study_sessions
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.uid() = creator_id OR
      public.is_session_participant(auth.uid()::uuid, study_sessions.id)
    )
  );

COMMENT ON POLICY "study_sessions_select_creator_or_participant" ON public.study_sessions IS
  'Users can see sessions they created or are participating in (uses helper is_session_participant)';

DROP POLICY IF EXISTS "study_session_participants_select_creator_or_participant" ON public.study_session_participants;

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
    ) OR
    public.is_session_participant(auth.uid()::uuid, study_session_participants.session_id)
  );

COMMENT ON POLICY "study_session_participants_select_creator_or_participant" ON public.study_session_participants IS
  'Users can see participants of sessions they created or are participating in (uses helper is_session_participant)';

-- Notes:
-- If other DB objects depend on an older version of the function (rare), dropping
-- the function may fail; in that case inspect dependencies before running.
