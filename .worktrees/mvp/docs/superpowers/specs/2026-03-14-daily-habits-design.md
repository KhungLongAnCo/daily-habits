# Daily Habits — MVP Design Spec

**Date:** 2026-03-14
**Scope:** MVP — Habit Tracker only
**Goal:** Personal use, single user

---

## Overview

A personal daily habit tracking web app. The MVP delivers a single-page habit tracker showing a monthly checkbox grid where the user checks off habits each day. Built with Next.js 14 App Router and Supabase.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router)             |
| Styling     | Tailwind CSS + Shadcn UI            |
| Database    | Supabase (PostgreSQL)               |
| Auth        | Supabase Auth (magic link)          |
| Charts      | Recharts (post-MVP)                 |
| Deployment  | Vercel                              |

---

## Architecture

```
Browser
  └── Next.js 14 (App Router)
        ├── /app/login         → Magic link login page
        ├── /app/page.tsx      → Habit tracker (protected, root route)
        └── /app/actions.ts    → Server Actions (create/delete/toggle habit)
              └── Supabase
                    ├── Auth (magic link)
                    ├── habits table
                    └── habit_logs table
```

- No separate API layer — Server Actions talk directly to Supabase server-side.
- Supabase Row Level Security (RLS) ensures each user only accesses their own data.
- Next.js middleware redirects unauthenticated users to `/login`.
- All habit tracking lives on the root route `/` — no page navigation needed for MVP.

---

## Data Model

```sql
habits
  id          uuid        primary key default gen_random_uuid()
  user_id     uuid        not null references auth.users on delete cascade
  name        text        not null
  created_at  timestamptz default now()

habit_logs
  id          uuid  primary key default gen_random_uuid()
  habit_id    uuid  not null references habits(id) on delete cascade
  date        date  not null
  unique(habit_id, date)
```

**Design decisions:**
- `habit_logs` has no `completed` boolean. A row's existence means completed. Checking = INSERT, unchecking = DELETE. Simpler and avoids stale boolean state.
- RLS on `habits`: `user_id = auth.uid()`. RLS on `habit_logs`: protected transitively via join to habits.
- Cascade deletes: removing a habit removes all its logs.

### RLS Policies

```sql
-- habits
create policy "Users can manage own habits"
  on habits for all
  using (user_id = auth.uid());

-- habit_logs
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
```

---

## UI Layout

Single page, table layout:

```
┌─────────────────────────────────────────┐
│  Daily Habits          [+ Add Habit]    │
├─────────────────────────────────────────┤
│  March 2026                             │
│                                         │
│  Habit      │1│2│3│...│31│  Rate        │
│  ───────────┼─┼─┼─┼───┼──┼──────       │
│  Dậy 5h     │✓│✓│ │...│✓ │  87%        │
│  Đọc sách   │ │✓│✓│...│  │  63%        │
│  Workout    │✓│ │✓│...│✓ │  70%        │
└─────────────────────────────────────────┘
```

---

## Components

| Component         | Type             | Responsibility                                                                                      |
|-------------------|------------------|-----------------------------------------------------------------------------------------------------|
| `HabitGrid`       | Server Component | Fetches habits + logs for current month, renders the table                                          |
| `HabitRow`        | Client Component | One row per habit; checkboxes call Server Action on click; tracks optimistic state                  |
| `AddHabitForm`    | Client Component | Shadcn Dialog with text input to create a new habit                                                 |
| `CompletionRate`  | Client Component | Derived from `HabitRow` optimistic state; displays `checked days / days elapsed this month`         |
| `LoginPage`       | Server Component | Renders the page shell; contains `LoginForm` (Client Component) for email input and form submission |
| `LoginForm`       | Client Component | Email input; calls `supabase.auth.signInWithOtp({ email })` from browser Supabase client            |

---

## Server Actions

```ts
// app/actions.ts

createHabit(name: string): Promise<void>
// INSERT into habits (user_id from session)
// Calls revalidatePath('/')

deleteHabit(habitId: string): Promise<void>
// DELETE from habits WHERE id = habitId (cascades to habit_logs)
// Calls revalidatePath('/')

toggleHabitLog(habitId: string, date: string): Promise<void>
// date must be ISO format: YYYY-MM-DD (e.g., "2026-03-14")
// If log exists for (habitId, date) → DELETE
// Else → INSERT
// Each action calls revalidatePath('/') to invalidate the page cache
```

---

## Data Fetching

`/app/page.tsx` is a Server Component that:
1. Gets the current user session (redirects to `/login` if none)
2. Fetches all habits for the user
3. Fetches all habit_logs for the current month
4. Passes combined data to `HabitGrid`

No client-side data fetching, no `useEffect`, no loading spinners for initial render.

---

## Auth Flow

```
/login → user enters email in LoginForm (Client Component)
       → LoginForm calls supabase.auth.signInWithOtp({ email })
       → Supabase sends magic link email
       → user clicks link → browser lands on /auth/callback?code=...
       → route.ts calls supabase.auth.exchangeCodeForSession(code)
       → session stored in cookie → redirect to /

middleware.ts → checks session on every request
             → unauthenticated → redirect to /login
             → authenticated → allow through
```

**Supabase dashboard configuration required:**
- Add `http://localhost:3000/auth/callback` to the Redirect URLs list
- Add your production URL (e.g., `https://your-app.vercel.app/auth/callback`) before deploying

---

## UX Rules

- **Optimistic UI on checkboxes** — check/uncheck immediately, sync in background, revert on error
- **Future days disabled** — cannot check a date that hasn't happened yet
- **Today highlighted** — current day column visually distinct
- **Completion rate** — counts only days elapsed so far in the month (not full 30/31)

---

## Error Handling

| Scenario              | Behavior                                              |
|-----------------------|-------------------------------------------------------|
| Toggle fails          | Revert optimistic update, show toast notification     |
| Add habit fails       | Show inline error in the form dialog                  |
| Session expired       | Middleware redirects to `/login`                      |
| Delete habit fails    | Show toast, habit remains in list                     |

---

## Out of Scope (Post-MVP)

The following features from `IDEAD.md` are intentionally excluded from the MVP:

- Dashboard with weekly progress chart
- Monthly Goals tracking
- Habit statistics (streaks, completion history)
- Weekly Tasks
- Monthly Reflection / Review
- Reminders / notifications
- Dark mode
- Export (PDF/CSV)
- AI review features

---

## File Structure

```
daily-habits/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Habit tracker (protected)
│   ├── actions.ts            # Server Actions
│   ├── login/
│   │   └── page.tsx          # Magic link login
│   └── auth/
│       └── callback/
│           └── route.ts      # Supabase auth callback
├── components/
│   ├── HabitGrid.tsx
│   ├── HabitRow.tsx
│   ├── AddHabitForm.tsx
│   ├── CompletionRate.tsx
│   └── LoginForm.tsx
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       └── server.ts         # Server Supabase client
├── middleware.ts
└── supabase/
    └── migrations/
        └── 001_initial.sql   # habits + habit_logs tables + RLS
```
