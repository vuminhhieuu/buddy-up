import { supabase } from '../config/supabase';

type ProfileSetupRow = {
  user_id: string;
  steps: Record<string, any> | null;
  last_saved_step: number | null;
  completed: boolean;
};

export async function saveStepForUser(
  userId: string,
  stepNumber: number,
  payload: any,
): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };
  // New RPC: upsert entire step JSON into profile_setup.data
  try {
    const { error } = await supabase.rpc('upsert_profile_setup_step', {
      _user_id: userId,
      _step: stepNumber,
      _data: payload,
      _region: null,
    });
    if (error) {
      console.warn('upsert_profile_setup_step RPC error', error);
    }
    // If RPC succeeded, attempt to update denormalized `profile_detail` so frontend can read quickly.
    try {
      if (!error) {
        // Read existing profile (authoritative) and all profile_setup rows to build an aggregated payload
        const [{ data: profile }, { data: setupRows }] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('profile_setup').select('data').eq('user_id', userId),
        ]);

        const aggregated: Record<string, any> = {};
        // Start with profile authoritative fields if present
        if (profile) {
          if (profile.display_name) aggregated.display_name = profile.display_name;
          if (profile.avatar_url) aggregated.avatar_url = profile.avatar_url;
          if (profile.bio) aggregated.bio = profile.bio;
          if (profile.interests) aggregated.interests = profile.interests;
        }

        // Merge step data (shallow merge)
        (setupRows || []).forEach((r: any) => {
          const d = r.data || {};
          if (typeof d === 'object' && d !== null) Object.assign(aggregated, d);
        });

        // Call RPC to upsert into profile_detail (non-blocking)
        const { error: pdErr } = await supabase.rpc('upsert_profile_detail', {
          _user_id: userId,
          _data: aggregated,
        });
        if (pdErr) {
          console.warn('upsert_profile_detail RPC error', pdErr);
        }
      }
    } catch (e: any) {
      console.warn('Failed to update profile_detail after upsert_profile_setup_step', e);
    }

    return { data: null, error };
  } catch (e: any) {
    return { error: e };
  }
}

export async function getProfileSetup(userId: string): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };
  // Read per-step JSON rows from the profile_setup table
  const { data: items, error } = await supabase
    .from('profile_setup')
    .select('step, data')
    .eq('user_id', userId);
  if (error) return { error };
  // group into steps object: { '1': dataObject, '2': dataObject }
  const steps: Record<string, any> = {};
  (items || []).forEach((r: any) => {
    const stepKey = String(r.step);
    steps[stepKey] = r.data || {};
  });

  return { data: { steps, items: items || [] }, error: null };
}

export async function getProfileSetupPivot(userId: string): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };

  // Try to read from the pivot view we created for step 1 and step 2
  try {
    const { data, error } = await supabase
      .from('profile_setup_steps_view')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { error };

    // data fields are returned as jsonb/boolean as defined in the view
    return { data, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function finalizeProfileSetup(userId: string): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };
  const { data: items, error: fetchError } = await supabase
    .from('profile_setup')
    .select('step, data')
    .eq('user_id', userId);
  if (fetchError) return { error: fetchError };

  const mergedProfile: Record<string, any> = {};
  (items || []).forEach((row: any) => {
    const dataObj = row.data || {};
    if (typeof dataObj === 'object' && dataObj !== null) {
      Object.assign(mergedProfile, dataObj);
    }
  });

  // Upsert using `user_id` column to match schema.
  const { data: profileUpserted, error: upsertError } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...mergedProfile }, { onConflict: 'user_id' })
    .select()
    .single();

  if (upsertError) return { error: upsertError };

  // Also update denormalized profile_detail for fast reads
  try {
    const { error: pdErr } = await supabase.rpc('upsert_profile_detail', {
      _user_id: userId,
      _data: mergedProfile,
    });
    if (pdErr) {
      console.warn('upsert_profile_detail RPC error during finalize', pdErr);
    }
  } catch (e) {
    console.warn('Failed to call upsert_profile_detail during finalize', e);
  }

  try {
    const { data: updated, error: updateError } = await supabase
      .from('profile_setup_legacy')
      .update({ completed: true })
      .eq('user_id', userId)
      .select()
      .single();
    return {
      data: { profile: profileUpserted, profile_setup_legacy: updated },
      error: updateError || null,
    };
  } catch (e) {
    return { data: { profile: profileUpserted }, error: null };
  }
}

export default {
  saveStepForUser,
  getProfileSetup,
  getProfileSetupPivot,
  finalizeProfileSetup,
};
