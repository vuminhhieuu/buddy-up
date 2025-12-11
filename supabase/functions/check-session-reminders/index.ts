/**
 * Check Session Reminders Edge Function
 *
 * Purpose:
 *   - Checks for pending session reminders (sent = false AND scheduled_at <= now)
 *   - Groups reminders by session_id
 *   - Sends push notifications via send-notification Edge Function
 *   - Marks reminders as sent and logs results
 *
 * Triggered by:
 *   - External cron job (cron-job.org) every 1 minute
 *
 * Flow:
 *   1. Query pending reminders from session_reminders table
 *   2. Group by session_id
 *   3. For each session:
 *      - Get session details (title, scheduled_start)
 *      - Create notification content
 *      - Call send-notification Edge Function
 *      - Mark reminders as sent
 *      - Log results to session_reminder_logs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRecord {
  id: string;
  session_id: string;
  recipient_id: string;
  scheduled_at: string;
  study_sessions: {
    id: string;
    title: string;
    scheduled_start: string;
  } | null;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting check-session-reminders ===');
    console.log('Timestamp:', new Date().toISOString());

    // Get Supabase service role client (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ========================================================================
    // Step 1: Get pending reminders (sent = false AND scheduled_at <= now)
    // ========================================================================
    console.log('Step 1: Querying pending reminders...');

    const { data: pendingReminders, error: queryError } = await supabase
      .from('session_reminders')
      .select(
        `
        id,
        session_id,
        recipient_id,
        scheduled_at,
        study_sessions (
          id,
          title,
          scheduled_start
        )
      `,
      )
      .eq('sent', false)
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(100); // Process max 100 reminders per run to avoid timeout

    if (queryError) {
      console.error('Error querying reminders:', queryError);
      throw queryError;
    }

    console.log(`Found ${pendingReminders?.length || 0} pending reminders`);

    if (!pendingReminders || pendingReminders.length === 0) {
      console.log('No pending reminders to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending reminders',
          processed: 0,
          sent: 0,
          failed: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      );
    }

    // ========================================================================
    // Step 2: Group reminders by session_id
    // ========================================================================
    console.log('Step 2: Grouping reminders by session...');

    const remindersBySession = new Map<string, ReminderRecord[]>();
    for (const reminder of pendingReminders as ReminderRecord[]) {
      const sessionId = reminder.session_id;
      if (!remindersBySession.has(sessionId)) {
        remindersBySession.set(sessionId, []);
      }
      remindersBySession.get(sessionId)!.push(reminder);
    }

    console.log(`Grouped into ${remindersBySession.size} sessions`);

    let totalSent = 0;
    let totalFailed = 0;

    // ========================================================================
    // Step 3: Process each session
    // ========================================================================
    console.log('Step 3: Processing each session...');

    for (const [sessionId, reminders] of remindersBySession.entries()) {
      try {
        console.log(`\n--- Processing session ${sessionId} (${reminders.length} recipients) ---`);

        const session = reminders[0].study_sessions;

        // Handle case where session was deleted
        if (!session) {
          console.warn(`Session ${sessionId} not found (deleted?), marking reminders as sent`);

          // Mark as sent (cancelled)
          await supabase
            .from('session_reminders')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .in(
              'id',
              reminders.map((r) => r.id),
            );

          // Log as failed
          await supabase.from('session_reminder_logs').insert(
            reminders.map((r) => ({
              reminder_id: r.id,
              session_id: sessionId,
              recipient_id: r.recipient_id,
              status: 'failed',
              error_text: 'Session not found',
            })),
          );

          totalFailed += reminders.length;
          continue;
        }

        // ====================================================================
        // Step 4: Create notification content
        // ====================================================================
        const notificationData = {
          type: 'session_reminder',
          sessionId: sessionId, // Use camelCase for consistency with app
          sessionTitle: session.title,
          scheduledStart: session.scheduled_start,
        };

        const notification = {
          title: 'CÒN 10 PHÚT NỮA',
          body: `Buổi học ${session.title} sẽ bắt đầu\nChuẩn bị vào học thôi nào!`,
          data: notificationData,
        };

        console.log('Notification content:', {
          title: notification.title,
          body: notification.body.substring(0, 50) + '...',
          data: notificationData,
        });

        // ====================================================================
        // Step 5: Get recipient IDs
        // ====================================================================
        const recipientIds = reminders.map((r) => r.recipient_id);
        console.log(`Recipients: ${recipientIds.length} users`);

        // ====================================================================
        // Step 6: Call send-notification Edge Function
        // ====================================================================
        console.log('Calling send-notification Edge Function...');

        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: recipientIds,
            title: notification.title,
            body: notification.body,
            data: notificationData,
          }),
        });

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          throw new Error(`Send notification failed (${sendResponse.status}): ${errorText}`);
        }

        const sendResult = await sendResponse.json();
        console.log('Send notification result:', {
          sent: sendResult.sent,
          receipts: sendResult.receipts?.length || 0,
        });

        // ====================================================================
        // Step 7: Mark reminders as sent
        // ====================================================================
        console.log('Marking reminders as sent...');

        const { error: updateError } = await supabase
          .from('session_reminders')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .in(
            'id',
            reminders.map((r) => r.id),
          );

        if (updateError) {
          console.error('Error updating reminders:', updateError);
          throw updateError;
        }

        // ====================================================================
        // Step 8: Log success
        // ====================================================================
        console.log('Logging success to session_reminder_logs...');

        const { error: logError } = await supabase.from('session_reminder_logs').insert(
          reminders.map((r) => ({
            reminder_id: r.id,
            session_id: sessionId,
            recipient_id: r.recipient_id,
            status: 'sent',
            payload: notificationData,
          })),
        );

        if (logError) {
          console.error('Error logging success:', logError);
          // Don't throw - reminders are already marked as sent
        }

        totalSent += reminders.length;
        console.log(`✓ Successfully processed session ${sessionId}`);
      } catch (error) {
        console.error(`✗ Error processing session ${sessionId}:`, error);

        // Log failure
        try {
          await supabase.from('session_reminder_logs').insert(
            reminders.map((r) => ({
              reminder_id: r.id,
              session_id: sessionId,
              recipient_id: r.recipient_id,
              status: 'failed',
              error_text: error instanceof Error ? error.message : 'Unknown error',
            })),
          );
        } catch (logError) {
          console.error('Error logging failure:', logError);
        }

        totalFailed += reminders.length;
      }
    }

    // ========================================================================
    // Final summary
    // ========================================================================
    console.log('\n=== Summary ===');
    console.log(`Total processed: ${pendingReminders.length}`);
    console.log(`Successfully sent: ${totalSent}`);
    console.log(`Failed: ${totalFailed}`);
    console.log('=== Finished ===\n');

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingReminders.length,
        sent: totalSent,
        failed: totalFailed,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (error) {
    console.error('=== Error in check-session-reminders ===');
    console.error(error);
    console.error('=== End Error ===\n');

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
