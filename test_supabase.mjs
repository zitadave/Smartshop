const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NzM1MTEsImV4cCI6MjA0NTI0OTUxMX0.Tp2mFEzBmzr6zBYZgg0f9AQ8pjsAGv0Z09s4JtqdpN4';

async function run() {
  const payload = {
    bank_name: 'Test Bank',
    account_number: '123456789'
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/bank_accounts`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  console.log('STATUS:', res.status);
  const data = await res.json();
  console.log('DATA:', data);
}

run();
