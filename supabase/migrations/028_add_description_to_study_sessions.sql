-- ============================================================================
-- Migration: 028_add_description_to_study_sessions.sql
-- Description: Add a nullable text `description` column to study_sessions
-- ============================================================================

ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.study_sessions.description IS 'Optional free-form description for the session (human readable)';
