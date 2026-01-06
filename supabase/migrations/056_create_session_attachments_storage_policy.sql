-- Create storage bucket for session attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('session_attachments', 'session_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload to session_attachments bucket
CREATE POLICY "Authenticated users can upload session attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session_attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM study_sessions
      WHERE creator_id = auth.uid()
      OR id IN (
        SELECT session_id FROM study_session_participants
        WHERE user_id = auth.uid() AND status = 'accepted'
      )
    )
  );

-- Policy: Public read access to session attachments
CREATE POLICY "Public can view session attachments"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'session_attachments');

-- Policy: Users can update their own uploaded files
CREATE POLICY "Users can update their own session attachments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'session_attachments'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'session_attachments'
    AND owner = auth.uid()
  );

-- Policy: Creator or file owner can delete
CREATE POLICY "Creator or owner can delete session attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session_attachments'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM study_sessions
        WHERE creator_id = auth.uid()
      )
    )
  );
