-- ============================================================================
-- Migration: 012_create_indexes.sql
-- Description: Create additional selective indexes for query optimization
-- Note: Some indexes were already created in table creation files
-- This file contains additional indexes based on query patterns
-- ============================================================================

-- Additional indexes for common query patterns

-- Profiles: Index for searching by display_name (if needed for user search)
CREATE INDEX profiles_display_name_idx ON public.profiles(display_name) 
  WHERE deleted_at IS NULL;

-- Connections: Composite index for querying connections by both users and status
CREATE INDEX connections_users_status_idx ON public.connections(user_id_1, user_id_2, status) 
  WHERE deleted_at IS NULL;

-- Messages: Index for querying unread messages (if last_read_at tracking is used)
-- Note: This would require a join with chat_participants, but included for completeness
-- CREATE INDEX messages_unread_idx ON public.messages(chat_id, created_at DESC)
--   WHERE deleted_at IS NULL;

-- Study sessions: Composite index for querying upcoming sessions by user
-- This would be used with a join on study_session_participants
-- CREATE INDEX study_sessions_upcoming_idx ON public.study_sessions(scheduled_start, status)
--   WHERE deleted_at IS NULL AND status IN ('scheduled', 'ongoing');

-- User progress: Index for leaderboard queries (order by level, xp)
CREATE INDEX user_progress_leaderboard_idx ON public.user_progress(level DESC, xp DESC);

-- Note: Most critical indexes were already created in individual table files.
-- This file is for additional indexes that may be needed based on specific query patterns.

