-- ============================================================================
-- Migration: 022_create_rls_policies_badges.sql
-- Description: Create RLS policies for badges table
-- ============================================================================

-- Badges: SELECT policy
-- All authenticated users can view badges (public read)
CREATE POLICY "badges_select_all"
  ON public.badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Badges: INSERT policy
-- Only service role can insert badges (admin operation)
-- Regular users cannot create badges
-- Note: This requires service_role key, not anon key
CREATE POLICY "badges_insert_service_role"
  ON public.badges
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Badges: UPDATE policy
-- Only service role can update badges
CREATE POLICY "badges_update_service_role"
  ON public.badges
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Badges: DELETE policy
-- Only service role can delete badges
CREATE POLICY "badges_delete_service_role"
  ON public.badges
  FOR DELETE
  TO service_role
  USING (true);

-- Comments
COMMENT ON POLICY "badges_select_all" ON public.badges IS 
  'All authenticated users can view badges (public read)';
COMMENT ON POLICY "badges_insert_service_role" ON public.badges IS 
  'Only service role can create badges (admin operation)';
COMMENT ON POLICY "badges_update_service_role" ON public.badges IS 
  'Only service role can update badges';
COMMENT ON POLICY "badges_delete_service_role" ON public.badges IS 
  'Only service role can delete badges';

-- Note: For MVP, if you want to allow authenticated users to manage badges,
-- you can create a separate admin role or use a different approach.
-- For now, badges are managed via service role (backend/admin operations).

