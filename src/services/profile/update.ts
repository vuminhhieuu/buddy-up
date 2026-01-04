/**
 * Profile Updates
 * Functions for updating user profile data
 */

import { supabase } from '../../config/supabase';
import { formatErrorMessage } from '../helpers';
import type { EditProfileData } from '../../types/profile';

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
  bio?: string,
  location?: string,
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      display_name: displayName,
      main_learning_goal: studyGoal,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    // Only update bio if provided
    if (bio !== undefined) {
      updateData.bio = bio;
    }

    // Only update location if provided
    if (location !== undefined) {
      updateData.location = location;
    }

    const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);

    if (error) {
      throw new Error(`Update failed: ${formatErrorMessage(error)}`);
    }
  } catch (err) {
    throw new Error(`Failed to update profile: ${formatErrorMessage(err)}`);
  }
}

/**
 * Update full user profile with all editable fields
 * @param userId - User ID
 * @param profileData - Profile data to update (including academic fields)
 */
export async function updateFullProfile(
  userId: string,
  profileData: EditProfileData,
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      display_name: profileData.displayName,
      bio: profileData.bio,
      interests: profileData.interests || [],
      updated_at: new Date().toISOString(),
    };

    // Update location if provided
    if (profileData.location !== undefined) {
      updateData.location = profileData.location;
    }

    // Update main_learning_goal if provided (for backward compatibility)
    if (profileData.mainLearningGoal !== undefined) {
      updateData.main_learning_goal = profileData.mainLearningGoal;
    }

    // Update academic fields (NEW)
    if (profileData.university !== undefined) {
      updateData.university = profileData.university || null;
    }
    if (profileData.major !== undefined) {
      updateData.major = profileData.major || null;
    }
    if (profileData.subjects !== undefined) {
      updateData.current_subjects = profileData.subjects || [];
    }
    if (profileData.projects !== undefined) {
      updateData.current_projects = profileData.projects || [];
    }

    const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);

    if (error) {
      throw new Error(`Update failed: ${formatErrorMessage(error)}`);
    }
  } catch (err) {
    throw new Error(`Failed to update profile: ${formatErrorMessage(err)}`);
  }
}
