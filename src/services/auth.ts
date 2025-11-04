import { supabase } from '../config/supabase';

export async function signInWithEmail(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signUp(params);
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}


