-- ============================================================================
-- Migration: 004_study_groups_system.sql
-- Description: Complete study groups system with direct chat functions, groups, posts, and saved profiles
-- Dependencies: 001_core_database_schema.sql, 002_row_level_security.sql, 003_profiles_extensions.sql
-- ============================================================================

-- ============================================================================
-- DIRECT CHAT CREATION FUNCTION
-- ============================================================================

-- Function to create a direct chat between two users
-- Returns the chat_id (existing or newly created)
CREATE OR REPLACE FUNCTION public.create_direct_chat(
  p_user_id_1 UUID,
  p_user_id_2 UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id UUID;
  v_existing_chat_id UUID;
BEGIN
  -- Validate: cannot create chat with self
  IF p_user_id_1 = p_user_id_2 THEN
    RAISE EXCEPTION 'Cannot create chat with yourself';
  END IF;

  -- Check if direct chat already exists between these two users
  SELECT c.id INTO v_existing_chat_id
  FROM chats c
  WHERE c.type = 'direct'
    AND c.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM chat_participants cp1
      WHERE cp1.chat_id = c.id AND cp1.user_id = p_user_id_1
    )
    AND EXISTS (
      SELECT 1 FROM chat_participants cp2
      WHERE cp2.chat_id = c.id AND cp2.user_id = p_user_id_2
    )
  LIMIT 1;

  -- If chat exists, return it
  IF v_existing_chat_id IS NOT NULL THEN
    RETURN v_existing_chat_id;
  END IF;

  -- Create new chat
  INSERT INTO chats (type, title, created_by)
  VALUES ('direct', NULL, p_user_id_1)
  RETURNING id INTO v_chat_id;

  -- Add both users as participants
  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES 
    (v_chat_id, p_user_id_1, 'member'),
    (v_chat_id, p_user_id_2, 'member');

  RETURN v_chat_id;
END;
$$;

COMMENT ON FUNCTION public.create_direct_chat IS 'Create or retrieve direct chat between two users';

-- ============================================================================
-- STUDY GROUPS TABLE
-- ============================================================================

-- Study groups table
-- Stores information about study groups (public and private)
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  cover_image_url text,
  icon_emoji text,
  slug text UNIQUE NOT NULL, -- Đường dẫn nhóm (buddyup.vn/g/slug)
  privacy_type group_privacy_type NOT NULL DEFAULT 'public',
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Chủ đề & Lĩnh vực
  topics text[] DEFAULT '{}', -- Mảng các chủ đề (IELTS, TOEIC, etc.)
  student_level text CHECK (student_level IN ('all', 'beginner', 'intermediate', 'advanced')),
  main_language text DEFAULT 'vi',
  expected_activity_frequency text CHECK (expected_activity_frequency IN ('daily', 'few_times_week', 'weekly', 'flexible')),
  
  -- Cài đặt
  requires_approval boolean DEFAULT false,
  posting_permission text DEFAULT 'all_members' CHECK (posting_permission IN ('all_members', 'admin_moderator_only')),
  
  -- Metadata
  member_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Constraints
  CONSTRAINT study_groups_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT study_groups_description_length CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
  CONSTRAINT study_groups_slug_format CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50)
);

-- Comments
COMMENT ON TABLE public.study_groups IS 'Study groups (public and private)';
COMMENT ON COLUMN public.study_groups.name IS 'Group name (3-100 characters)';
COMMENT ON COLUMN public.study_groups.description IS 'Group description (10-500 characters)';
COMMENT ON COLUMN public.study_groups.cover_image_url IS 'URL to group cover image (Supabase Storage)';
COMMENT ON COLUMN public.study_groups.icon_emoji IS 'Emoji icon for the group';
COMMENT ON COLUMN public.study_groups.slug IS 'URL-friendly identifier (buddyup.vn/g/slug)';
COMMENT ON COLUMN public.study_groups.privacy_type IS 'Privacy type: public or private';
COMMENT ON COLUMN public.study_groups.creator_id IS 'User who created the group';
COMMENT ON COLUMN public.study_groups.topics IS 'Array of topics/subjects (max 3)';
COMMENT ON COLUMN public.study_groups.student_level IS 'Target student level: all, beginner, intermediate, advanced';
COMMENT ON COLUMN public.study_groups.main_language IS 'Main language used in the group';
COMMENT ON COLUMN public.study_groups.expected_activity_frequency IS 'Expected activity frequency';
COMMENT ON COLUMN public.study_groups.requires_approval IS 'Whether new members need approval';
COMMENT ON COLUMN public.study_groups.posting_permission IS 'Who can post: all_members or admin_moderator_only';
COMMENT ON COLUMN public.study_groups.member_count IS 'Current number of active members';
COMMENT ON COLUMN public.study_groups.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- ============================================================================
-- GROUP RULES TABLE
-- ============================================================================

-- Group rules table
-- Stores rules for each study group
CREATE TABLE public.group_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  rule_text text NOT NULL,
  order_index int NOT NULL, -- Thứ tự hiển thị
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT group_rules_text_length CHECK (char_length(rule_text) >= 5 AND char_length(rule_text) <= 200),
  CONSTRAINT group_rules_order_positive CHECK (order_index >= 0)
);

-- Comments
COMMENT ON TABLE public.group_rules IS 'Rules for study groups';
COMMENT ON COLUMN public.group_rules.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_rules.rule_text IS 'Rule text (5-200 characters)';
COMMENT ON COLUMN public.group_rules.order_index IS 'Display order (0 = first rule)';

-- Constraint: Maximum 10 rules per group
CREATE OR REPLACE FUNCTION check_max_group_rules()
RETURNS TRIGGER AS $$
DECLARE
  rule_count int;
BEGIN
  SELECT COUNT(*) INTO rule_count
  FROM public.group_rules
  WHERE group_id = NEW.group_id;
  
  IF rule_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 rules allowed per group';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER max_group_rules_trigger
  BEFORE INSERT ON public.group_rules
  FOR EACH ROW
  EXECUTE FUNCTION check_max_group_rules();

-- ============================================================================
-- GROUP MEMBERS TABLE
-- ============================================================================

-- Group members table
-- Junction table for many-to-many relationship between users and study groups
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  status group_member_status NOT NULL DEFAULT 'pending',
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique membership per user per group
  CONSTRAINT group_members_unique_membership UNIQUE (group_id, user_id)
);

-- Comments
COMMENT ON TABLE public.group_members IS 'Junction table: users in study groups';
COMMENT ON COLUMN public.group_members.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_members.user_id IS 'Reference to user';
COMMENT ON COLUMN public.group_members.role IS 'Member role (member/moderator/admin/owner)';
COMMENT ON COLUMN public.group_members.status IS 'Member status (pending/active/banned/left)';
COMMENT ON COLUMN public.group_members.joined_at IS 'When user joined the group (approved)';

-- ============================================================================
-- GROUP INVITATIONS TABLE
-- ============================================================================

-- Group invitations table
-- Stores invitations sent to users to join groups
CREATE TABLE public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status group_invitation_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  
  -- Constraints
  CONSTRAINT group_invitations_no_self_invite CHECK (inviter_id <> invitee_id),
  CONSTRAINT group_invitations_message_length CHECK (message IS NULL OR char_length(message) <= 500)
);

-- Comments
COMMENT ON TABLE public.group_invitations IS 'Invitations to join study groups';
COMMENT ON COLUMN public.group_invitations.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_invitations.inviter_id IS 'User who sent the invitation';
COMMENT ON COLUMN public.group_invitations.invitee_id IS 'User who was invited';
COMMENT ON COLUMN public.group_invitations.status IS 'Invitation status (pending/accepted/declined)';
COMMENT ON COLUMN public.group_invitations.message IS 'Optional invitation message (max 500 chars)';
COMMENT ON COLUMN public.group_invitations.responded_at IS 'When invitation was responded to';

-- ============================================================================
-- CUSTOM TOPICS TABLE
-- ============================================================================

-- Custom topics table
-- Stores custom topics created by users for groups and sessions
CREATE TABLE public.custom_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id text NOT NULL UNIQUE, -- The topic ID (e.g., "custom-1234567890")
  topic_label text NOT NULL, -- The display label (e.g., "Tình nguyện")
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT custom_topics_topic_id_format CHECK (topic_id ~ '^custom-[0-9]+$'),
  CONSTRAINT custom_topics_label_length CHECK (char_length(topic_label) >= 2 AND char_length(topic_label) <= 100)
);

-- Comments
COMMENT ON TABLE public.custom_topics IS 'Custom topics created by users for groups and sessions';
COMMENT ON COLUMN public.custom_topics.topic_id IS 'Unique topic identifier (format: custom-{timestamp})';
COMMENT ON COLUMN public.custom_topics.topic_label IS 'Display label for the custom topic (2-100 characters)';

-- ============================================================================
-- GROUP POSTS TABLE
-- ============================================================================

-- Group posts table
-- Stores posts created by members in study groups
CREATE TABLE public.group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_urls text[] DEFAULT '{}', -- Array of image URLs (max 5 images)
  file_urls text[] DEFAULT '{}', -- Array of file URLs (max 3 files)
  
  -- Metadata
  like_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Constraints
  CONSTRAINT group_posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  CONSTRAINT group_posts_image_count CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 5),
  CONSTRAINT group_posts_file_count CHECK (array_length(file_urls, 1) IS NULL OR array_length(file_urls, 1) <= 3)
);

-- Comments
COMMENT ON TABLE public.group_posts IS 'Posts created by members in study groups';
COMMENT ON COLUMN public.group_posts.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_posts.author_id IS 'User who created the post';
COMMENT ON COLUMN public.group_posts.content IS 'Post content (1-5000 characters)';
COMMENT ON COLUMN public.group_posts.image_urls IS 'Array of image URLs (max 5 images)';
COMMENT ON COLUMN public.group_posts.file_urls IS 'Array of file URLs (max 3 files)';
COMMENT ON COLUMN public.group_posts.like_count IS 'Number of likes on the post';
COMMENT ON COLUMN public.group_posts.comment_count IS 'Number of comments on the post';
COMMENT ON COLUMN public.group_posts.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- ============================================================================
-- SAVED PROFILES TABLE
-- ============================================================================

-- Saved profiles table
-- Allows users to save/bookmark profiles they're interested in
CREATE TABLE public.saved_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure user cannot save their own profile
  CONSTRAINT saved_profiles_no_self_save CHECK (user_id <> saved_user_id)
);

-- Comments
COMMENT ON TABLE public.saved_profiles IS 'Saved/bookmarked profiles by users';
COMMENT ON COLUMN public.saved_profiles.user_id IS 'User who saved the profile';
COMMENT ON COLUMN public.saved_profiles.saved_user_id IS 'Profile that was saved';
COMMENT ON COLUMN public.saved_profiles.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Study groups indexes
CREATE INDEX study_groups_creator_id_idx ON public.study_groups(creator_id) WHERE deleted_at IS NULL;
CREATE INDEX study_groups_privacy_type_idx ON public.study_groups(privacy_type) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX study_groups_slug_idx ON public.study_groups(slug) WHERE deleted_at IS NULL;
CREATE INDEX study_groups_topics_idx ON public.study_groups USING GIN(topics) WHERE deleted_at IS NULL;
CREATE INDEX study_groups_public_idx ON public.study_groups(created_at DESC) WHERE deleted_at IS NULL AND privacy_type = 'public';

-- Group rules indexes
CREATE INDEX group_rules_group_id_idx ON public.group_rules(group_id);
CREATE INDEX group_rules_group_order_idx ON public.group_rules(group_id, order_index);

-- Group members indexes
CREATE INDEX group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX group_members_status_idx ON public.group_members(group_id, status);

-- Group invitations indexes
CREATE INDEX group_invitations_group_id_idx ON public.group_invitations(group_id);
CREATE INDEX group_invitations_invitee_id_idx ON public.group_invitations(invitee_id);
CREATE INDEX group_invitations_status_idx ON public.group_invitations(invitee_id, status);

-- Custom topics indexes
CREATE INDEX custom_topics_topic_id_idx ON public.custom_topics(topic_id);
CREATE INDEX custom_topics_created_at_idx ON public.custom_topics(created_at DESC);

-- Group posts indexes
CREATE INDEX group_posts_group_id_idx ON public.group_posts(group_id) WHERE deleted_at IS NULL;
CREATE INDEX group_posts_author_id_idx ON public.group_posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX group_posts_created_at_idx ON public.group_posts(group_id, created_at DESC) WHERE deleted_at IS NULL;

-- Saved profiles indexes
CREATE INDEX saved_profiles_user_id_idx ON public.saved_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX saved_profiles_saved_user_id_idx ON public.saved_profiles(saved_user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX saved_profiles_unique_save_idx ON public.saved_profiles(user_id, saved_user_id) WHERE deleted_at IS NULL;
CREATE INDEX saved_profiles_user_created_idx ON public.saved_profiles(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Apply updated_at triggers
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_topics_updated_at
  BEFORE UPDATE ON public.custom_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_profiles_updated_at
  BEFORE UPDATE ON public.saved_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR STUDY GROUPS SYSTEM
-- ============================================================================

-- Study groups policies
CREATE POLICY "study_groups_select_public_or_member"
  ON public.study_groups
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      privacy_type = 'public' OR
      creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = id AND gm.user_id = auth.uid() AND gm.status = 'active'
      )
    )
  );

CREATE POLICY "study_groups_insert_own"
  ON public.study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "study_groups_update_creator_or_admin"
  ON public.study_groups
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = id AND gm.user_id = auth.uid() 
        AND gm.role IN ('admin', 'owner') AND gm.status = 'active'
      )
    )
  );

-- Custom topics policies
CREATE POLICY "custom_topics_select_all"
  ON public.custom_topics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "custom_topics_insert_authenticated"
  ON public.custom_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "custom_topics_update_authenticated"
  ON public.custom_topics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Group rules policies
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
          study_groups.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = study_groups.id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "group_rules_insert_admin"
  ON public.group_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.deleted_at IS NULL
        AND (
          sg.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = sg.id 
            AND gm.user_id = auth.uid() 
            AND gm.role IN ('admin', 'owner')
            AND gm.status = 'active'
          )
        )
    )
  );

-- Group members policies
CREATE POLICY "group_members_select_member"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.deleted_at IS NULL
        AND (
          sg.privacy_type = 'public' OR
          sg.creator_id = auth.uid() OR
          user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm2
            WHERE gm2.group_id = sg.id 
            AND gm2.user_id = auth.uid() 
            AND gm2.status = 'active'
          )
        )
    )
  );

CREATE POLICY "group_members_insert_self_or_admin"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.deleted_at IS NULL
        AND (
          sg.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = sg.id 
            AND gm.user_id = auth.uid() 
            AND gm.role IN ('admin', 'owner')
            AND gm.status = 'active'
          )
        )
    )
  );

-- Group invitations policies
CREATE POLICY "group_invitations_select_involved"
  ON public.group_invitations
  FOR SELECT
  TO authenticated
  USING (
    inviter_id = auth.uid() OR
    invitee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.creator_id = auth.uid()
    )
  );

CREATE POLICY "group_invitations_insert_member"
  ON public.group_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.deleted_at IS NULL
        AND (
          sg.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = sg.id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'active'
          )
        )
    )
  );

-- Group posts policies
CREATE POLICY "group_posts_select_member"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.deleted_at IS NULL
        AND (
          sg.privacy_type = 'public' OR
          sg.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = sg.id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "group_posts_insert_member"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_id
        AND sg.deleted_at IS NULL
        AND (
          sg.posting_permission = 'all_members' OR
          sg.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = sg.id 
            AND gm.user_id = auth.uid() 
            AND gm.role IN ('admin', 'moderator', 'owner')
            AND gm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "group_posts_update_own"
  ON public.group_posts
  FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL AND author_id = auth.uid())
  WITH CHECK (deleted_at IS NULL AND author_id = auth.uid());

-- Saved profiles policies
CREATE POLICY "saved_profiles_select_own"
  ON public.saved_profiles
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND auth.uid() = user_id);

CREATE POLICY "saved_profiles_insert_own"
  ON public.saved_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_profiles_delete_own"
  ON public.saved_profiles
  FOR DELETE
  TO authenticated
  USING (deleted_at IS NULL AND auth.uid() = user_id);