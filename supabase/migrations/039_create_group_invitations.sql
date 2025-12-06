-- ============================================================================
-- Migration: 039_create_group_invitations.sql
-- Description: Create group_invitations table for group invitations
-- Dependencies: study_groups, auth.users, 001_create_enums.sql
-- ============================================================================

-- Group invitations table
-- Stores invitations sent to users to join groups
CREATE TABLE public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status group_invitation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  
  UNIQUE(group_id, invitee_id),
  
  -- Cannot invite yourself
  CONSTRAINT group_invitations_no_self_invite CHECK (inviter_id <> invitee_id)
);

-- Comments
COMMENT ON TABLE public.group_invitations IS 'Invitations to join study groups';
COMMENT ON COLUMN public.group_invitations.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_invitations.inviter_id IS 'User who sent the invitation';
COMMENT ON COLUMN public.group_invitations.invitee_id IS 'User who received the invitation';
COMMENT ON COLUMN public.group_invitations.status IS 'Invitation status (pending/accepted/declined)';
COMMENT ON COLUMN public.group_invitations.created_at IS 'When invitation was sent';
COMMENT ON COLUMN public.group_invitations.responded_at IS 'When invitation was responded to';

-- Indexes
-- Index for querying invitations by invitee
CREATE INDEX group_invitations_invitee_id_idx ON public.group_invitations(invitee_id) 
  WHERE status = 'pending';

-- Index for querying invitations by group
CREATE INDEX group_invitations_group_id_idx ON public.group_invitations(group_id);

-- Index for querying invitations by inviter
CREATE INDEX group_invitations_inviter_id_idx ON public.group_invitations(inviter_id);

-- Function to automatically create group member when invitation is accepted
CREATE OR REPLACE FUNCTION handle_group_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert member with 'active' status
    INSERT INTO public.group_members (group_id, user_id, role, status, invited_by)
    VALUES (NEW.group_id, NEW.invitee_id, 'member', 'active', NEW.inviter_id)
    ON CONFLICT (group_id, user_id) DO UPDATE
    SET status = 'active',
        invited_by = NEW.inviter_id;
    
    -- Update responded_at
    NEW.responded_at = now();
  ELSIF NEW.status = 'declined' AND OLD.status = 'pending' THEN
    NEW.responded_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle invitation acceptance
CREATE TRIGGER handle_group_invitation_acceptance_trigger
  BEFORE UPDATE ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_group_invitation_acceptance();

