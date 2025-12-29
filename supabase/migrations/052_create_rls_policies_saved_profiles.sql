-- ============================================================================
-- Migration: 052_create_rls_policies_saved_profiles.sql
-- Description: Create RLS policies for saved_profiles table
-- Dependencies: 051_create_saved_profiles.sql
-- ============================================================================

-- Saved profiles: SELECT policy
-- Users can only view their own saved profiles
CREATE POLICY "saved_profiles_select_own"
  ON public.saved_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Saved profiles: INSERT policy
-- Users can only save profiles for themselves
CREATE POLICY "saved_profiles_insert_own"
  ON public.saved_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Saved profiles: UPDATE policy
-- Users can only update their own saved profiles (soft delete)
CREATE POLICY "saved_profiles_update_own"
  ON public.saved_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saved profiles: DELETE policy
-- Users can soft-delete their own saved profiles
CREATE POLICY "saved_profiles_delete_own"
  ON public.saved_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON POLICY "saved_profiles_select_own" ON public.saved_profiles IS 
  'Users can only view their own saved profiles';
COMMENT ON POLICY "saved_profiles_insert_own" ON public.saved_profiles IS 
  'Users can only save profiles for themselves';
COMMENT ON POLICY "saved_profiles_update_own" ON public.saved_profiles IS 
  'Users can only update their own saved profiles';
COMMENT ON POLICY "saved_profiles_delete_own" ON public.saved_profiles IS 
  'Users can soft-delete their own saved profiles';

