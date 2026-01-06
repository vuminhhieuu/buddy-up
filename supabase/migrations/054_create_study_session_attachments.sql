-- Create study_session_attachments table
CREATE TABLE IF NOT EXISTS study_session_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'document', 'note')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  note_content TEXT,
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_attachments_session_id 
  ON study_session_attachments(session_id);

CREATE INDEX IF NOT EXISTS idx_session_attachments_type 
  ON study_session_attachments(session_id, type);

-- Create trigger to update updated_at
CREATE TRIGGER update_study_session_attachments_updated_at
  BEFORE UPDATE ON study_session_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE study_session_attachments IS 'Stores attachments (images, documents, notes) for study sessions';
COMMENT ON COLUMN study_session_attachments.type IS 'Type of attachment: image, document, or note';
COMMENT ON COLUMN study_session_attachments.note_content IS 'Text content for note type attachments';
