import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase keys are not set. Real-time sync and storage will be disabled.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export async function uploadToBucket(bucket, file, path) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
  const filePath = path || `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { publicURL, error: urlError } = await supabase.storage.from(bucket).getPublicUrl(data.path);
  if (urlError) throw urlError;
  return publicURL;
}

export async function insertRow(table, row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from(table).insert([row]).select();
  if (error) throw error;
  return data?.[0];
}

export function subscribeToTable(table, callback) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return () => {};
  const channel = supabase.channel(`table_changes_${table}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
    callback(payload);
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
}
