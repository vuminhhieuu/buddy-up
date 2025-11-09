-- ============================================================================
-- Migration: 023_create_rls_policies_user_progress.sql
-- Description: Create RLS policies for user_progress table
-- ============================================================================

-- User progress: SELECT policy
-- Users can only view their own progress
CREATE POLICY "user_progress_select_own"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User progress: INSERT policy
-- Users can only create their own progress record
-- Note: This is typically done automatically when user registers
CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User progress: UPDATE policy
-- Users can only update their own progress
-- System/backend can also update (via service role if needed)
CREATE POLICY "user_progress_update_own"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User progress: DELETE policy
-- Users cannot delete their progress (or only via service role)
-- Progress is tied to user account, deletion handled by CASCADE
-- For MVP, we'll restrict delete to service role only
CREATE POLICY "user_progress_delete_service_role"
  ON public.user_progress
  FOR DELETE
  TO service_role
  USING (true);

-- Comments
COMMENT ON POLICY "user_progress_select_own" ON public.user_progress IS 
  'Users can only view their own progress';
COMMENT ON POLICY "user_progress_insert_own" ON public.user_progress IS 
  'Users can only create their own progress record';
COMMENT ON POLICY "user_progress_update_own" ON public.user_progress IS 
  'Users can only update their own progress';
COMMENT ON POLICY "user_progress_delete_service_role" ON public.user_progress IS 
  'Only service role can delete progress (typically via user deletion CASCADE)';

