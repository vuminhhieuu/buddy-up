/**
 * Local helper to call the send-session-reminders function endpoint.
 *
 * Usage:
 *   node scripts/run_send_reminders_test.js https://<project>.functions.supabase.co/send-session-reminders <SERVICE_ROLE_KEY>
 */
const fetch = require('node-fetch');

async function main() {
  const [,, url, serviceKey] = process.argv;
  if (!url || !serviceKey) {
    console.error('Usage: node scripts/run_send_reminders_test.js <FUNCTION_URL> <SERVICE_ROLE_KEY>');
    process.exit(1);
  }

  console.log('Calling function', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', body);
}

main().catch((err) => { console.error(err); process.exit(1); });
