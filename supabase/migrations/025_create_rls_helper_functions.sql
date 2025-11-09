-- ============================================================================
-- Migration: 025_create_rls_helper_functions.sql
-- Description: Create helper functions for RLS policies (optional, for optimization)
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
CREATE OR REPLACE FUNCTION public.is_session_participant(session_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.study_session_participants
    WHERE session_id = session_id_param
      AND user_id = user_id_param
  );
$$;

COMMENT ON FUNCTION public.is_session_participant IS 
  'Helper function to check if a user is a participant in a study session';

-- Note: These helper functions use SECURITY DEFINER to bypass RLS
-- when checking participation. This is safe because:
-- 1. They only return boolean (no data exposure)
-- 2. They are used within RLS policies (which already enforce security)
-- 3. They improve performance by avoiding repeated subqueries

-- Optional: You can use these functions in policies instead of subqueries
-- Example (not applied, just for reference):
-- USING (public.is_chat_participant(chat_id, auth.uid()))

-- For now, we'll keep the explicit subqueries in policies for clarity,
-- but these functions are available if you want to optimize later.

