import { supabase } from '../config/supabase';

/**
 * Update display_name và avatar_url trong bảng profiles
 */
export async function updateProfileDisplayName(
  userId: string,
  displayName: string,
  avatarUri?: string,
): Promise<void> {
  const updateData: Record<string, string> = {
    display_name: displayName,
  };

  if (avatarUri) {
    updateData.avatar_url = avatarUri;
  }

  const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);

  if (error) throw error;
}

/**
 * Upload ảnh lên storage, return public URL
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  const fileName = `${userId}-${Date.now()}.jpg`;
  const filePath = `avatars/${userId}/${fileName}`;

  // Upload file
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, {
    uri: imageUri,
    type: 'image/jpeg',
    name: fileName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Mark profile setup as completed
 */
export async function markProfileSetupCompleted(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ profile_setup_completed: true })
    .eq('user_id', userId);

  if (error) throw error;
}
