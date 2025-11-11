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

