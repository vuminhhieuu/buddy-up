-- ============================================================================
-- Migration: 006_storage_and_attachments.sql
-- Description: Storage policies and attachments system for chats and study sessions
-- Dependencies: 001_core_database_schema.sql, 002_row_level_security.sql, 003_profiles_extensions.sql
-- ============================================================================

-- ============================================================================
-- STUDY SESSION ATTACHMENTS TABLE
-- ============================================================================

-- Study session attachments table
-- Stores attachments (images, documents, notes) for study sessions
CREATE TABLE public.study_session_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'document', 'note')),
  name text NOT NULL,
  url text NOT NULL,
  size integer,
  note_content text,
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.study_session_attachments IS 'Stores attachments (images, documents, notes) for study sessions';
COMMENT ON COLUMN public.study_session_attachments.session_id IS 'Reference to study session';
COMMENT ON COLUMN public.study_session_attachments.type IS 'Type of attachment: image, document, or note';
COMMENT ON COLUMN public.study_session_attachments.name IS 'File name or note title';
COMMENT ON COLUMN public.study_session_attachments.url IS 'URL to file (Supabase Storage) or empty for notes';
COMMENT ON COLUMN public.study_session_attachments.size IS 'File size in bytes (null for notes)';
COMMENT ON COLUMN public.study_session_attachments.note_content IS 'Text content for note type attachments';
COMMENT ON COLUMN public.study_session_attachments.created_by IS 'User who created the attachment';

-- ============================================================================
-- STUDY SESSIONS EXTENSIONS
-- ============================================================================

-- Add offline_location column to study_sessions table
ALTER TABLE public.study_sessions 
ADD COLUMN IF NOT EXISTS offline_location text;

-- Comment
COMMENT ON COLUMN public.study_sessions.offline_location IS 'Offline location address when session is not online';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Study session attachments indexes
CREATE INDEX study_session_attachments_session_id_idx 
  ON public.study_session_attachments(session_id);

CREATE INDEX study_session_attachments_type_idx 
  ON public.study_session_attachments(session_id, type);

CREATE INDEX study_session_attachments_created_by_idx 
  ON public.study_session_attachments(created_by);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Study session attachments updated_at trigger
CREATE TRIGGER update_study_session_attachments_updated_at
  BEFORE UPDATE ON public.study_session_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on attachments table
ALTER TABLE public.study_session_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR ATTACHMENTS
-- ============================================================================

-- Study session attachments policies
-- Users can see attachments for sessions they participate in or created
CREATE POLICY "study_session_attachments_select_participant"
  ON public.study_session_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.deleted_at IS NULL
        AND (
          ss.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.study_session_participants ssp
            WHERE ssp.session_id = ss.id
              AND ssp.user_id = auth.uid()
              AND ssp.status = 'accepted'
          )
        )
    )
  );

-- Users can create attachments for sessions they participate in or created
CREATE POLICY "study_session_attachments_insert_participant"
  ON public.study_session_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.deleted_at IS NULL
        AND (
          ss.creator_id = auth.uid() OR
          EXISTS (
            SELECT 1
            FROM public.study_session_participants ssp
            WHERE ssp.session_id = ss.id
              AND ssp.user_id = auth.uid()
              AND ssp.status = 'accepted'
          )
        )
    )
  );

-- Users can update their own attachments
CREATE POLICY "study_session_attachments_update_own"
  ON public.study_session_attachments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own attachments, or session creators can delete any
CREATE POLICY "study_session_attachments_delete_own_or_creator"
  ON public.study_session_attachments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1
      FROM public.study_sessions ss
      WHERE ss.id = session_id
        AND ss.creator_id = auth.uid()
        AND ss.deleted_at IS NULL
    )
  );

-- ============================================================================
-- STORAGE BUCKET CREATION AND POLICIES
-- ============================================================================

-- Create storage bucket for chat uploads (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_uploads', 'chat_uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for session attachments (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('session_attachments', 'session_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR CHAT UPLOADS
-- ============================================================================

-- Chat uploads storage policies
CREATE POLICY "storage_objects_insert_chat_uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat_uploads');

CREATE POLICY "storage_objects_select_chat_uploads" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat_uploads');

CREATE POLICY "storage_objects_delete_chat_uploads" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat_uploads');

CREATE POLICY "storage_objects_update_chat_uploads" ON storage.objects
  FOR UPDATE
  TO authenticated
  WITH CHECK (bucket_id = 'chat_uploads');

-- ============================================================================
-- STORAGE POLICIES FOR SESSION ATTACHMENTS
-- ============================================================================

-- Session attachments storage policies
-- Authenticated users can upload to session_attachments bucket if they're session participants
CREATE POLICY "storage_objects_insert_session_attachments" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session_attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.study_sessions
      WHERE creator_id = auth.uid()
        AND deleted_at IS NULL
      UNION
      SELECT session_id::text 
      FROM public.study_session_participants
      WHERE user_id = auth.uid() 
        AND status IN ('accepted', 'completed')
    )
  );

-- Public read access to session attachments (since bucket is public)
CREATE POLICY "storage_objects_select_session_attachments" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'session_attachments');

-- Users can update their own uploaded files
CREATE POLICY "storage_objects_update_session_attachments" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'session_attachments'
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'session_attachments'
    AND owner_id = auth.uid()
  );

-- Creator or file owner can delete
CREATE POLICY "storage_objects_delete_session_attachments" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session_attachments'
    AND (
      owner_id = auth.uid()
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.study_sessions
        WHERE creator_id = auth.uid()
          AND deleted_at IS NULL
      )
    )
  );

-- ============================================================================
-- COMMENTS ON STORAGE POLICIES
-- ============================================================================

COMMENT ON POLICY "storage_objects_insert_chat_uploads" ON storage.objects IS 
  'Allow authenticated users to upload files to chat_uploads bucket';

COMMENT ON POLICY "storage_objects_select_chat_uploads" ON storage.objects IS 
  'Allow authenticated users to view files in chat_uploads bucket';

COMMENT ON POLICY "storage_objects_insert_session_attachments" ON storage.objects IS 
  'Allow session participants and creators to upload files to session_attachments bucket';

COMMENT ON POLICY "storage_objects_select_session_attachments" ON storage.objects IS 
  'Allow public read access to session attachments';

COMMENT ON POLICY "storage_objects_delete_session_attachments" ON storage.objects IS 
  'Allow file owners or session creators to delete session attachments';