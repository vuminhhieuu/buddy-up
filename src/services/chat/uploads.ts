import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';
import { supabase } from '../../config/supabase';
import { formatErrorMessage } from '../helpers';
import type { MessageAttachment } from './types';
import { readAsStringAsync } from 'expo-file-system/legacy';

const CHAT_UPLOAD_BUCKET = 'chat_uploads';

function getFileName(uri: string) {
  return uri.split('/').pop() ?? `file-${Date.now()}`;
}

async function readFileAsBuffer(uri: string) {
  const base64 = await readAsStringAsync(uri, {
    encoding: 'base64',
  });
  return Buffer.from(base64, 'base64');
}

async function uploadFile(filePath: string, buffer: Buffer, mimeType: string) {
  const { error } = await supabase.storage.from(CHAT_UPLOAD_BUCKET).upload(filePath, buffer, {
    cacheControl: '3600',
    upsert: true,
    contentType: mimeType,
  });

  if (error) {
    throw new Error(formatErrorMessage(error));
  }

  const { data } = supabase.storage.from(CHAT_UPLOAD_BUCKET).getPublicUrl(filePath);
  return {
    url: data.publicUrl,
    size: buffer.byteLength,
  };
}

export async function uploadChatImage(
  chatId: string,
  imageUri: string,
): Promise<MessageAttachment> {
  const fileNameSegment = getFileName(imageUri);
  const filePath = `${chatId}/images/${Date.now()}-${fileNameSegment}`;
  const mimeType = 'image/jpeg';
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  const buffer = await readFileAsBuffer(manipulated.uri);
  const { url, size } = await uploadFile(filePath, buffer, mimeType);
  const attachmentSize = size;

  return {
    url,
    type: 'image',
    name: fileNameSegment,
    size: attachmentSize,
    width: manipulated.width,
    height: manipulated.height,
  };
}

export async function uploadChatPdf(
  chatId: string,
  fileUri: string,
  fileNameOverride?: string,
): Promise<MessageAttachment> {
  const fileNameSegment = fileNameOverride ?? getFileName(fileUri);
  const filePath = `${chatId}/docs/${Date.now()}-${fileNameSegment}`;
  const mimeType = 'application/pdf';
  const buffer = await readFileAsBuffer(fileUri);
  const { url, size } = await uploadFile(filePath, buffer, mimeType);
  const attachmentSize = size;

  return {
    url,
    type: 'pdf',
    name: fileNameSegment,
    size: attachmentSize,
  };
}
