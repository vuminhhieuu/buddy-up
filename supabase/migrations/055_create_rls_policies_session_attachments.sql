-- Enable RLS on study_session_attachments
ALTER TABLE study_session_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view attachments for sessions they can see
CREATE POLICY "Users can view attachments for visible sessions"
  ON study_session_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions s
      WHERE s.id = study_session_attachments.session_id
      AND s.deleted_at IS NULL
      AND (
        s.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM study_session_participants ssp
          WHERE ssp.session_id = s.id
          AND ssp.user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Session creator and participants can insert attachments
CREATE POLICY "Session participants can add attachments"
  ON study_session_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM study_sessions s
      WHERE s.id = session_id
      AND s.deleted_at IS NULL
      AND (
        s.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM study_session_participants ssp
          WHERE ssp.session_id = s.id
          AND ssp.user_id = auth.uid()
          AND ssp.status = 'accepted'
        )
      )
    )
  );

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update their own attachments"
  ON study_session_attachments
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Creator and attachment owner can delete
CREATE POLICY "Creator or owner can delete attachments"
  ON study_session_attachments
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM study_sessions s
      WHERE s.id = session_id
      AND s.creator_id = auth.uid()
    )
  );
