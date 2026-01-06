-- ============================================================================
-- Migration: 002_row_level_security.sql
-- Description: Enable RLS and create all RLS policies with helper functions
-- Dependencies: 001_core_database_schema.sql
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
-- This ensures that by default, no rows are accessible until policies are created
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE public.profiles IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.connections IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.chats IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.chat_participants IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.messages IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.study_sessions IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.study_session_participants IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.badges IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.user_progress IS 'RLS enabled - policies required for access';
COMMENT ON TABLE public.user_badges IS 'RLS enabled - policies required for access';

-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================

-- Helper function: Check if user is participant in a chat
-- This can be used in policies to avoid repeated subqueries
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_id = chat_id_param
      AND user_id = user_id_param
  );
$$;

COMMENT ON FUNCTION public.is_chat_participant IS 
  'Helper function to check if a user is a participant in a chat';

-- Helper function: Check if user has admin/owner role in a chat
CREATE OR REPLACE FUNCTION public.is_chat_admin(chat_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_id = chat_id_param
      AND user_id = user_id_param
      AND role IN ('admin', 'owner')
  );
$$;

COMMENT ON FUNCTION public.is_chat_admin IS 
  'Helper function to check if a user has admin/owner role in a chat';

-- Helper function: Check if user is participant in a study session
CREATE OR REPLACE FUNCTION public.is_session_participant(p_user uuid, p_session uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.study_session_participants ssp
    JOIN public.study_sessions ss ON ssp.session_id = ss.id
    WHERE ssp.session_id = p_session
      AND ssp.user_id = p_user
      AND ss.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.is_session_participant IS 
  'Helper function to check if a user is a participant in a study session';

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Profiles: SELECT policy
-- All authenticated users can view profiles (for matching, search, etc.)
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Profiles: INSERT policy
-- Users can only insert their own profile (when they register)
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Profiles: UPDATE policy
-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles: DELETE policy
-- Users can soft-delete their own profile (set deleted_at)
-- Note: Hard delete is handled by CASCADE from auth.users
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- CONNECTIONS TABLE RLS POLICIES
-- ============================================================================

-- Connections: SELECT policy
-- Users can only see connections where they are involved (user_id_1 or user_id_2)
CREATE POLICY "connections_select_involved"
  ON public.connections
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  );

-- Connections: INSERT policy
-- Users can create connection requests (must be the requester)
CREATE POLICY "connections_insert_own_request"
  ON public.connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requested_by AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2) AND
    user_id_1 <> user_id_2
  );

-- Connections: UPDATE policy
-- Users can update connections where they are involved
-- This allows accepting/rejecting requests, blocking, etc.
CREATE POLICY "connections_update_involved"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  )
  WITH CHECK (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  );

-- Connections: DELETE policy
-- Users can soft-delete connections where they are involved
CREATE POLICY "connections_delete_involved"
  ON public.connections
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  );

-- ============================================================================
-- CHATS TABLE RLS POLICIES
-- ============================================================================

-- Chats: SELECT policy
-- Users can only see chats where they are participants OR creators
CREATE POLICY "chats_select_participant_or_creator"
  ON public.chats
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      -- User is the creator
      auth.uid() = created_by
      OR
      -- User is a participant
      EXISTS (
        SELECT 1
        FROM public.chat_participants cp
        WHERE cp.chat_id = chats.id
          AND cp.user_id = auth.uid()
      )
    )
  );

-- Chats: INSERT policy
-- Authenticated users can create chats (they become the creator)
CREATE POLICY "chats_insert_own"
  ON public.chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Chats: UPDATE policy
-- Only chat creators can update chat details (title, etc.)
-- Participants with admin/owner role can also update
CREATE POLICY "chats_update_creator_or_admin"
  ON public.chats
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      -- User is the creator
      auth.uid() = created_by
      OR
      -- User is admin/owner participant
      EXISTS (
        SELECT 1
        FROM public.chat_participants cp
        WHERE cp.chat_id = chats.id
          AND cp.user_id = auth.uid()
          AND cp.role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL AND
    (
      auth.uid() = created_by
      OR
      EXISTS (
        SELECT 1
        FROM public.chat_participants cp
        WHERE cp.chat_id = chats.id
          AND cp.user_id = auth.uid()
          AND cp.role IN ('admin', 'owner')
      )
    )
  );

-- Chats: DELETE policy
-- Only creators can soft-delete chats
CREATE POLICY "chats_delete_creator"
  ON public.chats
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = created_by
  );

-- ============================================================================
-- CHAT PARTICIPANTS TABLE RLS POLICIES
-- ============================================================================

-- Chat participants: SELECT policy
-- Users can see participants of chats they are also participating in
CREATE POLICY "chat_participants_select_same_chat"
  ON public.chat_participants
  FOR SELECT
  TO authenticated
  USING (
    -- User is also a participant in the same chat
    EXISTS (
      SELECT 1
      FROM public.chat_participants my_participation
      WHERE my_participation.chat_id = chat_participants.chat_id
        AND my_participation.user_id = auth.uid()
    )
  );

-- Chat participants: INSERT policy
-- Chat creators and admins can add new participants
-- Users can also join public chats (if implemented)
CREATE POLICY "chat_participants_insert_admin_or_self"
  ON public.chat_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is adding themselves (self-join)
    auth.uid() = user_id
    OR
    -- User is chat creator
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = chat_id
        AND c.created_by = auth.uid()
    )
    OR
    -- User has admin/owner role in the chat
    EXISTS (
      SELECT 1
      FROM public.chat_participants cp
      WHERE cp.chat_id = chat_participants.chat_id
        AND cp.user_id = auth.uid()
        AND cp.role IN ('admin', 'owner')
    )
  );

-- Chat participants: UPDATE policy
-- Users can update their own participation (role changes by admins)
-- Admins can update other participants' roles
CREATE POLICY "chat_participants_update_self_or_admin"
  ON public.chat_participants
  FOR UPDATE
  TO authenticated
  USING (
    -- User is updating their own participation
    auth.uid() = user_id
    OR
    -- User is chat creator
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = chat_id
        AND c.created_by = auth.uid()
    )
    OR
    -- User has admin/owner role in the chat
    EXISTS (
      SELECT 1
      FROM public.chat_participants cp
      WHERE cp.chat_id = chat_participants.chat_id
        AND cp.user_id = auth.uid()
        AND cp.role IN ('admin', 'owner')
    )
  );

-- Chat participants: DELETE policy
-- Users can leave chats (delete their own participation)
-- Admins can remove other participants
CREATE POLICY "chat_participants_delete_self_or_admin"
  ON public.chat_participants
  FOR DELETE
  TO authenticated
  USING (
    -- User is leaving (deleting their own participation)
    auth.uid() = user_id
    OR
    -- User is chat creator
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = chat_id
        AND c.created_by = auth.uid()
    )
    OR
    -- User has admin/owner role in the chat
    EXISTS (
      SELECT 1
      FROM public.chat_participants cp
      WHERE cp.chat_id = chat_participants.chat_id
        AND cp.user_id = auth.uid()
        AND cp.role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- MESSAGES TABLE RLS POLICIES
-- ============================================================================

-- Messages: SELECT policy
-- Users can only see messages in chats where they are participants
CREATE POLICY "messages_select_participant"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1
      FROM public.chat_participants cp
      WHERE cp.chat_id = messages.chat_id
        AND cp.user_id = auth.uid()
    )
  );

-- Messages: INSERT policy
-- Only chat participants can send messages
CREATE POLICY "messages_insert_participant"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1
      FROM public.chat_participants cp
      WHERE cp.chat_id = messages.chat_id
        AND cp.user_id = auth.uid()
    )
  );

-- Messages: UPDATE policy
-- Only message senders can edit their own messages
CREATE POLICY "messages_update_own"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = sender_id
  )
  WITH CHECK (
    deleted_at IS NULL AND
    auth.uid() = sender_id
  );

-- Messages: DELETE policy
-- Message senders and chat admins can delete messages
CREATE POLICY "messages_delete_own_or_admin"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      -- User is the message sender
      auth.uid() = sender_id
      OR
      -- User is admin/owner in the chat
      EXISTS (
        SELECT 1
        FROM public.chat_participants cp
        WHERE cp.chat_id = messages.chat_id
          AND cp.user_id = auth.uid()
          AND cp.role IN ('admin', 'owner')
      )
    )
  );

-- ============================================================================
-- STUDY SESSIONS TABLE RLS POLICIES
-- ============================================================================

-- Study sessions: SELECT policy
-- Users can see sessions they created or participate in
CREATE POLICY "study_sessions_select_creator_or_participant"
  ON public.study_sessions
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      -- User is the creator
      auth.uid() = creator_id
      OR
      -- User is a participant
      public.is_session_participant(auth.uid()::uuid, study_sessions.id)
    )
  );

-- Study sessions: INSERT policy
-- Authenticated users can create sessions (they become the creator)
CREATE POLICY "study_sessions_insert_own"
  ON public.study_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Study sessions: UPDATE policy
-- Only session creators can update session details
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
-- Only creators can soft-delete sessions
CREATE POLICY "study_sessions_delete_creator"
  ON public.study_sessions
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = creator_id
  );

-- ============================================================================
-- STUDY SESSION PARTICIPANTS TABLE RLS POLICIES
-- ============================================================================

-- Study session participants: SELECT policy
-- Users can see participants of sessions they are also in, or sessions they created
CREATE POLICY "study_session_participants_select_creator_or_participant"
  ON public.study_session_participants
  FOR SELECT
  TO authenticated
  USING (
    -- User is a participant in the same session OR session creator
    public.is_session_participant(auth.uid()::uuid, session_id)
    OR
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.creator_id = auth.uid()
        AND ss.deleted_at IS NULL
    )
  );

-- Study session participants: INSERT policy
-- Session creators can add participants
-- Users can join sessions (if allowed by business logic)
CREATE POLICY "study_session_participants_insert_creator_or_self"
  ON public.study_session_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is adding themselves
    auth.uid() = user_id
    OR
    -- User is session creator
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.creator_id = auth.uid()
    )
  );

-- Study session participants: UPDATE policy
-- Users can update their own participation status
-- Session creators can update any participant
CREATE POLICY "study_session_participants_update_self_or_creator"
  ON public.study_session_participants
  FOR UPDATE
  TO authenticated
  USING (
    -- User is updating their own participation
    auth.uid() = user_id
    OR
    -- User is session creator
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.creator_id = auth.uid()
    )
  );

-- Study session participants: DELETE policy
-- Users can leave sessions (delete their own participation)
-- Session creators can remove any participant
CREATE POLICY "study_session_participants_delete_self_or_creator"
  ON public.study_session_participants
  FOR DELETE
  TO authenticated
  USING (
    -- User is leaving (deleting their own participation)
    auth.uid() = user_id
    OR
    -- User is session creator
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- BADGES TABLE RLS POLICIES
-- ============================================================================

-- Badges: SELECT policy
-- All authenticated users can view badges (read-only reference table)
CREATE POLICY "badges_select_all"
  ON public.badges
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for badges table
-- Badges are managed by admins through database migrations or admin functions

-- ============================================================================
-- USER PROGRESS TABLE RLS POLICIES
-- ============================================================================

-- User progress: SELECT policy
-- Users can only see their own progress
CREATE POLICY "user_progress_select_own"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User progress: INSERT policy
-- Users can only create their own progress record
CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User progress: UPDATE policy
-- Users can only update their own progress
CREATE POLICY "user_progress_update_own"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User progress: DELETE policy
-- Users can only delete their own progress
CREATE POLICY "user_progress_delete_own"
  ON public.user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER BADGES TABLE RLS POLICIES
-- ============================================================================

-- User badges: SELECT policy
-- Users can see their own badges and badges of others (for profile viewing)
CREATE POLICY "user_badges_select_all"
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- User badges: INSERT policy
-- This should be handled by application logic/triggers, not direct user input
-- For now, only allow users to insert their own badges (but this might be restricted further)
CREATE POLICY "user_badges_insert_own"
  ON public.user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy for user_badges (badges are permanent once earned)

-- User badges: DELETE policy
-- Users can remove their own badges (optional feature)
CREATE POLICY "user_badges_delete_own"
  ON public.user_badges
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

