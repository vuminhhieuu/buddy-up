/**
 * Session attachment types and interfaces
 */

export type SessionAttachmentType = 'image' | 'document' | 'note';

export interface SessionAttachment {
  id: string;
  session_id: string;
  type: SessionAttachmentType;
  name: string;
  url: string;
  size?: number | null;
  note_content?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateSessionAttachmentPayload {
  session_id: string;
  type: SessionAttachmentType;
  name: string;
  url: string;
  size?: number;
  note_content?: string;
  created_by: string;
}
