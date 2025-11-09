-- ============================================================================
-- Migration: 014_enable_rls.sql
-- Description: Enable Row Level Security (RLS) for all tables
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

