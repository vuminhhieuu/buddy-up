-- ============================================================================
-- Migration: 020_create_rls_policies_study_sessions.sql
-- Description: Create RLS policies for study_sessions table
-- ============================================================================

-- Study sessions: SELECT policy
-- Users can see sessions they created or are participating in
CREATE POLICY "study_sessions_select_creator_or_participant"
  ON public.study_sessions
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = creator_id OR
      EXISTS (
        SELECT 1
        FROM public.study_session_participants
        WHERE study_session_participants.session_id = study_sessions.id
          AND study_session_participants.user_id = auth.uid()
      )
    )
  );

-- Study sessions: INSERT policy
-- Authenticated users can create study sessions
CREATE POLICY "study_sessions_insert_authenticated"
  ON public.study_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Study sessions: UPDATE policy
-- Only creator can update sessions
CREATE POLICY "study_sessions_update_creator"
  ON public.study_sessions
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = creator_id
  )
  WITH CHECK (
    deleted_at IS NULL AND
    auth.uid() = creator_id
  );

-- Study sessions: DELETE policy
-- Only creator can delete sessions
CREATE POLICY "study_sessions_delete_creator"
  ON public.study_sessions
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = creator_id
  );

-- Comments
COMMENT ON POLICY "study_sessions_select_creator_or_participant" ON public.study_sessions IS 
  'Users can see sessions they created or are participating in';
COMMENT ON POLICY "study_sessions_insert_authenticated" ON public.study_sessions IS 
  'Authenticated users can create study sessions';
COMMENT ON POLICY "study_sessions_update_creator" ON public.study_sessions IS 
  'Only creator can update sessions';
COMMENT ON POLICY "study_sessions_delete_creator" ON public.study_sessions IS 
  'Only creator can delete sessions';

