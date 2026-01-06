-- ============================================================================
-- Migration: 057_add_offline_location_to_study_sessions.sql
-- Description: Add offline_location column to study_sessions table
-- Dependencies: 007_create_study_sessions.sql
-- ============================================================================

-- Add offline_location column to study_sessions table
ALTER TABLE public.study_sessions 
ADD COLUMN offline_location text;

-- Comment
COMMENT ON COLUMN public.study_sessions.offline_location IS 'Offline location address when session is not online';
