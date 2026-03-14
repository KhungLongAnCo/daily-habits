# Logout & Habit Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add logout (user avatar dropdown), inline habit rename, and two-step delete confirmation to the daily habits tracker.

**Architecture:** Two new Client Components (`UserMenu`, `HabitName`) handle their own state and transitions independently. One new server action (`updateHabit`) persists renames. `HabitRow` is simplified by delegating name-cell logic to `HabitName`. No DB schema changes.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn UI, Supabase (`@supabase/ssr`), Vitest + React Testing Library, `sonner` for toasts, `lucide-react` for icons.

**Spec:** `docs/superpowers/specs/2026-03-14-logout-and-habit-management-design.md`

---

## File Map

| File | Change |
|------|--------|
| `app/actions.ts` | Add `updateHabit` action |
| `components/HabitName.tsx` | New — inline edit + delete confirmation (Client Component) |
| `components/HabitName.test.tsx` | New — RTL tests for HabitName state machine |
| `components/HabitRow.tsx` | Remove delete logic; render `<HabitName>` |
| `components/UserMenu.tsx` | New — avatar dropdown with logout (Client Component) |
| `app/page.tsx` | Pass `user.email` to `UserMenu`; wrap header right side |

---

## Chunk 1: Server Action + HabitName Component (TDD)

### Task 1: `updateHabit` server action

**Files:**
- Modify: `app/actions.ts`

- [ ] **Step 1: Add `updateHabit` to `app/actions.ts`**

Append to the existing file:

```ts
export async function updateHabit(habitId: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const trimmed = name.trim()
  if (!trimmed) throw new Error('Habit name cannot be empty')

  const { error } = await supabase
    .from('habits')
    .update({ name: trimmed })
    .eq('id', habitId)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add updateHabit server action"
```

---

### Task 2: `HabitName` component (TDD)

**Files:**
- Create: `components/HabitName.test.tsx`
- Create: `components/HabitName.tsx`

#### Step 1: Write failing tests

- [ ] **Step 1: Create `components/HabitName.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitName } from './HabitName'

// Mock server actions
vi.mock('@/app/actions', () => ({
  updateHabit: vi.fn().mockResolvedValue(undefined),
  deleteHabit: vi.fn().mockResolvedValue(undefined),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import { updateHabit, deleteHabit } from '@/app/actions'
import { toast } from 'sonner'

const habit = { id: 'habit-1', name: 'Read 30 min' }

beforeEach(() => {
  vi.clearAllMocks()
})

function setup() {
  const user = userEvent.setup()
  const result = render(<HabitName habit={habit} />)
  return { user, ...result }
}

describe('HabitName — idle state', () => {
  it('renders the habit name', () => {
    setup()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('renders edit and delete buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('HabitName — editing state', () => {
  it('shows an input pre-filled with the habit name when edit is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByRole('textbox')).toHaveValue('Read 30 min')
  })

  it('saves on Enter with a changed name', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Exercise')
    await user.keyboard('{Enter}')
    expect(updateHabit).toHaveBeenCalledWith('habit-1', 'Exercise')
  })

  it('saves on blur with a changed name', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Meditate')
    fireEvent.blur(input)
    await waitFor(() => expect(updateHabit).toHaveBeenCalledWith('habit-1', 'Meditate'))
  })

  it('does not call updateHabit if name is unchanged', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.keyboard('{Enter}')
    expect(updateHabit).not.toHaveBeenCalled()
  })

  it('does not call updateHabit if name is empty, reverts to original', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.keyboard('{Enter}')
    expect(updateHabit).not.toHaveBeenCalled()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('does not call updateHabit if name is whitespace only, reverts to original', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '   ')
    await user.keyboard('{Enter}')
    expect(updateHabit).not.toHaveBeenCalled()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('cancels on Escape, reverts to original name', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Something else')
    await user.keyboard('{Escape}')
    expect(updateHabit).not.toHaveBeenCalled()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('shows toast.error and returns to idle if updateHabit throws', async () => {
    vi.mocked(updateHabit).mockRejectedValueOnce(new Error('DB error'))
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'New name')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })
})

describe('HabitName — confirming-delete state', () => {
  it('shows confirmation UI when delete is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete read 30 min/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls deleteHabit when "Yes, delete" is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete/i }))
    expect(deleteHabit).toHaveBeenCalledWith('habit-1')
  })

  it('returns to idle on Cancel', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('returns to idle on Escape', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.keyboard('{Escape}')
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('shows toast.error and returns to confirming-delete if deleteHabit throws', async () => {
    vi.mocked(deleteHabit).mockRejectedValueOnce(new Error('DB error'))
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run test:run -- components/HabitName.test.tsx 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './HabitName'`

- [ ] **Step 3: Create `components/HabitName.tsx`**

```tsx
'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { updateHabit, deleteHabit } from '@/app/actions'
import { toast } from 'sonner'

type State = 'idle' | 'editing' | 'confirming-delete'

type Props = {
  habit: { id: string; name: string }
}

export function HabitName({ habit }: Props) {
  const [state, setState] = useState<State>('idle')
  const [inputValue, setInputValue] = useState(habit.name)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering editing state
  useEffect(() => {
    if (state === 'editing') {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [state])

  // Escape key handler
  useEffect(() => {
    if (state === 'idle') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setInputValue(habit.name)
        setState('idle')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state, habit.name])

  function handleEditClick() {
    setInputValue(habit.name)
    setState('editing')
  }

  function handleSave() {
    const trimmed = inputValue.trim()
    if (!trimmed || trimmed === habit.name) {
      setInputValue(habit.name)
      setState('idle')
      return
    }
    startTransition(async () => {
      try {
        await updateHabit(habit.id, trimmed)
        setState('idle')
      } catch {
        toast.error('Failed to rename habit. Please try again.')
        setInputValue(habit.name)
        setState('idle')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  function handleDeleteClick() {
    setState('confirming-delete')
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        await deleteHabit(habit.id)
        // Row will disappear via revalidatePath
      } catch {
        toast.error('Failed to delete habit. Please try again.')
        setState('confirming-delete')
      }
    })
  }

  if (state === 'editing') {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="border border-primary rounded px-1 py-0.5 text-sm w-[120px] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        aria-label="Edit habit name"
      />
    )
  }

  if (state === 'confirming-delete') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive">Delete {habit.name}?</span>
        <button
          onClick={handleConfirmDelete}
          disabled={isPending}
          className="text-xs text-destructive font-medium hover:underline disabled:opacity-50"
          aria-label="Yes, delete"
        >
          Yes, delete
        </button>
        <button
          onClick={() => setState('idle')}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    )
  }

  // idle state
  return (
    <div className="flex items-center gap-1 group/name">
      <span className="truncate max-w-[120px] text-sm font-medium">{habit.name}</span>
      <button
        onClick={handleEditClick}
        className="opacity-0 group-hover/name:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        aria-label={`Edit ${habit.name}`}
      >
        <Pencil size={12} />
      </button>
      <button
        onClick={handleDeleteClick}
        className="opacity-0 group-hover/name:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        aria-label={`Delete ${habit.name}`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run test:run -- components/HabitName.test.tsx 2>&1 | tail -15
```

Expected: all tests PASS. If any fail, fix `HabitName.tsx` to match the expected behavior.

- [ ] **Step 5: Run the full test suite to confirm nothing is broken**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run test:run 2>&1 | tail -5
```

Expected: all existing tests (18) plus new HabitName tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/HabitName.tsx components/HabitName.test.tsx
git commit -m "feat: add HabitName component with inline edit and delete confirmation"
```

---

## Chunk 2: HabitRow Refactor + UserMenu + Page Integration

### Task 3: Refactor `HabitRow` to use `HabitName`

**Files:**
- Modify: `components/HabitRow.tsx`

- [ ] **Step 1: Replace `HabitRow.tsx` with the simplified version**

The current `HabitRow.tsx` handles delete inline. Replace it entirely with:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toggleHabitLog } from '@/app/actions'
import { HabitName } from './HabitName'
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

    setOptimisticDates((prev) =>
      wasChecked ? prev.filter((d) => d !== date) : [...prev, date]
    )

    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, date)
      } catch {
        setOptimisticDates((prev) =>
          wasChecked ? [...prev, date] : prev.filter((d) => d !== date)
        )
        toast.error('Failed to update habit. Please try again.')
      }
    })
  }

  return (
    <tr className="border-t border-border/40 hover:bg-muted/30">
      <td className="py-2 pr-4">
        <HabitName habit={habit} />
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

Note: The `group` class is removed from `<tr>` since hover-icon visibility is now handled inside `HabitName` using `group/name`. The `font-medium` class is also removed from the first `<td>` — it is now applied directly by `HabitName`'s idle `<span>`.

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run test:run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/HabitRow.tsx
git commit -m "refactor: simplify HabitRow by delegating name cell to HabitName"
```

---

### Task 4: `UserMenu` component

**Files:**
- Create: `components/UserMenu.tsx`

- [ ] **Step 1: Create `components/UserMenu.tsx`**

```tsx
'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Props = {
  email: string | undefined
}

export function UserMenu({ email }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const initial = email ? email[0].toUpperCase() : '?'
  const displayEmail = email ?? 'Unknown user'

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleLogout() {
    startTransition(async () => {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
      } catch {
        toast.error('Failed to log out. Please try again.')
      }
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium hover:bg-muted/80 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-md z-50 py-1">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {displayEmail}
          </div>
          <div className="border-t border-border my-1" />
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isPending ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build to catch TypeScript errors**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run build 2>&1 | tail -10
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add components/UserMenu.tsx
git commit -m "feat: add UserMenu component with logout dropdown"
```

---

### Task 5: Update `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

First, add the import after the existing `AddHabitForm` import line:
```tsx
import { UserMenu } from '@/components/UserMenu'
```

Then replace the header JSX:
```tsx
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Daily Habits</h1>
        <AddHabitForm />
      </div>
```

With:
```tsx
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Daily Habits</h1>
        <div className="flex items-center gap-2">
          <UserMenu email={user.email ?? undefined} />
          <AddHabitForm />
        </div>
      </div>
```

Note: `user.email ?? undefined` is safe here because `if (!user) redirect('/login')` already runs above this point, narrowing `user` to non-null.

- [ ] **Step 2: Run the build to catch TypeScript errors**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add UserMenu to page header with logout"
```

---

## Final Verification

- [ ] **Run all tests**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run test:run 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Run production build**

```bash
cd /Users/luanluan/Workspace/daily-habits/.worktrees/mvp && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Manual smoke test**

Start dev server (`npm run dev`) and verify:

1. Header shows a circular avatar button with your email's first letter
2. Click avatar → dropdown opens showing email + "Log out"
3. Click outside or press Escape → dropdown closes
4. Click "Log out" → redirected to `/login`
5. Log back in → land on habit tracker
6. Hover a habit row → edit (✏) and delete (🗑) icons appear
7. Click ✏ → input appears pre-filled with habit name
8. Edit name, press Enter → name saves (refreshes from server)
9. Click ✏, press Escape → name reverts, no save
10. Click 🗑 → "Delete [name]? Yes, delete / Cancel" appears
11. Click "Cancel" → back to normal
12. Click 🗑 again → click "Yes, delete" → habit disappears
