-- ============================================================================
-- Migration: 038_create_group_members.sql
-- Description: Create group_members junction table for group membership
-- Dependencies: study_groups, auth.users, 001_create_enums.sql
-- ============================================================================

-- Group members table
-- Junction table for many-to-many relationship between groups and users
CREATE TABLE public.group_members (
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  status group_member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  PRIMARY KEY (group_id, user_id)
);

-- Comments
COMMENT ON TABLE public.group_members IS 'Junction table: users participating in study groups';
COMMENT ON COLUMN public.group_members.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_members.user_id IS 'Reference to user';
COMMENT ON COLUMN public.group_members.role IS 'Member role (member/moderator/admin/owner)';
COMMENT ON COLUMN public.group_members.status IS 'Member status (pending/active/banned/left)';
COMMENT ON COLUMN public.group_members.joined_at IS 'When user joined the group';
COMMENT ON COLUMN public.group_members.invited_by IS 'User who invited this member (NULL if self-joined)';

-- Indexes
-- Index for querying all groups a user is member of
CREATE INDEX group_members_user_id_idx ON public.group_members(user_id);

-- Index for querying all members in a group
CREATE INDEX group_members_group_id_idx ON public.group_members(group_id);

-- Index for querying active members
CREATE INDEX group_members_active_idx ON public.group_members(group_id, status) 
  WHERE status = 'active';

-- Index for querying by role
CREATE INDEX group_members_role_idx ON public.group_members(group_id, role);

-- Function to update member_count in study_groups
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.study_groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE public.study_groups
      SET member_count = GREATEST(0, member_count - 1)
      WHERE id = NEW.group_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE public.study_groups
      SET member_count = member_count + 1
      WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.study_groups
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.group_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update member_count
CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

