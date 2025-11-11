-- ============================================================================
-- Migration: 015_create_rls_policies_profiles.sql
-- Description: Create RLS policies for profiles table
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

-- Comments
COMMENT ON POLICY "profiles_select_all" ON public.profiles IS 
  'All authenticated users can view active profiles';
COMMENT ON POLICY "profiles_insert_own" ON public.profiles IS 
  'Users can only create their own profile';
COMMENT ON POLICY "profiles_update_own" ON public.profiles IS 
  'Users can only update their own profile';
COMMENT ON POLICY "profiles_delete_own" ON public.profiles IS 
  'Users can soft-delete their own profile';

