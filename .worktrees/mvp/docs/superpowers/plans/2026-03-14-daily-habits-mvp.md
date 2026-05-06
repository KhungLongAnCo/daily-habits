# Daily Habits MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal habit tracker web app — a monthly checkbox grid where the user checks off daily habits — using Next.js 15 App Router and Supabase.

**Architecture:** Single-page App Router app with Server Components for data fetching and Client Components for interactivity. Server Actions handle all mutations (create/delete habit, toggle log). Supabase provides PostgreSQL + magic-link auth with RLS enforcing per-user data isolation.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Supabase (Auth + PostgreSQL via `@supabase/ssr`), Vitest + React Testing Library

> **Note:** The spec was drafted targeting Next.js 14 but this plan targets Next.js 15. Next.js 15 made `cookies()` async (requires `await`) which is already reflected throughout this plan. Use `create-next-app@latest` which installs 15.x.

**Spec:** `docs/superpowers/specs/2026-03-14-daily-habits-design.md`

---

## File Map

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout: font, metadata, Toaster |
| `app/page.tsx` | Protected habit tracker page (Server Component) |
| `app/actions.ts` | Server Actions: createHabit, deleteHabit, toggleHabitLog |
| `app/login/page.tsx` | Login page shell (Server Component) |
| `app/auth/callback/route.ts` | Exchanges magic link code for session |
| `components/HabitGrid.tsx` | Table wrapper (Server Component) |
| `components/HabitRow.tsx` | One row per habit with optimistic checkboxes (Client) |
| `components/CompletionRate.tsx` | Rate display derived from optimistic state (no directive — plain component used inside Client Component) |
| `components/AddHabitForm.tsx` | Shadcn Dialog for creating habits (Client) |
| `components/LoginForm.tsx` | Email input + OTP trigger (Client) |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (cookie-based) |
| `lib/utils/dates.ts` | Pure date helpers: getDaysInMonth, isFuture, isToday |
| `lib/utils/completion.ts` | Pure completion rate calculator |
| `middleware.ts` | Auth guard — redirects unauthenticated requests to /login |
| `supabase/migrations/001_initial.sql` | habits + habit_logs tables + RLS policies |
| `vitest.config.ts` | Vitest configuration for Next.js |
| `vitest.setup.ts` | Testing Library matchers setup |

---

## Chunk 1: Project Bootstrap

### Task 1: Scaffold Next.js project

**Files:**
- Create: (Next.js scaffolds the project in the current directory)

- [ ] **Step 1: Run create-next-app in the existing directory**

```bash
cd /Users/luanluan/Workspace/daily-habits
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

The flags suppress interactive prompts for `src/`, App Router, and import alias — you should not be asked about those. If prompted about existing files (e.g., `CLAUDE.md`), choose to keep them.

Expected: Next.js project scaffolded with `app/`, `components/`, `public/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`.

- [ ] **Step 2: Verify the project runs**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000` with no errors.

- [ ] **Step 3: Stop the dev server (Ctrl+C) and commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project"
```

---

### Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase SSR package and lucide-react icons**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Install testing dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Expected: dev dependencies added.

- [ ] **Step 3: Install Shadcn UI**

```bash
npx shadcn@latest init
```

Prompts: choose default style (New York), base color (Neutral), CSS variables (Yes).

- [ ] **Step 4: Add required Shadcn components**

```bash
npx shadcn@latest add button input dialog label sonner
```

Expected: components created in `components/ui/`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: install Supabase, Shadcn UI, and testing deps"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create vitest setup file**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `scripts`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Run tests (should show no test files yet)**

```bash
npm run test:run
```

Expected: `No test files found` — that is fine.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "feat: configure Vitest with jsdom and Testing Library"
```

---

### Task 4: Database migration

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create migration file**

```sql
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
```

- [ ] **Step 2: Run migration in Supabase**

Open the Supabase dashboard → SQL Editor → paste the contents of `001_initial.sql` → Run.

Verify: `habits` and `habit_logs` tables appear in the Table Editor with RLS enabled (shield icon).

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/001_initial.sql
git commit -m "feat: add habits and habit_logs migration with RLS"
```

---

### Task 5: Environment variables

**Files:**
- Create: `.env.local`
- Create: `.env.local.example`

- [ ] **Step 1: Get Supabase credentials**

In Supabase dashboard → Project Settings → API → copy:
- Project URL
- `anon` public key

- [ ] **Step 2: Create .env.local**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace with real values from Supabase dashboard.

- [ ] **Step 3: Create .env.local.example (safe to commit)**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Ensure .env.local is gitignored**

Verify `.gitignore` contains `.env.local` (Next.js adds this by default).

- [ ] **Step 5: Commit example file**

```bash
git add .env.local.example
git commit -m "chore: add env example file"
```

---

## Chunk 2: Auth Infrastructure

### Task 6: Supabase clients

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Create browser client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client**

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — cookies are read-only, safe to ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: add Supabase browser and server clients"
```

---

### Task 7: Middleware (auth guard)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware**

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 2: Verify redirect works**

Start the dev server (`npm run dev`). Visit `http://localhost:3000` in a browser (without being logged in).

Expected: redirected to `http://localhost:3000/login` (will 404 for now — that's fine, page doesn't exist yet).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware to protect root route"
```

---

### Task 8: Login page

**Files:**
- Create: `app/login/page.tsx`
- Create: `components/LoginForm.tsx`

- [ ] **Step 1: Create LoginForm (Client Component)**

```tsx
// components/LoginForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Check your email for a magic link to sign in.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending...' : 'Send magic link'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create login page**

```tsx
// app/login/page.tsx
import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Daily Habits</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to track your habits</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify login page renders**

Start dev server. Visit `http://localhost:3000/login`.

Expected: login page with email input and "Send magic link" button.

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx components/LoginForm.tsx
git commit -m "feat: add login page with magic link form"
```

---

### Task 9: Auth callback route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create the callback route handler**

```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // Expired or invalid link — send back to login with an error message
      return NextResponse.redirect(`${origin}/login?error=link_expired`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 2: Configure Supabase redirect URL**

In Supabase dashboard → Authentication → URL Configuration → Redirect URLs, add:
- `http://localhost:3000/auth/callback`

- [ ] **Step 3: Test the full auth flow**

1. Visit `http://localhost:3000` → should redirect to `/login`
2. Enter your email → click "Send magic link"
3. Check email → click the link
4. Should land on `http://localhost:3000/` (will 404 for now — page not built yet)

Expected: no auth errors, session cookie is set.

- [ ] **Step 4: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add auth callback route for magic link exchange"
```

---

## Chunk 3: Business Logic with TDD

### Task 10: Date utility functions

**Files:**
- Create: `lib/utils/dates.ts`
- Create: `lib/utils/dates.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// lib/utils/dates.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDaysInMonth,
  isFutureDate,
  isToday,
  getElapsedDays,
  formatDateISO,
} from './dates'

describe('getDaysInMonth', () => {
  it('returns 31 for March', () => {
    expect(getDaysInMonth(2026, 3)).toBe(31)
  })
  it('returns 28 for February in a non-leap year', () => {
    expect(getDaysInMonth(2025, 2)).toBe(28)
  })
  it('returns 29 for February in a leap year', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
  })
  it('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 4)).toBe(30)
  })
})

describe('isFutureDate', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns true for a date in the future', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isFutureDate('2026-03-15')).toBe(true)
  })
  it('returns false for today', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isFutureDate('2026-03-14')).toBe(false)
  })
  it('returns false for a past date', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isFutureDate('2026-03-01')).toBe(false)
  })
})

describe('isToday', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns true for today', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isToday('2026-03-14')).toBe(true)
  })
  it('returns false for yesterday', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isToday('2026-03-13')).toBe(false)
  })
})

describe('getElapsedDays', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns 14 on March 14 for March 2026', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(getElapsedDays(2026, 3)).toBe(14)
  })
  it('returns total days in month when viewing past month', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(getElapsedDays(2026, 2)).toBe(28)
  })
  it('returns 0 for a future month', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(getElapsedDays(2026, 4)).toBe(0)
  })
})

describe('formatDateISO', () => {
  it('formats year/month/day into YYYY-MM-DD', () => {
    expect(formatDateISO(2026, 3, 5)).toBe('2026-03-05')
    expect(formatDateISO(2026, 12, 31)).toBe('2026-12-31')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- lib/utils/dates.test.ts
```

Expected: FAIL — `Cannot find module './dates'`

- [ ] **Step 3: Implement the utilities**

```ts
// lib/utils/dates.ts
// All date comparisons use UTC to avoid timezone-dependent test failures.

export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of the next month = last day of the given month
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayISO(): string {
  const now = new Date()
  return formatDateISO(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate())
}

export function isFutureDate(date: string): boolean {
  return date > todayISO()
}

export function isToday(date: string): boolean {
  return date === todayISO()
}

export function getElapsedDays(year: number, month: number): number {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const currentDay = now.getUTCDate()

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month — all days elapsed
    return getDaysInMonth(year, month)
  }

  if (year === currentYear && month === currentMonth) {
    return currentDay
  }

  // Future month — 0 days elapsed
  return 0
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- lib/utils/dates.test.ts
```

Expected: all 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/dates.ts lib/utils/dates.test.ts
git commit -m "feat: add date utility functions with tests"
```

---

### Task 11: Completion rate utility

**Files:**
- Create: `lib/utils/completion.ts`
- Create: `lib/utils/completion.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// lib/utils/completion.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateCompletionRate } from './completion'

describe('calculateCompletionRate', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns 0 when no days checked', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    expect(calculateCompletionRate([], 2026, 3)).toBe(0)
  })

  it('returns 100 when all elapsed days are checked', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    const allDays = Array.from({ length: 14 }, (_, i) =>
      `2026-03-${String(i + 1).padStart(2, '0')}`
    )
    expect(calculateCompletionRate(allDays, 2026, 3)).toBe(100)
  })

  it('returns 50 when half of elapsed days are checked', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    const halfDays = Array.from({ length: 7 }, (_, i) =>
      `2026-03-${String(i + 1).padStart(2, '0')}`
    )
    expect(calculateCompletionRate(halfDays, 2026, 3)).toBe(50)
  })

  it('rounds to nearest integer', () => {
    vi.setSystemTime(new Date('2026-03-03'))
    // 1 out of 3 days = 33.33...%
    expect(calculateCompletionRate(['2026-03-01'], 2026, 3)).toBe(33)
  })

  it('returns 0 when elapsed days is 0 (future month)', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    expect(calculateCompletionRate([], 2026, 4)).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- lib/utils/completion.test.ts
```

Expected: FAIL — `Cannot find module './completion'`

- [ ] **Step 3: Implement completion rate**

```ts
// lib/utils/completion.ts
import { getElapsedDays } from './dates'

export function calculateCompletionRate(
  checkedDates: string[],
  year: number,
  month: number
): number {
  const elapsed = getElapsedDays(year, month)
  if (elapsed === 0) return 0

  // Only count dates that fall within the given year/month
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  const inMonth = checkedDates.filter((d) => d.startsWith(prefix))

  return Math.round((inMonth.length / elapsed) * 100)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- lib/utils/completion.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Run all tests to confirm nothing broken**

```bash
npm run test:run
```

Expected: 18 tests PASS across both test files (13 date tests + 5 completion rate tests).

- [ ] **Step 6: Commit**

```bash
git add lib/utils/completion.ts lib/utils/completion.test.ts
git commit -m "feat: add completion rate utility with tests"
```

---

### Task 12: Server Actions

**Files:**
- Create: `app/actions.ts`

Note: Server Actions use `cookies()` from `next/headers` and cannot be unit tested without a full Next.js runtime. They are tested manually via integration (the UI smoke test in Chunk 4). Keep the implementation thin and delegate logic to the utility functions already tested.

- [ ] **Step 1: Create Server Actions**

```ts
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHabit(name: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('habits')
    .insert({ name, user_id: user.id })

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function toggleHabitLog(
  habitId: string,
  date: string
): Promise<void> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('date', date)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId, date })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add Server Actions for habit CRUD and log toggle"
```

---

## Chunk 4: UI Components & Page Integration

### Task 13: HabitGrid (Server Component)

**Files:**
- Create: `components/HabitGrid.tsx`

This component receives pre-fetched data from `page.tsx` and renders the table structure. It does not fetch data itself.

- [ ] **Step 1: Create HabitGrid**

```tsx
// components/HabitGrid.tsx
import { HabitRow } from './HabitRow'
import { formatDateISO, getDaysInMonth } from '@/lib/utils/dates'

export type Habit = {
  id: string
  name: string
}

export type HabitLog = {
  habit_id: string
  date: string
}

type Props = {
  habits: Habit[]
  logs: HabitLog[]
  year: number
  month: number
}

export function HabitGrid({ habits, logs, year, month }: Props) {
  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthLabel = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{monthLabel}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 font-medium min-w-[140px]">Habit</th>
              {days.map((day) => (
                <th
                  key={day}
                  className="w-7 text-center text-xs font-normal text-muted-foreground"
                >
                  {day}
                </th>
              ))}
              <th className="pl-4 text-right text-xs font-normal text-muted-foreground min-w-[50px]">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const habitLogs = logs
                .filter((l) => l.habit_id === habit.id)
                .map((l) => l.date)
              return (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  checkedDates={habitLogs}
                  days={days}
                  year={year}
                  month={month}
                />
              )
            })}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No habits yet. Add one above.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/HabitGrid.tsx
git commit -m "feat: add HabitGrid server component"
```

---

### Task 14: HabitRow (Client Component, optimistic UI)

**Files:**
- Create: `components/HabitRow.tsx`

- [ ] **Step 1: Create HabitRow**

```tsx
// components/HabitRow.tsx
'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toggleHabitLog, deleteHabit } from '@/app/actions'
import { CompletionRate } from './CompletionRate'
import { isFutureDate, isToday, formatDateISO } from '@/lib/utils/dates'
import { toast } from 'sonner'
import type { Habit } from './HabitGrid'

type Props = {
  habit: Habit
  checkedDates: string[]
  days: number[]
  year: number
  month: number
}

export function HabitRow({ habit, checkedDates, days, year, month }: Props) {
  const [optimisticDates, setOptimisticDates] = useState<string[]>(checkedDates)
  const [isPending, startTransition] = useTransition()

  function handleToggle(day: number) {
    const date = formatDateISO(year, month, day)
    if (isFutureDate(date)) return

    const wasChecked = optimisticDates.includes(date)

    // Optimistic update
    setOptimisticDates((prev) =>
      wasChecked ? prev.filter((d) => d !== date) : [...prev, date]
    )

    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, date)
      } catch {
        // Revert on error
        setOptimisticDates((prev) =>
          wasChecked ? [...prev, date] : prev.filter((d) => d !== date)
        )
        toast.error('Failed to update habit. Please try again.')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteHabit(habit.id)
      } catch {
        toast.error('Failed to delete habit. Please try again.')
      }
    })
  }

  return (
    <tr className="border-t border-border/40 hover:bg-muted/30 group">
      <td className="py-2 pr-4 font-medium">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[120px]">{habit.name}</span>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            aria-label={`Delete ${habit.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
      {days.map((day) => {
        const date = formatDateISO(year, month, day)
        const isChecked = optimisticDates.includes(date)
        const isFuture = isFutureDate(date)
        const today = isToday(date)

        return (
          <td key={day} className="text-center">
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isFuture || isPending}
              onChange={() => handleToggle(day)}
              className={`w-4 h-4 rounded cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40 ${
                today ? 'ring-2 ring-primary ring-offset-1' : ''
              }`}
              aria-label={`${habit.name} on day ${day}`}
            />
          </td>
        )
      })}
      <td className="pl-4 text-right">
        <CompletionRate checkedDates={optimisticDates} year={year} month={month} />
      </td>
    </tr>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/HabitRow.tsx
git commit -m "feat: add HabitRow with optimistic checkbox UI"
```

---

### Task 15: CompletionRate (Client Component)

**Files:**
- Create: `components/CompletionRate.tsx`

- [ ] **Step 1: Create CompletionRate**

```tsx
// components/CompletionRate.tsx
// No 'use client' needed — pure display component, receives props from HabitRow (already a Client Component)
import { calculateCompletionRate } from '@/lib/utils/completion'

type Props = {
  checkedDates: string[]
  year: number
  month: number
}

export function CompletionRate({ checkedDates, year, month }: Props) {
  const rate = calculateCompletionRate(checkedDates, year, month)

  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        rate >= 80
          ? 'text-green-600'
          : rate >= 50
          ? 'text-yellow-600'
          : 'text-muted-foreground'
      }`}
    >
      {rate}%
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CompletionRate.tsx
git commit -m "feat: add CompletionRate client component"
```

---

### Task 16: AddHabitForm (Client Component)

**Files:**
- Create: `components/AddHabitForm.tsx`

- [ ] **Step 1: Create AddHabitForm**

```tsx
// components/AddHabitForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { createHabit } from '@/app/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

export function AddHabitForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await createHabit(name.trim())
        setName('')
        setOpen(false)
      } catch {
        setError('Failed to create habit. Please try again.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} className="mr-1" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Habit name</Label>
            <Input
              id="habit-name"
              placeholder="e.g. Read for 30 minutes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/AddHabitForm.tsx
git commit -m "feat: add AddHabitForm dialog component"
```

---

### Task 17: Main page and layout

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update root layout to include Toaster**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Daily Habits',
  description: 'Track your daily habits',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Build the main habit tracker page**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HabitGrid } from '@/components/HabitGrid'
import { AddHabitForm } from '@/components/AddHabitForm'
import { formatDateISO, getDaysInMonth } from '@/lib/utils/dates'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const startOfMonth = formatDateISO(year, month, 1)
  const endOfMonth = formatDateISO(year, month, getDaysInMonth(year, month))

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name')
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, date')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
  ])

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Daily Habits</h1>
        <AddHabitForm />
      </div>
      <HabitGrid
        habits={habits ?? []}
        logs={logs ?? []}
        year={year}
        month={month}
      />
    </main>
  )
}
```

- [ ] **Step 3: Build and verify the full app**

```bash
npm run build
```

Expected: build succeeds with no TypeScript or ESLint errors.

- [ ] **Step 4: Run the app and do a smoke test**

```bash
npm run dev
```

Manual smoke test checklist:
1. Visit `http://localhost:3000` → redirected to `/login`
2. Enter email → receive magic link → click it → land on habit tracker
3. Click "Add Habit" → type a habit name → click "Add" → habit appears in grid
4. Click a checkbox for today → it checks immediately (optimistic) → stays checked after reload
5. Click a checked box → it unchecks
6. Try to check a future day → checkbox is disabled
7. Hover over a habit → delete icon appears → click it → habit disappears
8. Completion rate updates as you check/uncheck

Expected: all 8 steps work correctly.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: build main habit tracker page with full integration"
```

---

## Final Verification

- [ ] **Run all unit tests**

```bash
npm run test:run
```

Expected: 18 tests PASS (13 date tests + 5 completion rate tests).

- [ ] **Run a production build**

```bash
npm run build
```

Expected: Build succeeds, no errors.

- [ ] **Tag the MVP**

```bash
git tag v0.1.0-mvp
```

---

## Post-MVP Roadmap

Features intentionally deferred (from `docs/superpowers/specs/2026-03-14-daily-habits-design.md`):
- Dashboard with weekly progress chart (Recharts)
- Monthly Goals (CRUD + status tracking)
- Habit statistics (streaks, completion history)
- Weekly Tasks
- Monthly Reflection / Review
- Dark mode
- Export (PDF/CSV)
- Reminders / notifications
