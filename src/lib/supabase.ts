import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NzM1MTEsImV4cCI6MjA0NTI0OTUxMX0.Tp2mFEzBmzr6zBYZgg0f9AQ8pjsAGv0Z09s4JtqdpN4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

export async function fetchProducts(): Promise<any[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    // Fallback to REST API
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      headers: { apikey: SUPABASE_ANON_KEY }
    });
    return res.ok ? res.json() : [];
  }
  return data || [];
}

export async function fetchSettings(): Promise<any> {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error || !data) return {};
  return data;
}

export async function saveSettings(settings: any): Promise<boolean> {
  const { error } = await supabase.from('settings').upsert({ id: 1, ...settings });
  return !error;
}
