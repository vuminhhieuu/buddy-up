-- ============================================================================
-- Migration: 030_add_is_session_participant_function_and_update_policies.sql
-- Description: Add SECURITY DEFINER helper function is_session_participant and
--              update study_sessions and study_session_participants SELECT
--              policies to use the helper (avoids mutual recursion)
-- ============================================================================

-- 1) Create SECURITY DEFINER helper function
-- This function is intentionally simple and only performs a SELECT.
-- It runs with the function owner's privileges (SECURITY DEFINER) so its
-- internal SELECT is not subject to RLS on the calling user's role.
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


-- 2) Update study_sessions SELECT policy to use the helper
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


-- 3) Update study_session_participants SELECT policy to use the helper
DROP POLICY IF EXISTS "study_session_participants_select_creator_or_participant" ON public.study_session_participants;

CREATE POLICY "study_session_participants_select_creator_or_participant"
  ON public.study_session_participants
  FOR SELECT
  TO authenticated
  USING (
    -- row owner OR session creator OR caller is participant
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
-- - The helper function intentionally only performs a simple SELECT. Avoid adding
--   dynamic SQL or other privileged operations to prevent accidental privilege escalation.
-- - After applying, test inserts/selects from client roles (not service_role) to verify behavior.
