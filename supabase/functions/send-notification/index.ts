/**
 * Send Notification Edge Function
 * Sends push notifications via Expo Push Notification Service
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface NotificationRequest {
  type: string;
  userIds: string[];
  title: string;
  body: string;
  data: Record<string, any>;
  sound?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get Supabase URL and keys from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create Supabase client (anon, for auth validation) and service client (bypass RLS to read tokens)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseService = supabaseServiceRoleKey
      ? createClient(supabaseUrl, supabaseServiceRoleKey)
      : null;

    // Parse request body
    const request: NotificationRequest = await req.json();
    const { userIds, title, body, data, sound = 'default' } = request;

    if (!userIds || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'userIds is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get push tokens for all users (use service role to bypass RLS)
    const { data: tokens, error: tokensError } = await (supabaseService ?? supabase)
      .from('push_tokens')
      .select('token, user_id, platform')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(JSON.stringify({ error: 'Failed to fetch push tokens' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Even if no push tokens, we should still save in-app notifications
    // So we continue processing instead of returning early

    // Check notification preferences (service role)
    const { data: preferences } = await (supabaseService ?? supabase)
      .from('notification_preferences')
      .select('user_id, chat_enabled, buddy_enabled, session_enabled, sound_enabled')
      .in('user_id', userIds);

    const preferencesMap = new Map(preferences?.map((p) => [p.user_id, p]) || []);

    // Filter tokens based on preferences
    const notificationType = data.type;
    const enabledTokens = tokens.filter((token) => {
      const pref = preferencesMap.get(token.user_id);
      if (!pref) return true; // Default to enabled if no preferences

      switch (notificationType) {
        case 'chat_message':
          return pref.chat_enabled;
        case 'buddy_request':
        case 'buddy_accepted':
        case 'buddy_rejected':
          return pref.buddy_enabled;
        case 'session_reminder':
        case 'session_invitation':
        case 'session_cancelled':
          return pref.session_enabled;
        default:
          return true;
      }
    });

    // Prepare push notifications (even if empty, we'll still save in-app notifications)
    let result: any = { data: [] };

    if (enabledTokens.length > 0) {
      // Prepare notifications
      const notifications = enabledTokens.map((token) => {
        const pref = preferencesMap.get(token.user_id);
        return {
          to: token.token,
          sound: pref?.sound_enabled !== false ? sound : undefined,
          title,
          body,
          data,
          priority: 'high' as const,
          channelId: notificationType === 'chat_message' ? 'chat' : 'default',
        };
      });

      // Send to Expo Push Notification Service
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(notifications),
      });

      result = await response.json();
    }

    // Cleanup invalid tokens if any
    if (Array.isArray(result?.data) && supabaseService) {
      for (let i = 0; i < result.data.length; i++) {
        const receipt = result.data[i];
        const tokenEntry = enabledTokens[i];
        if (!receipt || !tokenEntry) continue;

        if (receipt.status === 'error') {
          const errorCode = receipt.details?.error || receipt.message;
          if (errorCode === 'DeviceNotRegistered') {
            await supabaseService.from('push_tokens').delete().eq('token', tokenEntry.token);
          }
        }
      }
    }

    // Save in-app notifications to database for all users (not just those with push tokens)
    // This ensures users can see notifications in-app even if they don't have push tokens
    if (supabaseService) {
      try {
        const notificationRecords = userIds.map((userId: string) => ({
          user_id: userId,
          type: notificationType,
          title,
          body,
          data: data,
          read: false,
        }));

        const { error: insertError } = await supabaseService
          .from('notifications')
          .insert(notificationRecords);

        if (insertError) {
          console.error('Failed to save in-app notifications:', insertError);
        } else {
          console.log(`Saved ${notificationRecords.length} in-app notifications to database`);
        }
      } catch (dbError) {
        console.error('Error saving in-app notifications:', dbError);
        // Don't fail the request if saving to DB fails
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        sent: Array.isArray(result.data) ? result.data.length : 0,
        receipts: result.data,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});
