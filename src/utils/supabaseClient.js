import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase keys are not set. Real-time sync and storage will be disabled.');
}

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

function assertSupabaseConfigured() {
  if (!supabase) throw new Error('Supabase not configured');
}

export async function uploadToBucket(bucket, file, path) {
  assertSupabaseConfigured();
  const filePath = path || `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

export async function insertRow(table, row) {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from(table).insert([row]).select();
  if (error) throw error;
  return data?.[0];
}

export function subscribeToTable(table, callback) {
  if (!supabase) return () => {};
  const channel = supabase.channel(`table_changes_${table}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
    callback(payload);
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
}
