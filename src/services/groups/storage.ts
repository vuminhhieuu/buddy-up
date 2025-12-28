/**
 * Group Storage Service
 * Functions for uploading group images to Supabase Storage
 */

import { supabase } from '../../config/supabase';
import { formatErrorMessage } from '../helpers';

// Maximum image size: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
 * Validate image file type and size
 */
function validateImage(blob: Blob): void {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(blob.type)) {
    throw new Error(
      `Invalid image type: ${blob.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    );
  }

  // Check file size
  if (blob.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    throw new Error(`Image size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }

  if (blob.size === 0) {
    throw new Error('Image file is empty');
  }
}

export async function uploadCoverImageToStorage(
  identifier: string,
  imageUri: string,
): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Validate image before upload
    validateImage(blob);

    // Generate unique filename to avoid collisions
    const fileName = generateUniqueFileName(identifier);
    const { error, data } = await supabase.storage.from('group-covers').upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
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
