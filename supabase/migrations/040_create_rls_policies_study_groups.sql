-- ============================================================================
-- Migration: 040_create_rls_policies_study_groups.sql
-- Description: Create RLS policies for study_groups and related tables
-- ============================================================================

-- ============================================================================
-- Study Groups RLS Policies
-- ============================================================================

-- Study groups: SELECT policy
-- Public groups: Everyone can see
-- Private groups: Only members can see
CREATE POLICY "study_groups_select_public_or_member"
  ON public.study_groups
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      privacy_type = 'public' OR
      EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_members.group_id = study_groups.id
          AND group_members.user_id = auth.uid()
          AND group_members.status = 'active'
      )
    )
  );

-- Study groups: INSERT policy
-- Authenticated users can create groups
CREATE POLICY "study_groups_insert_authenticated"
  ON public.study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Study groups: UPDATE policy
-- Only creator/admins can update groups
CREATE POLICY "study_groups_update_creator_or_admin"
  ON public.study_groups
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = creator_id OR
      EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_members.group_id = study_groups.id
          AND group_members.user_id = auth.uid()
          AND group_members.role IN ('admin', 'owner')
          AND group_members.status = 'active'
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL AND
    (
      auth.uid() = creator_id OR
      EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_members.group_id = study_groups.id
          AND group_members.user_id = auth.uid()
          AND group_members.role IN ('admin', 'owner')
          AND group_members.status = 'active'
      )
    )
  );

-- Study groups: DELETE policy
-- Only creator can delete groups
CREATE POLICY "study_groups_delete_creator"
  ON public.study_groups
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = creator_id
  );

-- ============================================================================
-- Group Rules RLS Policies
-- ============================================================================

-- Group rules: SELECT policy
-- Members can see rules of groups they belong to
CREATE POLICY "group_rules_select_member"
  ON public.group_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_rules.group_id
        AND study_groups.deleted_at IS NULL
        AND (
          study_groups.privacy_type = 'public' OR
          EXISTS (
            SELECT 1
            FROM public.group_members
            WHERE group_members.group_id = study_groups.id
              AND group_members.user_id = auth.uid()
              AND group_members.status = 'active'
          )
        )
    )
  );

-- Group rules: INSERT policy
-- Only admins/owners can add rules
CREATE POLICY "group_rules_insert_admin"
  ON public.group_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = group_rules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('admin', 'owner')
        AND group_members.status = 'active'
    )
  );

-- Group rules: UPDATE policy
-- Only admins/owners can update rules
CREATE POLICY "group_rules_update_admin"
  ON public.group_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = group_rules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('admin', 'owner')
        AND group_members.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = group_rules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('admin', 'owner')
        AND group_members.status = 'active'
    )
  );

-- Group rules: DELETE policy
-- Only admins/owners can delete rules (except first rule)
CREATE POLICY "group_rules_delete_admin"
  ON public.group_rules
  FOR DELETE
  TO authenticated
  USING (
    order_index > 0 AND -- Cannot delete first rule (order_index = 0)
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = group_rules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('admin', 'owner')
        AND group_members.status = 'active'
    )
  );

-- ============================================================================
-- Group Members RLS Policies
-- ============================================================================

-- Group members: SELECT policy
-- Members can see other members of groups they belong to
CREATE POLICY "group_members_select_member"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_members.group_id
        AND study_groups.deleted_at IS NULL
        AND (
          study_groups.privacy_type = 'public' OR
          EXISTS (
            SELECT 1
            FROM public.group_members gm
            WHERE gm.group_id = study_groups.id
              AND gm.user_id = auth.uid()
              AND gm.status = 'active'
          )
        )
    )
  );

-- Group members: INSERT policy
-- Users can join public groups or accept invitations
CREATE POLICY "group_members_insert_join_or_invite"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_members.group_id
        AND study_groups.deleted_at IS NULL
        AND (
          (study_groups.privacy_type = 'public' AND NOT study_groups.requires_approval) OR
          EXISTS (
            SELECT 1
            FROM public.group_invitations
            WHERE group_invitations.group_id = study_groups.id
              AND group_invitations.invitee_id = auth.uid()
              AND group_invitations.status = 'accepted'
          )
        )
    )
  );

-- Group members: UPDATE policy
-- Admins can update member roles/status, users can update their own status (leave)
CREATE POLICY "group_members_update_admin_or_self"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_members.group_id
        AND study_groups.deleted_at IS NULL
    ) AND
    (
      auth.uid() = user_id OR -- User can update their own status (e.g., leave)
      EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role IN ('admin', 'owner')
          AND gm.status = 'active'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_members.group_id
        AND study_groups.deleted_at IS NULL
    ) AND
    (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role IN ('admin', 'owner')
          AND gm.status = 'active'
      )
    )
  );

-- Group members: DELETE policy
-- Only admins can remove members (users leave by updating status)
CREATE POLICY "group_members_delete_admin"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('admin', 'owner')
        AND gm.status = 'active'
    )
  );

-- ============================================================================
-- Group Invitations RLS Policies
-- ============================================================================

-- Group invitations: SELECT policy
-- Users can see invitations sent to them or by them
CREATE POLICY "group_invitations_select_self"
  ON public.group_invitations
  FOR SELECT
  TO authenticated
  USING (
    inviter_id = auth.uid() OR invitee_id = auth.uid()
  );

-- Group invitations: INSERT policy
-- Members can invite others (if they have permission)
CREATE POLICY "group_invitations_insert_member"
  ON public.group_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = inviter_id AND
    inviter_id <> invitee_id AND
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = group_invitations.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.status = 'active'
    )
  );

-- Group invitations: UPDATE policy
-- Invitees can accept/decline invitations
CREATE POLICY "group_invitations_update_invitee"
  ON public.group_invitations
  FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid());

-- Group invitations: DELETE policy
-- Inviters can cancel pending invitations
CREATE POLICY "group_invitations_delete_inviter"
  ON public.group_invitations
  FOR DELETE
  TO authenticated
  USING (
    inviter_id = auth.uid() AND status = 'pending'
  );

-- Comments
COMMENT ON POLICY "study_groups_select_public_or_member" ON public.study_groups IS 
  'Public groups visible to all, private groups visible to members only';
COMMENT ON POLICY "study_groups_insert_authenticated" ON public.study_groups IS 
  'Authenticated users can create groups';
COMMENT ON POLICY "study_groups_update_creator_or_admin" ON public.study_groups IS 
  'Only creator/admins can update groups';
COMMENT ON POLICY "study_groups_delete_creator" ON public.study_groups IS 
  'Only creator can delete groups';

