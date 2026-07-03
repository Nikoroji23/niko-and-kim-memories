import { supabase, uploadToBucket } from './supabaseClient';

export const COUPLE_ID = 'niko-kim';
export const MEDIA_BUCKET = 'media';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

export function getUserKey(user) {
  return user?.name?.toLowerCase().includes('kim') ? 'kim' : 'niko';
}

export function getPartnerKey(user) {
  return getUserKey(user) === 'kim' ? 'niko' : 'kim';
}

export function getPartnerName(user) {
  return getUserKey(user) === 'kim' ? 'Niko' : 'Kim';
}

export function normalizeChecklist(checklist) {
  if (!Array.isArray(checklist)) return [];
  return checklist.map((item) => {
    if (typeof item === 'string') return { text: item, completed: false };
    return { text: item.text || item.label || '', completed: Boolean(item.completed) };
  }).filter((item) => item.text.trim());
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isUnlocked(row) {
  if (!row?.unlock_date) return true;
  return row.unlock_date <= todayKey();
}

export async function listMessages() {
  requireSupabase();
  const { data, error } = await supabase.from('shared_messages').select('*').eq('couple_id', COUPLE_ID).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(user, message) {
  requireSupabase();
  const { data, error } = await supabase.from('shared_messages').insert({ couple_id: COUPLE_ID, sender_key: getUserKey(user), sender_name: user?.name || 'Niko', message }).select().single();
  if (error) throw error;
  return data;
}

export async function listPlans() {
  requireSupabase();
  const { data, error } = await supabase.from('shared_plans').select('*').eq('couple_id', COUPLE_ID).order('start_date', { ascending: true }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPlan(user, plan) {
  requireSupabase();
  const { data, error } = await supabase.from('shared_plans').insert({ couple_id: COUPLE_ID, title: plan.title, start_date: plan.start_date, end_date: plan.end_date, memo: plan.memo || '', checklist: normalizeChecklist(plan.checklist), created_by_key: getUserKey(user), created_by_name: user?.name || 'Niko', updated_by_key: getUserKey(user), updated_by_name: user?.name || 'Niko' }).select().single();
  if (error) throw error;
  return data;
}

export async function updatePlan(user, id, changes) {
  requireSupabase();
  const { data, error } = await supabase.from('shared_plans').update({ ...changes, checklist: changes.checklist ? normalizeChecklist(changes.checklist) : changes.checklist, updated_by_key: getUserKey(user), updated_by_name: user?.name || 'Niko', updated_at: new Date().toISOString() }).eq('id', id).eq('couple_id', COUPLE_ID).select().single();
  if (error) throw error;
  return data;
}

export async function deletePlan(id) {
  requireSupabase();
  const { error } = await supabase.from('shared_plans').delete().eq('id', id).eq('couple_id', COUPLE_ID);
  if (error) throw error;
}

export async function listMemories() {
  requireSupabase();
  const { data, error } = await supabase.from('shared_memories').select('*, shared_memory_media(*)').eq('couple_id', COUPLE_ID).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function mediaKind(file) {
  return file.type.startsWith('video/') ? 'video' : 'image';
}

function cleanFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function createMemory(user, memory, files) {
  requireSupabase();
  const { data: savedMemory, error: memoryError } = await supabase.from('shared_memories').insert({ couple_id: COUPLE_ID, title: memory.title, category: memory.category, emoji: memory.emoji, created_by_key: getUserKey(user), created_by_name: user?.name || 'Niko' }).select().single();
  if (memoryError) throw memoryError;

  const uploaded = [];
  for (const file of files || []) {
    const filePath = `${COUPLE_ID}/${savedMemory.id}/${Date.now()}-${cleanFileName(file.name)}`;
    const publicUrl = await uploadToBucket(MEDIA_BUCKET, file, filePath);
    uploaded.push({ memory_id: savedMemory.id, couple_id: COUPLE_ID, url: publicUrl, storage_path: filePath, media_type: mediaKind(file), file_name: file.name });
  }

  if (uploaded.length) {
    const { data: mediaRows, error: mediaError } = await supabase.from('shared_memory_media').insert(uploaded).select();
    if (mediaError) throw mediaError;
    return { ...savedMemory, shared_memory_media: mediaRows || [] };
  }

  return { ...savedMemory, shared_memory_media: [] };
}

export async function listLetters() {
  requireSupabase();
  const { data, error } = await supabase.from('shared_letters').select('*').eq('couple_id', COUPLE_ID).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createLetter(user, letter) {
  requireSupabase();
  const { data, error } = await supabase.from('shared_letters').insert({ couple_id: COUPLE_ID, sender_key: getUserKey(user), sender_name: user?.name || 'Niko', recipient_key: getPartnerKey(user), recipient_name: getPartnerName(user), theme: letter.theme, type: letter.type, subject: letter.subject, body: letter.body, unlock_date: letter.unlock_date || null }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLetter(id) {
  requireSupabase();
  const { error } = await supabase.from('shared_letters').delete().eq('id', id).eq('couple_id', COUPLE_ID);
  if (error) throw error;
}

export async function listDailyAnswers() {
  requireSupabase();
  const { data, error } = await supabase.from('shared_daily_answers').select('*').eq('couple_id', COUPLE_ID).order('answer_date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveDailyAnswer(user, answer, questionText) {
  requireSupabase();
  const { data, error } = await supabase.from('shared_daily_answers').upsert({ couple_id: COUPLE_ID, user_key: getUserKey(user), user_name: user?.name || 'Niko', question_text: questionText, answer, answer_date: todayKey(), updated_at: new Date().toISOString() }, { onConflict: 'couple_id,user_key,answer_date' }).select().single();
  if (error) throw error;
  return data;
}

export async function listFeelings() {
  requireSupabase();
  const { data, error } = await supabase.from('shared_feelings').select('*').eq('couple_id', COUPLE_ID).order('feeling_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveFeeling(user, feeling) {
  requireSupabase();
  const { data, error } = await supabase.from('shared_feelings').upsert({ couple_id: COUPLE_ID, user_key: getUserKey(user), user_name: user?.name || 'Niko', feeling, feeling_date: todayKey(), updated_at: new Date().toISOString() }, { onConflict: 'couple_id,user_key,feeling_date' }).select().single();
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  requireSupabase();
  const [messages, memories, letters, plans, answers, feelings] = await Promise.all([
    listMessages(),
    listMemories(),
    listLetters(),
    listPlans(),
    listDailyAnswers(),
    listFeelings(),
  ]);

  const activeDates = new Set([
    ...messages.map((item) => item.created_at?.slice(0, 10)),
    ...memories.map((item) => item.created_at?.slice(0, 10)),
    ...letters.map((item) => item.created_at?.slice(0, 10)),
    ...answers.map((item) => item.answer_date),
    ...plans.map((item) => item.created_at?.slice(0, 10)),
    ...feelings.map((item) => item.feeling_date),
  ].filter(Boolean));

  let streak = 0;
  const cursor = new Date();
  while (activeDates.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const unlockedLetters = letters.filter(isUnlocked);
  return {
    messages,
    memories,
    letters,
    unlockedLetters,
    plans,
    answers,
    feelings,
    streak,
    recentMemory: memories[0] || null,
  };
}

export function subscribeToSharedTable(table, onChange) {
  if (!supabase) return () => {};
  const channel = supabase.channel(`${table}_${COUPLE_ID}`).on('postgres_changes', { event: '*', schema: 'public', table, filter: `couple_id=eq.${COUPLE_ID}` }, onChange).subscribe();
  return () => { supabase.removeChannel(channel); };
}
