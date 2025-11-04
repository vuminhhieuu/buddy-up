import { supabase } from '../config/supabase';

export async function uploadPublicFile(params: { bucket: string; path: string; file: Blob }) {
  const { data, error } = await supabase.storage.from(params.bucket).upload(params.path, params.file, {
    upsert: true,
  });
  if (error) throw error;
  return data;
}

export function getPublicUrl(params: { bucket: string; path: string }) {
  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
  return data.publicUrl;
}


