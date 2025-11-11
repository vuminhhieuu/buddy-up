-- ============================================================================
-- Migration: 021_create_rls_policies_study_session_participants.sql
-- Description: Create RLS policies for study_session_participants table
-- ============================================================================

-- Study session participants: SELECT policy
-- Users can see participants of sessions they created or are participating in
CREATE POLICY "study_session_participants_select_creator_or_participant"
  ON public.study_session_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_sessions
      WHERE study_sessions.id = study_session_participants.session_id
        AND (
          study_sessions.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.study_session_participants ssp2
            WHERE ssp2.session_id = study_sessions.id
              AND ssp2.user_id = auth.uid()
          )
        )
    )
  );

-- Study session participants: INSERT policy
-- Only session creator can invite participants
CREATE POLICY "study_session_participants_insert_creator"
  ON public.study_session_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.study_sessions
      WHERE study_sessions.id = study_session_participants.session_id
        AND study_sessions.creator_id = auth.uid()
    )
  );

-- Study session participants: UPDATE policy
-- Users can update their own participation status (accept/decline)
-- Creator can update any participant's status
CREATE POLICY "study_session_participants_update_own_or_creator"
  ON public.study_session_participants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.study_sessions
      WHERE study_sessions.id = study_session_participants.session_id
        AND study_sessions.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.study_sessions
      WHERE study_sessions.id = study_session_participants.session_id
        AND study_sessions.creator_id = auth.uid()
    )
  );

-- Study session participants: DELETE policy
-- Users can leave sessions (delete themselves)
-- Creator can remove any participant
CREATE POLICY "study_session_participants_delete_own_or_creator"
  ON public.study_session_participants
  FOR DELETE
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

-- Comments
COMMENT ON POLICY "study_session_participants_select_creator_or_participant" ON public.study_session_participants IS 
  'Users can see participants of sessions they created or are in';
COMMENT ON POLICY "study_session_participants_insert_creator" ON public.study_session_participants IS 
  'Only session creator can invite participants';
COMMENT ON POLICY "study_session_participants_update_own_or_creator" ON public.study_session_participants IS 
  'Users can update their own status, creator can update any participant';
COMMENT ON POLICY "study_session_participants_delete_own_or_creator" ON public.study_session_participants IS 
  'Users can leave sessions, creator can remove participants';

