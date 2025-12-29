import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

type ProfileSetupRow = {
  user_id: string;
  steps: Record<string, any> | null;
  last_saved_step: number | null;
  completed: boolean;
};

export async function saveStepForUser(
  userId: string,
  payload: any,
  includeEmptyArrays = false,
): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };
  const processedPayload: Record<string, any> = {};
  if (payload && typeof payload === 'object') {
    Object.entries(payload).forEach(([k, v]) => (processedPayload[k] = v));
  }
  if (processedPayload.study_goal !== undefined) {
    processedPayload.main_learning_goal = processedPayload.study_goal;
    delete processedPayload.study_goal;
  }
  if (processedPayload.studyGoal !== undefined) {
    processedPayload.main_learning_goal = processedPayload.studyGoal;
    delete processedPayload.studyGoal;
  }
  if (processedPayload.displayName !== undefined) {
    processedPayload.display_name = processedPayload.displayName;
    delete processedPayload.displayName;
  }
  if (processedPayload.avatarUri !== undefined) {
    processedPayload.avatar_url = processedPayload.avatarUri;
    delete processedPayload.avatarUri;
  }
  if (processedPayload.learning_interests !== undefined) {
    processedPayload.interests = processedPayload.learning_interests;
    delete processedPayload.learning_interests;
  }
  Object.keys(processedPayload).forEach((k) => {
    const v = processedPayload[k];
    if (v === undefined) delete processedPayload[k];
    if (!includeEmptyArrays && Array.isArray(v) && v.length === 0) delete processedPayload[k];
  });

  try {
    logger.debug('supabaseHelpers', '[saveStepForUser] processedPayload ->', processedPayload);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      logger.debug(
        'supabaseHelpers',
        '[saveStepForUser] auth session user id ->',
        sessionData?.session?.user?.id ?? null,
      );
    } catch (e) {
      logger.warn('supabaseHelpers', '[saveStepForUser] failed to get session', e);
    }

    const { data: existingProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr) {
      logger.warn(
        'supabaseHelpers',
        '[saveStepForUser] failed to fetch existing profile',
        fetchErr,
      );
    }

    let resData: any = null;
    let resError: any = null;

    if (existingProfile) {
      const { data: updated, error: updateErr } = await supabase
        .from('profiles')
        .update(processedPayload)
        .eq('user_id', userId)
        .select()
        .single();
      resData = updated;
      resError = updateErr;
      logger.debug('supabaseHelpers', '[saveStepForUser] performed UPDATE ->', {
        data: resData,
        error: resError,
      });
    } else {
      const insertPayload = { user_id: userId, ...(processedPayload || {}) } as Record<string, any>;
      if (insertPayload.display_name === undefined || insertPayload.display_name === null) {
        insertPayload.display_name = '';
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert(insertPayload)
        .select()
        .single();
      resData = inserted;
      resError = insertErr;
      logger.debug('supabaseHelpers', '[saveStepForUser] performed INSERT ->', {
        data: resData,
        error: resError,
      });
    }

    if (resError) {
      logger.warn('supabaseHelpers', 'Failed to save profiles for saveStepForUser', resError);
      return { error: resError };
    }

    return { data: resData, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function getProfileSetup(userId: string): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };
  try {
    const { data: items, error } = await supabase
      .from('profile_setup')
      .select('step, data')
      .eq('user_id', userId);
    if (!error && Array.isArray(items)) {
      const steps: Record<string, any> = {};
      (items || []).forEach((r: any) => {
        const stepKey = String(r.step);
        steps[stepKey] = r.data || {};
      });
      return { data: { steps, items: items || [] }, error: null };
    }
  } catch (e) {
    logger.debug(
      'supabaseHelpers',
      '[getProfileSetup] Failed to fetch from profile_setup table',
      e,
    );
  }

  try {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (pErr) return { error: pErr };
    const steps: Record<string, any> = { '1': profile || {} };
    return { data: { steps, items: [] }, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function getProfileSetupPivot(userId: string): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };

  try {
    const { data, error } = await supabase
      .from('profile_setup_steps_view')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { error };

    return { data, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function finalizeProfileSetup(userId: string): Promise<{ data?: any; error?: any }> {
  if (!userId) return { error: new Error('userId required') };
  try {
    const { data: items, error: fetchError } = await supabase
      .from('profile_setup')
      .select('step, data')
      .eq('user_id', userId);
    if (!fetchError && Array.isArray(items) && items.length > 0) {
      const mergedProfile: Record<string, any> = {};
      (items || []).forEach((row: any) => {
        const dataObj = row.data || {};
        if (typeof dataObj === 'object' && dataObj !== null) {
          Object.assign(mergedProfile, dataObj);
        }
      });

      const { data: profileUpserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, ...mergedProfile }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) return { error: upsertError };

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
  } catch (e) {
    logger.debug(
      'supabaseHelpers',
      '[saveProfileSetupStep] Failed to process profile_setup table',
      e,
    );
  }

  try {
    const { data: profileRow, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { error };
    return { data: { profile: profileRow }, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export default {
  saveStepForUser,
  getProfileSetup,
  getProfileSetupPivot,
  finalizeProfileSetup,
};
