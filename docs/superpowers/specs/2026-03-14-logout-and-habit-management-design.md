# Logout & Habit Management Design

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Add logout, inline habit rename, and delete confirmation to the daily habits tracker.

---

## Goals

- Let users log out from within the app
- Allow renaming a habit without deleting and recreating it
- Prevent accidental habit deletion with a two-step confirmation

---

## Architecture

No database schema changes required. The `habits.name` column already exists and supports updates.

Three units of new work:

1. **`UserMenu` component** — logout UI
2. **`HabitName` component** — inline edit + delete confirmation
3. **`updateHabit` server action** — persists habit renames

---

## Components

### `components/UserMenu.tsx` (new, Client Component)

Renders a circular avatar button showing the user's email initial. Clicking toggles a dropdown with:
- User's full email (read-only)
- "Log out" button

On logout: calls `supabase.auth.signOut()` from the browser client, then uses `useRouter().push('/login')` to redirect.

Placed in the header of `app/page.tsx`. The current header is `flex items-center justify-between` with `<h1>` on the left and `<AddHabitForm>` on the right. `UserMenu` is added to the right side, to the left of `<AddHabitForm>`, so the right side becomes a flex row: `[UserMenu] [AddHabitForm]`.

`app/page.tsx` passes `user.email` as a prop to `UserMenu`.

**Dropdown close behavior:** The dropdown closes on (a) clicking outside the component, (b) pressing Escape, and (c) after logout completes (redirect handles this). Implement outside-click detection with a `useEffect` listening to `mousedown` on `document`, or use a Radix UI `Popover` component if available.

---

### `components/HabitName.tsx` (new, Client Component)

Extracted from `HabitRow`'s first `<td>`. Owns the name cell state machine:

| State | UI |
|---|---|
| `idle` | Name text + edit (✏) and delete (🗑) icons on hover |
| `editing` | `<input>` pre-filled with current name. Enter/blur saves, Escape cancels |
| `confirming-delete` | "Delete [name]?" text in red + "Yes, delete" and "Cancel" buttons |

**Edit flow:**
1. User clicks ✏ icon → state → `editing`
2. User types new name → presses Enter or clicks away → calls `updateHabit(habit.id, newName)` → state → `idle`
3. Escape key → state → `idle` (no save)
4. If name is empty or unchanged → no server call, state → `idle`

**Delete flow:**
1. User clicks 🗑 icon → state → `confirming-delete`
2. User clicks "Yes, delete" → calls `deleteHabit(habit.id)` → row disappears
3. User clicks "Cancel" → state → `idle`

Both actions use `useTransition` for pending state. Errors shown via `toast.error` from `sonner` (same library used throughout the app).

---

### `HabitRow.tsx` (modified)

- Remove inline delete button and `handleDelete` function
- Render `<HabitName>` in the first `<td>` instead of the current name + trash button
- Pass `habit`, `isPending`, and `startTransition` — or let `HabitName` own its own transition

**`HabitName` owns its own `useTransition`** — separate from `HabitRow`'s transition. This is an intentional design decision: checkboxes in the row are not disabled while a rename or delete is in-flight. The two operations (toggling logs vs. managing the habit itself) are independent and do not need to block each other.

**`HabitName` props:**
```ts
type Props = {
  habit: { id: string; name: string }
}
```
Actions (`updateHabit`, `deleteHabit`) are imported directly from `@/app/actions`, not passed as props.

**Pending UI:** While a transition is in-flight, the edit input and action buttons are disabled. No spinner is shown — the disabled state is sufficient feedback.

**Blur on empty name:** If the user clears the input and clicks away (or presses Enter), the name reverts visually to the original value. No server call is made.

---

## Server Actions

### `updateHabit` (new, in `app/actions.ts`)

```ts
export async function updateHabit(habitId: string, name: string): Promise<void>
```

- Calls `supabase.auth.getUser()` and throws `'Not authenticated'` if no user (matching the existing `createHabit` pattern)
- Validates `name.trim()` is non-empty (throws if empty)
- Updates `habits.name` where `id = habitId`
- RLS ensures user can only update their own habits
- Calls `revalidatePath('/')`

### `deleteHabit` (unchanged)

No server-side change. Delete confirmation is UI-only (two-step in `HabitName`). This is intentional — the action is only called after the user explicitly confirms in the UI.

---

## File Map

| File | Change |
|---|---|
| `app/actions.ts` | Add `updateHabit` |
| `app/page.tsx` | Pass `user.email` to `UserMenu`; add `UserMenu` to header |
| `components/UserMenu.tsx` | New — avatar dropdown with logout |
| `components/HabitName.tsx` | New — inline edit + delete confirmation |
| `components/HabitRow.tsx` | Remove delete logic; render `HabitName` |

---

## Error Handling

- Edit: if `updateHabit` throws, show `toast.error`, revert input to original name, return to `idle`
- Delete: if `deleteHabit` throws, show `toast.error`, return to `confirming-delete` so user can retry
- Logout: if `signOut` throws, show `toast.error`, stay on page

---

## Testing

- `HabitName` state transitions (idle → editing → idle, idle → confirming → deleted) tested with React Testing Library
- `updateHabit` server action tested manually (no Next.js runtime available in unit tests)
- `UserMenu` logout flow tested manually via browser

---

## Out of Scope

- Email-based avatar (initials only)
- Reordering habits
- Bulk delete
- Password/account management
