-- Supabase schema for Niko & Kim Memories
-- Run this in your Supabase SQL editor to create the website database.

-- Users and auth
create table if not exists users (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  password text not null,
  token text not null,
  created_at timestamptz not null default now()
);

-- Dashboard state for each user
create table if not exists dashboards (
  user_id bigint not null references users(id) on delete cascade,
  years int not null default 0,
  months int not null default 0,
  remaining_days int not null default 0,
  streak_current int not null default 0,
  streak_longest int not null default 0,
  unread_messages int not null default 0,
  daily_question_text text not null default 'What made you smile today? 😊',
  user_answer text,
  recent_memory_title text not null default 'No memories yet',
  recent_memory_description text not null default 'Start recording your first moment together.',
  recent_memory_date date not null default current_date,
  recent_memory_location text not null default '',
  primary key (user_id)
);

-- Saved letters
create table if not exists letters (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  theme text not null,
  type text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Saved memories
create table if not exists memories (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  title text not null,
  category text not null,
  emoji text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

-- Planner trips
create table if not exists planner_plans (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  emoji text not null default '📅',
  title text not null,
  start_date date not null,
  end_date date not null,
  memo text,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Planner tasks
create table if not exists planner_tasks (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  owner text not null,
  label text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Chat messages
create table if not exists chat_messages (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  sender text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_letters_user_id on letters(user_id);
create index if not exists idx_memories_user_id on memories(user_id);
create index if not exists idx_planner_plans_user_id on planner_plans(user_id);
create index if not exists idx_planner_tasks_user_id on planner_tasks(user_id);
create index if not exists idx_chat_messages_user_id on chat_messages(user_id);
