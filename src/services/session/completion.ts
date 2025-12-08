import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

export interface MarkSessionCompletedParams {
  sessionId: string;
  userId: string;
  rating?: number;
}

export async function markSessionCompleted({
  sessionId,
  userId,
  rating,
}: MarkSessionCompletedParams): Promise<{ error: any }> {
  try {
    logger.debug('markSessionCompleted', 'Marking session completed:', {
      sessionId,
      userId,
      rating,
    });

    // 1. Check if participant record exists, if not create it (for session creator)
    const { data: existingParticipant } = await supabase
      .from('study_session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingParticipant) {
      // Create participant record with 'completed' status
      const { error: insertError } = await supabase.from('study_session_participants').insert({
        session_id: sessionId,
        user_id: userId,
        status: 'completed',
      });

      if (insertError) {
        logger.error('markSessionCompleted', 'Error creating participant record:', insertError);
        return { error: insertError };
      }
    } else {
      // Update existing participant status to 'completed'
      const { error: updateError } = await supabase
        .from('study_session_participants')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (updateError) {
        logger.error('markSessionCompleted', 'Error updating participant status:', updateError);
        return { error: updateError };
      }
    }

    // 2. Update user progress - add XP for completing a session
    const XP_PER_SESSION = 50;

    try {
      // Atomically increment XP to avoid race conditions when multiple completions happen concurrently
      // Prefer a DB-level atomic increment via a stored procedure to avoid races.
      // The RPC 'increment_user_xp' should perform: UPDATE user_progress SET xp = xp + xp_increment, updated_at = now() WHERE user_id = user_id_input;
      const { error: xpUpdateError } = await supabase.rpc('increment_user_xp', {
        user_id_input: userId,
        xp_increment: XP_PER_SESSION,
      });

      if (xpUpdateError) {
        // If the RPC is missing on the database (PGRST202), this is expected when
        // the function hasn't been deployed. We silently fall back to the
        // optimistic client-side update but avoid emitting an error-level log to
        // prevent noisy error reports in the mobile console.
        if (xpUpdateError?.code === 'PGRST202') {
          logger.debug(
            'markSessionCompleted',
            'RPC increment_user_xp not found, attempting optimistic client-side fallback',
          );

          // Implement an optimistic-concurrency retry loop to reduce lost-updates.
          // This is still not as bulletproof as a DB-side atomic RPC, but it's
          // substantially safer than a blind read-then-write.
          try {
            const MAX_RETRIES = 3;
            const backoff = (attempt: number) =>
              new Promise((res) => setTimeout(res, attempt * 100));

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              try {
                const { data: existingProgress, error: fetchErr } = await supabase
                  .from('user_progress')
                  .select('xp, updated_at')
                  .eq('user_id', userId)
                  .maybeSingle();

                if (fetchErr) {
                  logger.warn(
                    'markSessionCompleted',
                    'Fallback: error fetching user_progress:',
                    fetchErr,
                  );
                  break;
                }

                const nowIso = new Date().toISOString();

                if (!existingProgress) {
                  const { error: insertErr } = await supabase.from('user_progress').insert({
                    user_id: userId,
                    xp: XP_PER_SESSION,
                    level: 1,
                    created_at: nowIso,
                    updated_at: nowIso,
                  });

                  if (!insertErr) {
                    logger.debug(
                      'markSessionCompleted',
                      'Fallback: inserted new user_progress row',
                    );
                    break;
                  }

                  logger.warn(
                    'markSessionCompleted',
                    'Fallback: insert error, will retry:',
                    insertErr,
                  );
                  await backoff(attempt);
                  continue;
                }

                const currentXp = (existingProgress.xp || 0) as number;
                const existingUpdatedAt = existingProgress.updated_at as string;
                const newXp = currentXp + XP_PER_SESSION;

                const { data: updatedRows, error: updateErr } = await supabase
                  .from('user_progress')
                  .update({ xp: newXp, updated_at: nowIso })
                  .eq('user_id', userId)
                  .eq('updated_at', existingUpdatedAt)
                  .select();

                if (updateErr) {
                  logger.warn(
                    'markSessionCompleted',
                    'Fallback: error updating user_progress:',
                    updateErr,
                  );
                  break;
                }

                if (updatedRows && updatedRows.length > 0) {
                  logger.debug('markSessionCompleted', 'Fallback: optimistic update succeeded');
                  break;
                }

                logger.warn(
                  'markSessionCompleted',
                  'Fallback: optimistic update conflict, retrying',
                  { attempt },
                );
                await backoff(attempt);
                continue;
              } catch (innerErr) {
                logger.warn(
                  'markSessionCompleted',
                  'Fallback: unexpected error during retry loop:',
                  innerErr,
                );
                break;
              }
            }
          } catch (fallbackErr) {
            logger.warn('markSessionCompleted', 'Error during XP fallback handling:', fallbackErr);
          }

          // Don't fail the whole operation if progress update fails
          return { error: null };
        }

        // For other RPC errors, log at error level so the issue is visible
        logger.error('markSessionCompleted', 'Error incrementing user XP via RPC:', xpUpdateError);
        return { error: null };
      }

      // Fetch updated XP to calculate new level
      const { data: updatedProgress, error: fetchUpdatedError } = await supabase
        .from('user_progress')
        .select('xp, level')
        .eq('user_id', userId)
        .single();

      if (fetchUpdatedError) {
        logger.error(
          'markSessionCompleted',
          'Error fetching updated user progress:',
          fetchUpdatedError,
        );
        return { error: null };
      }

      const updatedXp = updatedProgress?.xp || 0;
      const currentLevel = updatedProgress?.level || 1;
      const computedLevel = Math.floor(updatedXp / 100) + 1;

      // Update level if it changed
      if (computedLevel !== currentLevel) {
        const { error: levelUpdateError } = await supabase
          .from('user_progress')
          .update({ level: computedLevel, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (levelUpdateError) {
          logger.error('markSessionCompleted', 'Error updating user level:', levelUpdateError);
        } else {
          logger.debug('markSessionCompleted', 'User level updated:', {
            oldLevel: currentLevel,
            newLevel: computedLevel,
            xp: updatedXp,
          });
        }
      } else {
        logger.debug('markSessionCompleted', 'User XP incremented, level unchanged:', {
          xp: updatedXp,
          level: currentLevel,
        });
      }
    } catch (err) {
      logger.error('markSessionCompleted', 'Error updating user progress:', err);
      // don't fail whole operation
    }

    // TODO: Store rating if provided (may require a new table or column)
    if (rating) {
      logger.debug('markSessionCompleted', 'Rating received:', rating);
      // Could store in a session_ratings table or update study_sessions
    }

    return { error: null };
  } catch (err) {
    logger.error('markSessionCompleted', 'Unexpected error:', err);
    return { error: err };
  }
}
