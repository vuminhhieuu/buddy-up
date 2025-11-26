/**
 * Profile Updates
 * Functions for updating user profile data
 */

import { supabase } from '../../config/supabase';
import { formatErrorMessage } from '../helpers';

/**
 * Update profile avatar URL
 */
export async function updateProfileAvatar(userId: string, avatarUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) {
    throw error;
  }
}

/**
 * Upload avatar image to Supabase Storage
 * @param userId - User ID
 * @param imageUri - Local image URI
 * @returns avatarUrl - Public URL of uploaded image
 */
export async function uploadAvatarToStorage(userId: string, imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const fileName = `${userId}_${Date.now()}.jpg`;
    const { error, data } = await supabase.storage.from('avatars').upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${formatErrorMessage(error)}`);
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    throw new Error(`Failed to upload avatar: ${formatErrorMessage(err)}`);
  }
}

/**
 * Update user profile in database
 * @param userId - User ID
 * @param displayName - User display name
 * @param studyGoal - User study goal
 * @param avatarUrl - Avatar public URL
 */
export async function updateProfileStep1(
  userId: string,
  displayName: string,
  studyGoal: string,
  avatarUrl?: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio: studyGoal,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Update failed: ${formatErrorMessage(error)}`);
    }
  } catch (err) {
    throw new Error(`Failed to update profile: ${formatErrorMessage(err)}`);
  }
}
