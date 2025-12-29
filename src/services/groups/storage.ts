/**
 * Group Storage Service
 * Functions for uploading group images to Supabase Storage
 */

import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../config/supabase';
import { formatErrorMessage } from '../helpers';

// Maximum image size: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// Allowed file types
const ALLOWED_FILE_TYPES = ['application/pdf'];

/**
 * Upload group cover image to Supabase Storage
 * @param identifier - Group ID or User ID (if group not created yet)
 * @param imageUri - Local image URI
 * @returns coverImageUrl - Public URL of uploaded image
 */
/**
 * Generate a unique filename to avoid collisions
 */
function generateUniqueFileName(identifier: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9); // 7 random characters
  return `cover_${identifier}_${timestamp}_${random}.jpg`;
}

/**
 * Read file as Buffer from URI
 * Supports both web and native platforms
 */
async function readFileAsBuffer(uri: string): Promise<Buffer> {
  if (Platform.OS === 'web') {
    // For web, use fetch to get the file as blob, then convert to buffer
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      throw new Error(`Failed to read file on web: ${formatErrorMessage(error)}`);
    }
  } else {
    // For native platforms, use expo-file-system
    try {
      // Use the standard expo-file-system API (v19+)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return Buffer.from(base64, 'base64');
    } catch (error: any) {
      // If standard API fails, try legacy API as fallback
      try {
        const base64 = await readAsStringAsync(uri, {
          encoding: 'base64',
        });
        return Buffer.from(base64, 'base64');
      } catch (legacyError: any) {
        throw new Error(
          `Failed to read file on native: ${formatErrorMessage(error)}. Legacy fallback also failed: ${formatErrorMessage(legacyError)}`,
        );
      }
    }
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'jpg';
  }
}

/**
 * Validate image file type and size
 */
function validateImage(buffer: Buffer, mimeType: string): void {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error(
      `Invalid image type: ${mimeType}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    );
  }

  // Check file size
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    throw new Error(`Image size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }

  if (buffer.byteLength === 0) {
    throw new Error('Image file is empty');
  }
}

export async function uploadCoverImageToStorage(
  identifier: string,
  imageUri: string,
): Promise<string> {
  try {
    const buffer = await readFileAsBuffer(imageUri);
    const mimeType = getMimeTypeFromUri(imageUri);

    // Validate image before upload
    validateImage(buffer, mimeType);

    // Generate unique filename to avoid collisions
    const fileName = generateUniqueFileName(identifier);
    const { error, data } = await supabase.storage.from('group-covers').upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${formatErrorMessage(error)}`);
    }

    const { data: urlData } = supabase.storage.from('group-covers').getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    throw new Error(`Failed to upload cover image: ${formatErrorMessage(err)}`);
  }
}

/**
 * Delete group cover image from Supabase Storage
 * @param imageUrl - Public URL of the image to delete
 */
export async function deleteCoverImageFromStorage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from public URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    let fileName = pathParts[pathParts.length - 1];

    if (!fileName) {
      throw new Error('Invalid image URL');
    }

    // Decode URL-encoded characters in filename
    try {
      fileName = decodeURIComponent(fileName);
    } catch (decodeError) {
      // If decoding fails, use the original filename
      // This handles edge cases where the filename might not be encoded
    }

    const { error } = await supabase.storage.from('group-covers').remove([fileName]);

    if (error) {
      throw new Error(`Delete failed: ${formatErrorMessage(error)}`);
    }
  } catch (err) {
    throw new Error(`Failed to delete cover image: ${formatErrorMessage(err)}`);
  }
}

/**
 * Upload post image to Supabase Storage
 * @param groupId - Group ID
 * @param imageUri - Local image URI
 * @returns imageUrl - Public URL of uploaded image
 */
export async function uploadPostImageToStorage(groupId: string, imageUri: string): Promise<string> {
  try {
    const buffer = await readFileAsBuffer(imageUri);
    const mimeType = getMimeTypeFromUri(imageUri);

    // Validate image before upload
    validateImage(buffer, mimeType);

    // Generate unique filename with correct extension based on mimeType
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = getExtensionFromMimeType(mimeType);
    const fileName = `${groupId}/${timestamp}-${random}.${extension}`;

    const { error, data } = await supabase.storage.from('group-posts').upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${formatErrorMessage(error)}`);
    }

    const { data: urlData } = supabase.storage.from('group-posts').getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    throw new Error(`Failed to upload post image: ${formatErrorMessage(err)}`);
  }
}

/**
 * Validate file type and size
 */
function validateFile(buffer: Buffer, mimeType: string): void {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    throw new Error(
      `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
    );
  }

  // Check file size
  if (buffer.byteLength > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }

  if (buffer.byteLength === 0) {
    throw new Error('File is empty');
  }
}

/**
 * Upload post file (PDF) to Supabase Storage
 * @param groupId - Group ID
 * @param fileUri - Local file URI
 * @param fileName - Original file name
 * @returns fileUrl - Public URL of uploaded file
 */
export async function uploadPostFileToStorage(
  groupId: string,
  fileUri: string,
  fileName: string,
): Promise<string> {
  try {
    const buffer = await readFileAsBuffer(fileUri);
    const mimeType = 'application/pdf';

    // Validate file extension matches PDF
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Validate file before upload
    validateFile(buffer, mimeType);

    // Generate unique filename with PDF extension
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${groupId}/${timestamp}-${random}.pdf`;

    const { error, data } = await supabase.storage
      .from('group-posts')
      .upload(uniqueFileName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${formatErrorMessage(error)}`);
    }

    const { data: urlData } = supabase.storage.from('group-posts').getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    throw new Error(`Failed to upload post file: ${formatErrorMessage(err)}`);
  }
}

/**
 * Extract file path from public URL for group-posts bucket
 */
function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    // Find the index of 'group-posts' in the path
    const bucketIndex = pathParts.findIndex((part) => part === 'group-posts');
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null;
    }
    // Get the path after 'group-posts'
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    return filePath || null;
  } catch {
    return null;
  }
}

/**
 * Delete post images and files from Supabase Storage
 * @param imageUrls - Array of image URLs to delete
 * @param fileUrls - Array of file URLs to delete
 */
export async function deletePostFilesFromStorage(
  imageUrls: string[],
  fileUrls: string[],
): Promise<void> {
  const filesToDelete: string[] = [];

  // Extract file paths from image URLs
  for (const imageUrl of imageUrls) {
    const filePath = extractFilePathFromUrl(imageUrl);
    if (filePath) {
      filesToDelete.push(filePath);
    }
  }

  // Extract file paths from file URLs
  for (const fileUrl of fileUrls) {
    const filePath = extractFilePathFromUrl(fileUrl);
    if (filePath) {
      filesToDelete.push(filePath);
    }
  }

  if (filesToDelete.length === 0) {
    return;
  }

  try {
    const { error } = await supabase.storage.from('group-posts').remove(filesToDelete);
    if (error) {
      // Log error but don't throw - cleanup failures shouldn't block post deletion
      console.warn('Failed to delete some post files from storage:', error);
    }
  } catch (err) {
    // Log error but don't throw - cleanup failures shouldn't block post deletion
    console.warn('Error deleting post files from storage:', err);
  }
}
