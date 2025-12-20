/**
 * Connections Service (Friends)
 * Real data operations for fetching, blocking, and removing connections
 */

import { supabase } from '../config/supabase';
import { formatErrorMessage, isPgrst116Error } from './helpers';
import { logger } from '../utils/logger';

export type Friend = {
  connectionId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
};

/**
 * Fetch accepted friends for a user
 */
export async function fetchFriends(userId: string): Promise<Friend[]> {
  try {
    const { data: connections, error } = await supabase
      .from('connections')
      .select('id,user_id_1,user_id_2,status')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted');

    if (error && !isPgrst116Error(error)) throw error;
    const rows = connections || [];
    if (rows.length === 0) return [];

    const otherUserIds = rows.map((r: any) => (r.user_id_1 === userId ? r.user_id_2 : r.user_id_1));

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id,display_name,avatar_url')
      .in('user_id', otherUserIds);

    if (profilesError && !isPgrst116Error(profilesError)) throw profilesError;

    const profileMap = new Map<string, { display_name: string; avatar_url?: string | null }>();
    (profiles || []).forEach((p: any) =>
      profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }),
    );

    return rows.map((r: any) => {
      const otherId = r.user_id_1 === userId ? r.user_id_2 : r.user_id_1;
      const p = profileMap.get(otherId);
      return {
        connectionId: r.id,
        userId: otherId,
        displayName: p?.display_name || otherId,
        avatarUrl: p?.avatar_url || undefined,
      } as Friend;
    });
  } catch (err) {
    logger.warn('fetchFriends', 'Failed:', err);
    throw new Error(`Failed to fetch friends: ${formatErrorMessage(err)}`);
  }
}

/**
 * Block a connection (set status = 'blocked')
 */
export async function blockConnection(userId: string, connectionId: string): Promise<void> {
  // Ensure the requesting user is part of this connection
  const { data: conn, error: fetchError } = await supabase
    .from('connections')
    .select('id,user_id_1,user_id_2')
    .eq('id', connectionId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch connection: ${formatErrorMessage(fetchError)}`);
  if (!conn || (conn.user_id_1 !== userId && conn.user_id_2 !== userId)) {
    throw new Error('Unauthorized to modify this connection');
  }

  const { error } = await supabase
    .from('connections')
    .update({ status: 'blocked', updated_at: new Date().toISOString() })
    .eq('id', connectionId);
  if (error) throw new Error(`Failed to block connection: ${formatErrorMessage(error)}`);
}

/**
 * Remove a connection (delete)
 */
export async function removeConnection(userId: string, connectionId: string): Promise<void> {
  // Ensure the requesting user is part of this connection
  const { data: conn, error: fetchError } = await supabase
    .from('connections')
    .select('id,user_id_1,user_id_2')
    .eq('id', connectionId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch connection: ${formatErrorMessage(fetchError)}`);
  if (!conn || (conn.user_id_1 !== userId && conn.user_id_2 !== userId)) {
    throw new Error('Unauthorized to modify this connection');
  }

  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (error) throw new Error(`Failed to remove connection: ${formatErrorMessage(error)}`);
}
