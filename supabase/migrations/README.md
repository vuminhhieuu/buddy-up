# Database Migrations

This directory contains SQL migration files for the Buddy Up database schema.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. **001_create_enums.sql** - Creates PostgreSQL ENUM types
2. **002_create_profiles.sql** - Creates profiles table (extends auth.users)
3. **003_create_connections.sql** - Creates connections table (friend system)
4. **004_create_chats.sql** - Creates chats table
5. **005_create_chat_participants.sql** - Creates chat_participants junction table
6. **006_create_messages.sql** - Creates messages table
7. **007_create_study_sessions.sql** - Creates study_sessions table
8. **008_create_study_session_participants.sql** - Creates study_session_participants junction table
9. **009_create_badges.sql** - Creates badges master table
10. **010_create_user_progress.sql** - Creates user_progress table
11. **011_create_user_badges.sql** - Creates user_badges junction table
12. **012_create_indexes.sql** - Creates additional indexes
13. **013_create_triggers.sql** - Creates triggers for auto-updating updated_at
14. **014_enable_rls.sql** - Enables Row Level Security on all tables
15. **015_create_rls_policies_profiles.sql** - RLS policies for profiles
16. **016_create_rls_policies_connections.sql** - RLS policies for connections
17. **017_create_rls_policies_chats.sql** - RLS policies for chats
18. **018_create_rls_policies_chat_participants.sql** - RLS policies for chat_participants
19. **019_create_rls_policies_messages.sql** - RLS policies for messages
20. **020_create_rls_policies_study_sessions.sql** - RLS policies for study_sessions
21. **021_create_rls_policies_study_session_participants.sql** - RLS policies for study_session_participants
22. **022_create_rls_policies_badges.sql** - RLS policies for badges
23. **023_create_rls_policies_user_progress.sql** - RLS policies for user_progress
24. **024_create_rls_policies_user_badges.sql** - RLS policies for user_badges
25. **025_create_rls_helper_functions.sql** - Helper functions for RLS (optional)

## Applying Migrations

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content in order
4. Execute each file sequentially

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply migrations manually
supabase migration up
```

### Option 3: Manual Application

1. Connect to your Supabase Postgres database
2. Run each SQL file in order using your preferred SQL client
3. Ensure all migrations complete successfully before proceeding

## Schema Overview

### Tables

- **profiles** - Extended user profile information (1:1 with auth.users)
- **connections** - Friend requests and connections (N:M self-referential)
- **chats** - Chat conversations (direct or group)
- **chat_participants** - Junction table for chat participants
- **messages** - Messages within chats
- **study_sessions** - Scheduled study sessions
- **study_session_participants** - Junction table for session participants
- **badges** - Master table for achievement badges
- **user_progress** - User progress tracking (1:1 with auth.users)
- **user_badges** - Junction table for user badges

### ENUM Types

- **connection_status** - `pending`, `accepted`, `blocked`, `rejected`
- **session_status** - `scheduled`, `ongoing`, `completed`, `canceled`
- **participant_role** - `member`, `admin`, `owner`

## Important Notes

- All tables use **soft delete** with `deleted_at` column
- All tables with `updated_at` have automatic triggers to update on row changes
- Foreign keys use appropriate `ON DELETE` actions (CASCADE, SET NULL)
- Indexes are created selectively based on query patterns
- **RLS (Row Level Security) is enabled** on all tables with comprehensive policies
- Policies ensure users can only access data they are authorized to see

## Documentation

- **[RLS Policies Reference Guide](./RLS_POLICIES_REFERENCE.md)** - Chi tiết về tất cả RLS policies, use cases, và code examples

## Dependencies

- Requires Supabase project with `auth.users` table (built-in)
- All migrations must be applied in sequential order
- Ensure you have appropriate database permissions

## Rollback

To rollback migrations, you would need to create reverse migration files. For now, if you need to reset:

1. Drop all tables in reverse dependency order
2. Drop all ENUM types
3. Re-apply migrations from scratch

**Note:** In production, always test migrations in a staging environment first!
