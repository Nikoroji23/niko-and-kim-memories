-- Supabase schema for the shared Niko & Kim app.
-- Run this whole file in Supabase SQL Editor, then redeploy Netlify.

create extension if not exists pgcrypto;

create table if not exists public.shared_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'niko-kim',
  sender_key text not null check (sender_key in ('niko', 'kim')),
  sender_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'niko-kim',
  title text not null,
  start_date date not null,
  end_date date not null,
  memo text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  created_by_key text not null check (created_by_key in ('niko', 'kim')),
  created_by_name text not null,
  updated_by_key text,
  updated_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_memories (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'niko-kim',
  title text not null,
  category text not null,
  emoji text not null default 'Photo',
  created_by_key text not null check (created_by_key in ('niko', 'kim')),
  created_by_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.shared_memories(id) on delete cascade,
  couple_id text not null default 'niko-kim',
  url text not null,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  file_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_shared_messages_couple_created on public.shared_messages(couple_id, created_at);
create index if not exists idx_shared_plans_couple_dates on public.shared_plans(couple_id, start_date, end_date);
create index if not exists idx_shared_memories_couple_created on public.shared_memories(couple_id, created_at desc);
create index if not exists idx_shared_memory_media_memory on public.shared_memory_media(memory_id);
create index if not exists idx_shared_memory_media_couple_created on public.shared_memory_media(couple_id, created_at desc);

-- Storage bucket for uploaded photos/videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/mov'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.shared_messages enable row level security;
alter table public.shared_plans enable row level security;
alter table public.shared_memories enable row level security;
alter table public.shared_memory_media enable row level security;

-- Recreate policies so rerunning this file is safe.
drop policy if exists "shared messages public read" on public.shared_messages;
drop policy if exists "shared messages public insert" on public.shared_messages;
create policy "shared messages public read" on public.shared_messages for select using (couple_id = 'niko-kim');
create policy "shared messages public insert" on public.shared_messages for insert with check (couple_id = 'niko-kim');

drop policy if exists "shared plans public read" on public.shared_plans;
drop policy if exists "shared plans public insert" on public.shared_plans;
drop policy if exists "shared plans public update" on public.shared_plans;
drop policy if exists "shared plans public delete" on public.shared_plans;
create policy "shared plans public read" on public.shared_plans for select using (couple_id = 'niko-kim');
create policy "shared plans public insert" on public.shared_plans for insert with check (couple_id = 'niko-kim');
create policy "shared plans public update" on public.shared_plans for update using (couple_id = 'niko-kim') with check (couple_id = 'niko-kim');
create policy "shared plans public delete" on public.shared_plans for delete using (couple_id = 'niko-kim');

drop policy if exists "shared memories public read" on public.shared_memories;
drop policy if exists "shared memories public insert" on public.shared_memories;
create policy "shared memories public read" on public.shared_memories for select using (couple_id = 'niko-kim');
create policy "shared memories public insert" on public.shared_memories for insert with check (couple_id = 'niko-kim');

drop policy if exists "shared media public read" on public.shared_memory_media;
drop policy if exists "shared media public insert" on public.shared_memory_media;
create policy "shared media public read" on public.shared_memory_media for select using (couple_id = 'niko-kim');
create policy "shared media public insert" on public.shared_memory_media for insert with check (couple_id = 'niko-kim');

-- Storage policies for the public media bucket.
drop policy if exists "media bucket public read" on storage.objects;
drop policy if exists "media bucket public insert" on storage.objects;
drop policy if exists "media bucket public update" on storage.objects;
create policy "media bucket public read" on storage.objects for select using (bucket_id = 'media');
create policy "media bucket public insert" on storage.objects for insert with check (bucket_id = 'media');
create policy "media bucket public update" on storage.objects for update using (bucket_id = 'media') with check (bucket_id = 'media');

-- Optional realtime setup:
-- In Supabase Dashboard, go to Database > Replication and enable realtime for:
-- shared_messages, shared_plans, shared_memories, shared_memory_media.
-- The app also polls, so it works even before realtime is enabled.
