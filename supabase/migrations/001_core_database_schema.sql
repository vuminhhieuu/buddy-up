-- ============================================================================
-- Migration: 001_core_database_schema.sql
-- Description: Core database schema with ENUMs, tables, indexes, and triggers
-- Dependencies: auth.users (Supabase built-in)
-- ============================================================================

-- ============================================================================
-- ENUMs - Create all enumeration types first
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

-- ============================================================================
-- CORE TABLES - Create all core tables
-- ============================================================================

-- Profiles table
-- Extends Supabase auth.users with additional user profile information
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  interests text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Comments
COMMENT ON TABLE public.profiles IS 'Extended user profile information';
COMMENT ON COLUMN public.profiles.user_id IS 'References auth.users.id (1:1 relationship)';
COMMENT ON COLUMN public.profiles.display_name IS 'User display name shown in app';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image (Supabase Storage)';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description';
COMMENT ON COLUMN public.profiles.interests IS 'Array of user interests for matching';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Connections table
-- Manages friend requests and connections between users (self-referential N:M)
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure user cannot connect to themselves
  CONSTRAINT connections_no_self_connection CHECK (user_id_1 <> user_id_2)
);

-- Comments
COMMENT ON TABLE public.connections IS 'Friend requests and connections between users';
COMMENT ON COLUMN public.connections.user_id_1 IS 'First user in the connection pair';
COMMENT ON COLUMN public.connections.user_id_2 IS 'Second user in the connection pair';
COMMENT ON COLUMN public.connections.status IS 'Connection status (pending/accepted/blocked/rejected)';
COMMENT ON COLUMN public.connections.requested_by IS 'User who initiated the connection request';
COMMENT ON COLUMN public.connections.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Chats table
-- Stores chat/conversation information (both direct 1-1 and group chats)
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('direct', 'group')),
  title text, -- NULL for direct chats, name for group chats
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure title is provided for group chats
  CONSTRAINT chats_group_requires_title CHECK (
    (type = 'direct' AND title IS NULL) OR
    (type = 'group' AND title IS NOT NULL)
  )
);

-- Comments
COMMENT ON TABLE public.chats IS 'Chat conversations (direct 1-1 or group)';
COMMENT ON COLUMN public.chats.type IS 'Chat type: direct (1-1) or group';
COMMENT ON COLUMN public.chats.title IS 'Chat title (NULL for direct, required for group)';
COMMENT ON COLUMN public.chats.created_by IS 'User who created the chat';
COMMENT ON COLUMN public.chats.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Chat participants table
-- Junction table for many-to-many relationship between chats and users
CREATE TABLE public.chat_participants (
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role participant_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  
  PRIMARY KEY (chat_id, user_id)
);

-- Comments
COMMENT ON TABLE public.chat_participants IS 'Junction table: users participating in chats';
COMMENT ON COLUMN public.chat_participants.chat_id IS 'Reference to chat';
COMMENT ON COLUMN public.chat_participants.user_id IS 'Reference to user';
COMMENT ON COLUMN public.chat_participants.role IS 'Participant role (member/admin/owner)';
COMMENT ON COLUMN public.chat_participants.joined_at IS 'When user joined the chat';
COMMENT ON COLUMN public.chat_participants.last_read_at IS 'Last time user read messages (for unread count)';

-- Messages table
-- Stores individual messages within chats
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text,
  attachments jsonb DEFAULT '[]'::jsonb, -- Array of file metadata: [{url, type, name, size}]
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  
  -- Ensure message has either content or attachments
  CONSTRAINT messages_has_content CHECK (
    content IS NOT NULL OR 
    (attachments IS NOT NULL AND jsonb_array_length(attachments) > 0)
  )
);

-- Comments
COMMENT ON TABLE public.messages IS 'Messages within chats';
COMMENT ON COLUMN public.messages.chat_id IS 'Reference to chat this message belongs to';
COMMENT ON COLUMN public.messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN public.messages.content IS 'Message text content (nullable if only attachments)';
COMMENT ON COLUMN public.messages.attachments IS 'JSONB array of attachment metadata: [{url, type, name, size}]';
COMMENT ON COLUMN public.messages.edited_at IS 'Timestamp when message was edited (NULL = not edited)';
COMMENT ON COLUMN public.messages.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Study sessions table
-- Stores information about scheduled study sessions
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz,
  status session_status NOT NULL DEFAULT 'scheduled',
  location text, -- NULL for online sessions, address for in-person
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure scheduled_end is after scheduled_start if both provided
  CONSTRAINT study_sessions_valid_time_range CHECK (
    scheduled_end IS NULL OR scheduled_end > scheduled_start
  )
);

-- Comments
COMMENT ON TABLE public.study_sessions IS 'Scheduled study sessions';
COMMENT ON COLUMN public.study_sessions.creator_id IS 'User who created the session';
COMMENT ON COLUMN public.study_sessions.title IS 'Session title';
COMMENT ON COLUMN public.study_sessions.subject IS 'Subject/topic of the session';
COMMENT ON COLUMN public.study_sessions.scheduled_start IS 'When the session is scheduled to start';
COMMENT ON COLUMN public.study_sessions.scheduled_end IS 'When the session is scheduled to end (optional)';
COMMENT ON COLUMN public.study_sessions.status IS 'Current status of the session';
COMMENT ON COLUMN public.study_sessions.location IS 'Location (NULL for online, address for in-person)';
COMMENT ON COLUMN public.study_sessions.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Study session participants table
-- Junction table for many-to-many relationship between study_sessions and users
CREATE TABLE public.study_session_participants (
  session_id uuid NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'completed')),
  joined_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (session_id, user_id)
);

-- Comments
COMMENT ON TABLE public.study_session_participants IS 'Junction table: users participating in study sessions';
COMMENT ON COLUMN public.study_session_participants.session_id IS 'Reference to study session';
COMMENT ON COLUMN public.study_session_participants.user_id IS 'Reference to user';
COMMENT ON COLUMN public.study_session_participants.status IS 'Participant status (invited/accepted/declined/completed)';
COMMENT ON COLUMN public.study_session_participants.joined_at IS 'When user joined/accepted the session';

-- Badges table
-- Master table for achievement badges in the gamification system
CREATE TABLE public.badges (
  id text PRIMARY KEY, -- e.g., 'early_bird', 'study_streak_7', 'first_session'
  name text NOT NULL,
  description text,
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.badges IS 'Master table for achievement badges';
COMMENT ON COLUMN public.badges.id IS 'Badge identifier (e.g., early_bird, study_streak_7)';
COMMENT ON COLUMN public.badges.name IS 'Display name of the badge';
COMMENT ON COLUMN public.badges.description IS 'Description of how to earn this badge';
COMMENT ON COLUMN public.badges.icon_url IS 'URL to badge icon image';

-- User progress table
-- Tracks user's learning progress, XP, level, and streak (1:1 with user)
CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0, -- Consecutive days of activity
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.user_progress IS 'User progress tracking for gamification (1:1 with user)';
COMMENT ON COLUMN public.user_progress.user_id IS 'Reference to user (1:1 relationship)';
COMMENT ON COLUMN public.user_progress.level IS 'User level (increases with XP)';
COMMENT ON COLUMN public.user_progress.xp IS 'Experience points accumulated';
COMMENT ON COLUMN public.user_progress.streak IS 'Consecutive days of activity';

-- User badges table
-- Junction table for many-to-many relationship between users and badges
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  obtained_at timestamptz NOT NULL DEFAULT now(),
  
  PRIMARY KEY (user_id, badge_id)
);

-- Comments
COMMENT ON TABLE public.user_badges IS 'Junction table: badges earned by users';
COMMENT ON COLUMN public.user_badges.user_id IS 'Reference to user';
COMMENT ON COLUMN public.user_badges.badge_id IS 'Reference to badge';
COMMENT ON COLUMN public.user_badges.obtained_at IS 'When the user earned this badge';

-- ============================================================================
-- INDEXES - Create indexes for query optimization
-- ============================================================================

-- Connections indexes
CREATE INDEX connections_user_id_1_idx ON public.connections(user_id_1) WHERE deleted_at IS NULL;
CREATE INDEX connections_user_id_2_idx ON public.connections(user_id_2) WHERE deleted_at IS NULL;
CREATE INDEX connections_status_idx ON public.connections(status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX connections_unique_pair_idx
  ON public.connections (
    LEAST(user_id_1, user_id_2),
    GREATEST(user_id_1, user_id_2)
  )
  WHERE deleted_at IS NULL;
CREATE INDEX connections_users_status_idx ON public.connections(user_id_1, user_id_2, status) 
  WHERE deleted_at IS NULL;

-- Chats indexes
CREATE INDEX chats_created_by_idx ON public.chats(created_by) WHERE deleted_at IS NULL;
CREATE INDEX chats_type_idx ON public.chats(type) WHERE deleted_at IS NULL;

-- Chat participants indexes
CREATE INDEX chat_participants_user_id_idx ON public.chat_participants(user_id);
CREATE INDEX chat_participants_chat_id_idx ON public.chat_participants(chat_id);

-- Messages indexes
CREATE INDEX messages_chat_created_at_idx ON public.messages(chat_id, created_at DESC) 
  WHERE deleted_at IS NULL;
CREATE INDEX messages_sender_id_idx ON public.messages(sender_id) WHERE deleted_at IS NULL;

-- Study sessions indexes
CREATE INDEX study_sessions_creator_id_idx ON public.study_sessions(creator_id) 
  WHERE deleted_at IS NULL;
CREATE INDEX study_sessions_status_idx ON public.study_sessions(status) 
  WHERE deleted_at IS NULL;
CREATE INDEX study_sessions_scheduled_start_idx ON public.study_sessions(scheduled_start) 
  WHERE deleted_at IS NULL AND status IN ('scheduled', 'ongoing');

-- Study session participants indexes
CREATE INDEX study_session_participants_user_id_idx ON public.study_session_participants(user_id);
CREATE INDEX study_session_participants_session_id_idx ON public.study_session_participants(session_id);
CREATE INDEX study_session_participants_status_idx ON public.study_session_participants(status);

-- User badges indexes
CREATE INDEX user_badges_user_id_idx ON public.user_badges(user_id);
CREATE INDEX user_badges_badge_id_idx ON public.user_badges(badge_id);

-- Additional selective indexes
CREATE INDEX profiles_display_name_idx ON public.profiles(display_name) 
  WHERE deleted_at IS NULL;
CREATE INDEX user_progress_leaderboard_idx ON public.user_progress(level DESC, xp DESC);

-- ============================================================================
-- TRIGGERS - Create triggers for automatic updated_at timestamp updates
-- ============================================================================

-- Trigger function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 
  'Trigger function to automatically update updated_at timestamp on row update';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();