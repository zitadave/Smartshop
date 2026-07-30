const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NzM1MTEsImV4cCI6MjA0NTI0OTUxMX0.Tp2mFEzBmzr6zBYZgg0f9AQ8pjsAGv0Z09s4JtqdpN4';

async function run() {
  const payload = {
    driver_id: 3,
    is_online: true
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/delivery_personnel?id=eq.3`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ is_online: true, last_active_at: new Date().toISOString() })
  });
  console.log('STATUS:', res.status);
  const data = await res.json();
  console.log('RESPONSE:', data);
}

run();
