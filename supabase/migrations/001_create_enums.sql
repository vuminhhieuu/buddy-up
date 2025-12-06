-- ============================================================================
-- Migration: 001_create_enums.sql
-- Description: Create PostgreSQL ENUM types for Buddy Up database
-- ============================================================================

-- Connection status enum
-- Used in: connections table
CREATE TYPE connection_status AS ENUM (
  'pending',
  'accepted',
  'blocked',
  'rejected'
);

COMMENT ON TYPE connection_status IS 'Status of connection between two users';

-- Session status enum
-- Used in: study_sessions table
CREATE TYPE session_status AS ENUM (
  'scheduled',
  'ongoing',
  'completed',
  'canceled'
);

COMMENT ON TYPE session_status IS 'Status of a study session';

-- Participant role enum
-- Used in: chat_participants table
CREATE TYPE participant_role AS ENUM (
  'member',
  'admin',
  'owner'
);

COMMENT ON TYPE participant_role IS 'Role of a participant in a chat';

-- Group privacy type enum
-- Used in: study_groups table
CREATE TYPE group_privacy_type AS ENUM (
  'public',
  'private'
);

COMMENT ON TYPE group_privacy_type IS 'Privacy type of a study group';

-- Group member role enum
-- Used in: group_members table
CREATE TYPE group_member_role AS ENUM (
  'member',
  'moderator',
  'admin',
  'owner'
);

COMMENT ON TYPE group_member_role IS 'Role of a member in a study group';

-- Group member status enum
-- Used in: group_members table
CREATE TYPE group_member_status AS ENUM (
  'pending',
  'active',
  'banned',
  'left'
);

COMMENT ON TYPE group_member_status IS 'Status of a member in a study group';

-- Group invitation status enum
-- Used in: group_invitations table
CREATE TYPE group_invitation_status AS ENUM (
  'pending',
  'accepted',
  'declined'
);

COMMENT ON TYPE group_invitation_status IS 'Status of a group invitation';

