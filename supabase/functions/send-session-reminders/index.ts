/**
 * Send Session Reminders Edge Function
 * - Query session_reminders due (scheduled_at <= now and sent = false)
 * - For each reminder: send push via Expo (reusing logic from send-notification)
 * - Insert an in-app notification row and a session_reminder_logs row
 * - Mark session_reminders.sent = true, sent_at = now()
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Allow only POST or OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration or service role key' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch due reminders (limit to 200 per run to avoid long runs)
    const { data: reminders, error: remError } = await supabaseService
      .from('session_reminders')
      .select('id, session_id, recipient_id, scheduled_at')
      .lte('scheduled_at', new Date().toISOString())
      .eq('sent', false)
      .order('scheduled_at', { ascending: true })
      .limit(200);

    if (remError) {
      console.error('Error fetching due reminders:', remError);
      return new Response(JSON.stringify({ error: 'Failed to query reminders' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No due reminders' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Gather session ids and recipient ids
    const sessionIds = Array.from(new Set(reminders.map((r: any) => r.session_id)));
    const recipientIds = Array.from(new Set(reminders.map((r: any) => r.recipient_id)));

    // Fetch session info
    const { data: sessions } = await supabaseService
      .from('study_sessions')
      .select('id, title, scheduled_start')
      .in('id', sessionIds as string[]);

    const sessionMap = new Map((sessions || []).map((s: any) => [s.id, s]));

    // Fetch push tokens for recipients
    const { data: tokens } = await supabaseService
      .from('push_tokens')
      .select('token, user_id, platform')
      .in('user_id', recipientIds as string[]);

    const tokensByUser = new Map<string, any[]>();
    (tokens || []).forEach((t: any) => {
      const arr = tokensByUser.get(t.user_id) || [];
      arr.push(t);
      tokensByUser.set(t.user_id, arr);
    });

    // Fetch notification preferences
    const { data: preferences } = await supabaseService
      .from('notification_preferences')
      .select('user_id, session_enabled, sound_enabled')
      .in('user_id', recipientIds as string[]);

    const prefMap = new Map((preferences || []).map((p: any) => [p.user_id, p]));

    // Prepare per-reminder structures
    const notificationsRows: any[] = [];
    const logsToInsert: any[] = [];
    const messagesToSend: Array<{
      reminder_id: string;
      recipient_id: string;
      token: string;
      message: any;
    }> = [];
    const reminderIdsToMark: string[] = [];

    for (const r of reminders as any[]) {
      const session = sessionMap.get(r.session_id) || { title: 'Upcoming session' };
      const userTokens = tokensByUser.get(r.recipient_id) || [];
      const pref = prefMap.get(r.recipient_id) || { session_enabled: true, sound_enabled: true };

      const title = `Upcoming session: ${session.title}`;
      const body = `Your session starts in 10 minutes.`;
      const data = { type: 'session_reminder', sessionId: r.session_id };

      // If user disabled session notifications, insert a 'skipped' log and mark reminder sent
      if (!pref.session_enabled) {
        console.warn('Session notifications disabled for user', r.recipient_id);
        // Insert an in-app notification so user still sees it in Bell
        notificationsRows.push({
          user_id: r.recipient_id,
          type: 'session_reminder',
          title,
          body,
          data: JSON.stringify(data),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Insert log with status 'skipped'
        logsToInsert.push({
          reminder_id: r.id,
          session_id: r.session_id,
          recipient_id: r.recipient_id,
          status: 'skipped',
          payload: JSON.stringify({ title, body, data }),
          created_at: new Date().toISOString(),
        });

        // mark reminder to be set as sent (skipped)
        reminderIdsToMark.push(r.id);
        continue;
      }

      // Always insert in-app notification row (so Bell shows it)
      notificationsRows.push({
        user_id: r.recipient_id,
        type: 'session_reminder',
        title,
        body,
        data: JSON.stringify(data),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Prepare a pending log per reminder (one log row per reminder run)
      logsToInsert.push({
        reminder_id: r.id,
        session_id: r.session_id,
        recipient_id: r.recipient_id,
        status: 'pending',
        payload: JSON.stringify({ title, body, data }),
        created_at: new Date().toISOString(),
      });

      // Prepare messages for each token (token-level), mapping back to reminder
      if (!userTokens || userTokens.length === 0) {
        console.warn('No push tokens for user', r.recipient_id);
      }
      for (const tk of userTokens) {
        messagesToSend.push({
          reminder_id: r.id,
          recipient_id: r.recipient_id,
          token: tk.token,
          message: {
            to: tk.token,
            sound: pref.sound_enabled !== false ? 'default' : undefined,
            title,
            body,
            data,
            priority: 'high',
          },
        });
      }

      // We'll mark reminder sent after processing (either via tokens or no tokens)
      reminderIdsToMark.push(r.id);
    }

    // Bulk insert in-app notifications
    if (notificationsRows.length > 0) {
      await supabaseService.from('notifications').insert(notificationsRows);
    }

    // Insert logs and capture inserted rows (so we can update later)
    let insertedLogsMap = new Map<string, any>(); // reminder_id -> inserted log row
    if (logsToInsert.length > 0) {
      const { data: insertedLogs, error: insertLogsErr } = await supabaseService
        .from('session_reminder_logs')
        .insert(logsToInsert)
        .select('id, reminder_id');
      if (insertLogsErr) {
        console.error('Failed to insert session_reminder_logs', insertLogsErr);
      } else {
        (insertedLogs || []).forEach((row: any) => insertedLogsMap.set(row.reminder_id, row));
      }
    }

    // Send push messages in batch (if any)
    let sentCount = 0;
    const perReminderResults: Record<
      string,
      { success: number; failure: number; receipts: any[] }
    > = {};
    if (messagesToSend.length > 0) {
      const payload = messagesToSend.map((m) => m.message);
      const resp = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(payload),
      });
      const result = await resp.json().catch(() => null);
      if (result && Array.isArray(result.data)) {
        // Initialize perReminderResults
        for (const m of messagesToSend) {
          perReminderResults[m.reminder_id] = { success: 0, failure: 0, receipts: [] };
        }

        sentCount = 0;
        for (let i = 0; i < result.data.length; i++) {
          const receipt = result.data[i];
          const msg = messagesToSend[i];
          if (!msg) continue;
          const remId = msg.reminder_id;
          perReminderResults[remId].receipts.push(receipt);
          if (receipt.status === 'ok') {
            perReminderResults[remId].success += 1;
            sentCount += 1;
          } else {
            perReminderResults[remId].failure += 1;
            const errorCode = receipt.details?.error || receipt.message;
            if (errorCode === 'DeviceNotRegistered') {
              try {
                await supabaseService.from('push_tokens').delete().eq('token', msg.token);
              } catch (e) {
                console.warn('Failed to delete invalid token', msg.token, e);
              }
            }
          }
        }
      }
    }

    // Update logs per reminder based on results
    const logsToUpdate: any[] = [];
    for (const remId of reminderIdsToMark) {
      const result = perReminderResults[remId];
      const insertedLog = insertedLogsMap.get(remId);
      if (!insertedLog) {
        // Could be a skipped log or insertion failure earlier; if skipped, it was inserted with status 'skipped'
        continue;
      }
      const logId = insertedLog.id;
      if (!result) {
        // No messages were sent (no tokens) -> mark as 'no_tokens'
        logsToUpdate.push({ id: logId, status: 'no_tokens', updated_at: new Date().toISOString() });
        continue;
      }

      const status = result.success > 0 ? 'sent' : 'failed';
      const payload = JSON.stringify({ receipts: result.receipts });
      logsToUpdate.push({ id: logId, status, payload, updated_at: new Date().toISOString() });
    }

    // Apply log updates
    for (const u of logsToUpdate) {
      try {
        await supabaseService
          .from('session_reminder_logs')
          .update({ status: u.status, payload: u.payload, updated_at: u.updated_at })
          .eq('id', u.id);
      } catch (e) {
        console.warn('Failed to update log', u.id, e);
      }
    }

    // Mark reminders as sent (only those we prepared)
    if (reminderIdsToMark.length > 0) {
      await supabaseService
        .from('session_reminders')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .in('id', reminderIdsToMark as string[]);
    }

    return new Response(
      JSON.stringify({
        message: 'Reminders processed',
        processed: reminders.length,
        sent: sentCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Error in send-session-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});
