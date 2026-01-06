import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';
import { supabase } from '../../config/supabase';
import { formatErrorMessage } from '../helpers';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { SessionAttachment, CreateSessionAttachmentPayload } from '../../types/sessionAttachment';
import { logger } from '../../utils/logger';

const SESSION_ATTACHMENTS_BUCKET = 'session_attachments';

/**
 * Get file name from URI
 */
function getFileName(uri: string | undefined): string {
  if (!uri) return `file-${Date.now()}.jpg`;
  const normalizedUri = uri.includes('://') ? uri : `file://${uri}`;
  return normalizedUri.split('/').pop() ?? `file-${Date.now()}.jpg`;
}

/**
 * Normalize URI to include file:// schema if missing
 */
function normalizeFileUri(uri: string | undefined): string {
  if (!uri) throw new Error('URI is undefined');
  return uri.includes('://') ? uri : `file://${uri}`;
}

/**
 * Read file as buffer for upload
 */
async function readFileAsBuffer(uri: string): Promise<Buffer> {
  const base64 = await readAsStringAsync(uri, {
    encoding: 'base64',
  });
  return Buffer.from(base64, 'base64');
}

/**
 * Upload file to storage bucket
 */
async function uploadFile(
  filePath: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ url: string; size: number }> {
  const { error } = await supabase.storage
    .from(SESSION_ATTACHMENTS_BUCKET)
    .upload(filePath, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (error) {
    throw new Error(formatErrorMessage(error));
  }

  const { data } = supabase.storage.from(SESSION_ATTACHMENTS_BUCKET).getPublicUrl(filePath);
  return {
    url: data.publicUrl,
    size: buffer.byteLength,
  };
}

/**
 * Upload session image (compressed and resized)
 */
export async function uploadSessionImage(
  imageUri: string,
): Promise<{ url: string; size: number; name: string }> {
  try {
    if (!imageUri) {
      throw new Error('Image URI is undefined');
    }
    const normalizedUri = normalizeFileUri(imageUri);
    const fileNameSegment = getFileName(imageUri);
    const filePath = `temp/images/${Date.now()}-${fileNameSegment}`;
    const mimeType = 'image/jpeg';

    // Resize and compress image
    const manipulated = await ImageManipulator.manipulateAsync(
      normalizedUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );

    const buffer = await readFileAsBuffer(manipulated.uri);
    const { url, size } = await uploadFile(filePath, buffer, mimeType);

    return {
      url,
      size,
      name: fileNameSegment,
    };
  } catch (error) {
    logger.error('uploadSessionImage', 'Failed to upload image', error);
    throw error;
  }
}

/**
 * Upload session document (PDF)
 */
export async function uploadSessionDocument(
  documentUri: string,
  fileName?: string,
): Promise<{ url: string; size: number; name: string }> {
  try {
    if (!documentUri) {
      throw new Error('Document URI is undefined');
    }
    const normalizedUri = normalizeFileUri(documentUri);
    const fileNameSegment = fileName ?? getFileName(documentUri);
    const filePath = `temp/documents/${Date.now()}-${fileNameSegment}`;
    const mimeType = 'application/pdf';

    const buffer = await readFileAsBuffer(normalizedUri);
    const { url, size } = await uploadFile(filePath, buffer, mimeType);

    return {
      url,
      size,
      name: fileNameSegment,
    };
  } catch (error) {
    logger.error('uploadSessionDocument', 'Failed to upload document', error);
    throw error;
  }
}

/**
 * Add attachment record to database
 */
export async function addSessionAttachment(
  sessionId: string,
  attachment: Omit<CreateSessionAttachmentPayload, 'session_id'>,
): Promise<{ data: SessionAttachment | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('study_session_attachments')
      .insert({
        type: attachment.type,
        name: attachment.name,
        url: attachment.url,
        size: attachment.size ?? null,
        note_content: attachment.note_content ?? null,
        created_by: attachment.created_by,
      })
      .select()
      .single();

    if (error) {
      logger.error('addSessionAttachment', 'Failed to add attachment', error);
    }

    return { data, error };
  } catch (error) {
    logger.error('addSessionAttachment', 'Unexpected error', error);
    return { data: null, error };
  }
}

/**
 * Fetch all attachments for a session
 */
export async function fetchSessionAttachments(
  sessionId: string,
): Promise<{ data: SessionAttachment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('study_session_attachments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('fetchSessionAttachments', 'Failed to fetch attachments', error);
    }

    return { data, error };
  } catch (error) {
    logger.error('fetchSessionAttachments', 'Unexpected error', error);
    return { data: null, error };
  }
}

/**
 * Delete attachment (from database and storage)
 */
export async function deleteSessionAttachment(attachmentId: string): Promise<{ error: any }> {
  try {
    // First, get attachment info
    const { data: attachment, error: fetchError } = await supabase
      .from('study_session_attachments')
      .select('url, type, session_id')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      logger.error('deleteSessionAttachment', 'Failed to fetch attachment', fetchError);
      return { error: fetchError };
    }

    // Delete from storage if not a note (notes don't have files)
    if (attachment.type !== 'note' && attachment.url) {
      try {
        // Extract file path from URL
        const urlParts = attachment.url.split('/');
        const bucketIndex = urlParts.findIndex(
          (part: string) => part === SESSION_ATTACHMENTS_BUCKET,
        );
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          const { error: storageError } = await supabase.storage
            .from(SESSION_ATTACHMENTS_BUCKET)
            .remove([filePath]);

          if (storageError) {
            logger.warn('deleteSessionAttachment', 'Failed to delete from storage', storageError);
          }
        }
      } catch (storageErr) {
        logger.warn('deleteSessionAttachment', 'Storage deletion error', storageErr);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('study_session_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      logger.error('deleteSessionAttachment', 'Failed to delete attachment', error);
    }

    return { error };
  } catch (error) {
    logger.error('deleteSessionAttachment', 'Unexpected error', error);
    return { error };
  }
}

/**
 * Create a note attachment directly
 */
export async function createSessionNote(
  sessionId: string,
  noteContent: string,
  createdBy: string,
): Promise<{ data: SessionAttachment | null; error: any }> {
  return addSessionAttachment(sessionId, {
    type: 'note',
    name: 'Note',
    url: '', // Notes don't need URL
    note_content: noteContent,
    created_by: createdBy,
  });
}
