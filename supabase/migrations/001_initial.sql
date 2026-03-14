-- supabase/migrations/001_initial.sql

-- habits table
create table habits (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  name        text        not null,
  created_at  timestamptz default now()
);

-- habit_logs table (existence = completed; no boolean field)
create table habit_logs (
  id          uuid  primary key default gen_random_uuid(),
  habit_id    uuid  not null references habits(id) on delete cascade,
  date        date  not null,
  unique(habit_id, date)
);

-- Enable RLS
alter table habits enable row level security;
alter table habit_logs enable row level security;

-- RLS: habits — users manage only their own
create policy "Users can manage own habits"
  on habits for all
  using (user_id = auth.uid());

-- RLS: habit_logs — ownership via join to habits
create policy "Users can manage own habit logs"
  on habit_logs for all
  using (
    habit_id in (
      select id from habits where user_id = auth.uid()
    )
  )
  with check (
    habit_id in (
      select id from habits where user_id = auth.uid()
    )
  );
