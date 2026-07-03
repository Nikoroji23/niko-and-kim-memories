-- Supabase schema for the shared Niko & Kim app.
-- Run this in Supabase SQL Editor, then redeploy Netlify.

create extension if not exists pgcrypto;

-- One shared chat thread for Niko and Kim.
create table if not exists public.shared_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'niko-kim',
  sender_key text not null check (sender_key in ('niko', 'kim')),
  sender_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Shared future plans. Checklist is JSON so both users can edit/tick items.
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

-- Shared memory folders.
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

-- Multiple photos/videos per memory.
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

-- Enable realtime updates. Duplicate-table errors are ignored if you rerun this file.
do $$
begin
  alter publication supabase_realtime add table public.shared_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.shared_plans;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.shared_memories;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.shared_memory_media;
exception when duplicate_object then null;
end $$;

-- Storage bucket for uploaded photos/videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Simple public policies for a private-by-obscurity couple app using the publishable anon key.
-- If you later add Supabase Auth, replace these with authenticated-user policies.
alter table public.shared_messages enable row level security;
alter table public.shared_plans enable row level security;
alter table public.shared_memories enable row level security;
alter table public.shared_memory_media enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_messages' and policyname = 'shared messages public read') then
    create policy "shared messages public read" on public.shared_messages for select using (couple_id = 'niko-kim');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_messages' and policyname = 'shared messages public insert') then
    create policy "shared messages public insert" on public.shared_messages for insert with check (couple_id = 'niko-kim');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_plans' and policyname = 'shared plans public read') then
    create policy "shared plans public read" on public.shared_plans for select using (couple_id = 'niko-kim');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_plans' and policyname = 'shared plans public insert') then
    create policy "shared plans public insert" on public.shared_plans for insert with check (couple_id = 'niko-kim');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_plans' and policyname = 'shared plans public update') then
    create policy "shared plans public update" on public.shared_plans for update using (couple_id = 'niko-kim') with check (couple_id = 'niko-kim');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_plans' and policyname = 'shared plans public delete') then
    create policy "shared plans public delete" on public.shared_plans for delete using (couple_id = 'niko-kim');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_memories' and policyname = 'shared memories public read') then
    create policy "shared memories public read" on public.shared_memories for select using (couple_id = 'niko-kim');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_memories' and policyname = 'shared memories public insert') then
    create policy "shared memories public insert" on public.shared_memories for insert with check (couple_id = 'niko-kim');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_memory_media' and policyname = 'shared media public read') then
    create policy "shared media public read" on public.shared_memory_media for select using (couple_id = 'niko-kim');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_memory_media' and policyname = 'shared media public insert') then
    create policy "shared media public insert" on public.shared_memory_media for insert with check (couple_id = 'niko-kim');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'media bucket public read') then
    create policy "media bucket public read" on storage.objects for select using (bucket_id = 'media');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'media bucket public insert') then
    create policy "media bucket public insert" on storage.objects for insert with check (bucket_id = 'media');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'media bucket public update') then
    create policy "media bucket public update" on storage.objects for update using (bucket_id = 'media') with check (bucket_id = 'media');
  end if;
end $$;
