# send-session-reminders

Supabase Edge Function to process due session reminders and send push notifications.

What it does

- Queries `session_reminders` where `scheduled_at <= now()` and `sent = false`.
- For each reminder, sends push via Expo Push Service using tokens from `push_tokens`.
- Inserts an in-app `notifications` row and a `session_reminder_logs` row.
- Marks `session_reminders.sent = true` and sets `sent_at`.

Environment variables (required)

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (required to bypass RLS and update DB)

Deploy

1. Build & deploy via Supabase CLI (in repo root):

```powershell
supabase functions deploy send-session-reminders --project-ref <project-ref>
```

2. Create a scheduled job in Supabase dashboard or use `supabase` CLI to schedule a cron (recommended: every minute):

Schedule example (cron every minute):

```text
* * * * *  -> /functions/v1/send-session-reminders
```

Notes

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in function secrets so the function can read `push_tokens` and update `session_reminders`.
- The function batches up to 200 reminders per run to avoid long executions. Increase limit carefully.
