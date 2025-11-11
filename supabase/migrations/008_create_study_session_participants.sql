-- ============================================================================
-- Migration: 008_create_study_session_participants.sql
-- Description: Create study_session_participants junction table (N:M relationship)
-- Dependencies: study_sessions, auth.users
-- ============================================================================

-- Study session participants table
-- Junction table for many-to-many relationship between study_sessions and users
CREATE TABLE public.study_session_participants (
  session_id uuid NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'completed')),
  joined_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (session_id, user_id)
);

-- Comments
COMMENT ON TABLE public.study_session_participants IS 'Junction table: users participating in study sessions';
COMMENT ON COLUMN public.study_session_participants.session_id IS 'Reference to study session';
COMMENT ON COLUMN public.study_session_participants.user_id IS 'Reference to user';
COMMENT ON COLUMN public.study_session_participants.status IS 'Participant status (invited/accepted/declined/completed)';
COMMENT ON COLUMN public.study_session_participants.joined_at IS 'When user joined/accepted the session';

-- Indexes
-- Index for querying all sessions a user participates in
CREATE INDEX study_session_participants_user_id_idx ON public.study_session_participants(user_id);

-- Index for querying all participants in a session
CREATE INDEX study_session_participants_session_id_idx ON public.study_session_participants(session_id);

-- Index for querying by status (e.g., find all accepted participants)
CREATE INDEX study_session_participants_status_idx ON public.study_session_participants(status);

