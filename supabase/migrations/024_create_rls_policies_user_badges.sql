-- ============================================================================
-- Migration: 024_create_rls_policies_user_badges.sql
-- Description: Create RLS policies for user_badges table
-- ============================================================================

-- User badges: SELECT policy
-- Users can only view their own badges
CREATE POLICY "user_badges_select_own"
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User badges: INSERT policy
-- Only service role can insert badges (system awards badges)
-- Users cannot manually add badges to themselves
CREATE POLICY "user_badges_insert_service_role"
  ON public.user_badges
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Alternative: If you want to allow system to award badges via authenticated context,
-- you could create a function that checks conditions and awards badges.
-- For MVP, we'll use service role for badge awarding.

-- User badges: UPDATE policy
-- Badges are immutable once earned (no updates allowed)
-- If you need to update obtained_at, you could allow service role
CREATE POLICY "user_badges_update_service_role"
  ON public.user_badges
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User badges: DELETE policy
-- Badges are permanent once earned (no deletion allowed)
-- If you need to revoke badges, you could allow service role
CREATE POLICY "user_badges_delete_service_role"
  ON public.user_badges
  FOR DELETE
  TO service_role
  USING (true);

-- Comments
COMMENT ON POLICY "user_badges_select_own" ON public.user_badges IS 
  'Users can only view their own badges';
COMMENT ON POLICY "user_badges_insert_service_role" ON public.user_badges IS 
  'Only service role can award badges (system operation)';
COMMENT ON POLICY "user_badges_update_service_role" ON public.user_badges IS 
  'Only service role can update badges (if needed)';
COMMENT ON POLICY "user_badges_delete_service_role" ON public.user_badges IS 
  'Only service role can revoke badges (if needed)';

-- Note: For badge awarding, you would typically:
-- 1. Use a database function/trigger that checks conditions
-- 2. Call it via service role from backend
-- 3. Or use Supabase Edge Functions with service role

