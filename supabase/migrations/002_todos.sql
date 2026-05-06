-- supabase/migrations/002_todos.sql

create table todos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  name        text        not null,
  due_date    date        not null,
  due_time    time,
  completed   boolean     default false,
  created_at  timestamptz default now()
);

alter table todos enable row level security;

create policy "Users can manage own todos"
  on todos for all
  using (user_id = auth.uid());
