// Supabase Edge Function: delete-user
// Deletes the authenticated user (by user ID) using service role.
// Protect with JWT and only allow the current user to delete themselves.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing environment config" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify JWT from request
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    // Get user from JWT
    const { data: userData, error: getUserError } = await supabase.auth.getUser(jwt);
    if (getUserError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    const userId = userData.user.id;

    // Delete auth user
    const { error: adminError } = await supabase.auth.admin.deleteUser(userId);
    if (adminError) {
      return new Response(JSON.stringify({ error: adminError.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    console.error('Error in delete-user function:', err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
