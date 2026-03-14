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

Placed in the header of `app/page.tsx`. The current header is `flex items-center justify-between` with `<h1>` on the left and `<AddHabitForm>` on the right. `UserMenu` is added to the right side, to the left of `<AddHabitForm>`. Since the current header has no wrapper on the right side, wrap both in `<div className="flex items-center gap-2">`: `[UserMenu] [AddHabitForm]`.

`app/page.tsx` passes `user.email` as a prop to `UserMenu`. Prop type: `email: string | undefined`. If email is undefined, the avatar shows "?" and the dropdown shows "Unknown user" instead of the email.

**Dropdown close behavior:** The dropdown closes on (a) clicking outside the component, (b) pressing Escape, and (c) after logout completes (redirect handles this). Implement outside-click detection with a `useEffect` listening to `mousedown` on `document`, or use a Radix UI `Popover` component if available.

**Dropdown z-index:** Apply `z-50` to the dropdown container to ensure it renders above the habit table.

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
2. User presses Enter or clicks away:
   - If `name.trim()` is empty or unchanged from original → no server call, revert display to original, state → `idle`
   - Otherwise → calls `updateHabit(habit.id, newName.trim())` → state → `idle` (rename is **pessimistic**: the displayed name stays as the old value until `revalidatePath` causes a server re-render with the new name)
3. Escape key → state → `idle` (no save, display reverts to original)

**Delete flow:**
1. User clicks 🗑 icon → state → `confirming-delete` (confirmation UI always visible regardless of hover state; hover-based icon visibility is overridden)
2. User clicks "Yes, delete" → calls `deleteHabit(habit.id)` → row disappears immediately (optimistic)
3. User clicks "Cancel" or presses Escape → state → `idle`

Both actions use `useTransition` for pending state. Errors shown via `toast.error` from `sonner` (same library used throughout the app).

---

### `HabitRow.tsx` (modified)

- Remove inline delete button and `handleDelete` function
- Render `<HabitName>` in the first `<td>` instead of the current name + trash button
- Pass `habit`, `isPending`, and `startTransition` — or let `HabitName` own its own transition

**`HabitName` owns its own `useTransition`** — separate from `HabitRow`'s transition. The existing checkbox-disabling behavior (`disabled={isFuture || isPending}` in `HabitRow`) is unchanged — checkboxes are still disabled while a log toggle is in-flight. However, `HabitName`'s pending state does not propagate to the checkboxes. This is intentional: rename and delete operations are independent from log toggling.

**`HabitName` props:**
```ts
type Props = {
  habit: { id: string; name: string }
}
```
Actions (`updateHabit`, `deleteHabit`) are imported directly from `@/app/actions`, not passed as props.

**Pending UI:** While a transition is in-flight, the edit input and action buttons are disabled. No spinner is shown — the disabled state is sufficient feedback.

**Blur on empty or whitespace-only name:** If the user clears the input (or leaves only whitespace) and clicks away or presses Enter, the name reverts visually to the original value. No server call is made. Whitespace-only input is treated the same as empty (`name.trim() === ''` check applies on both client and server).

---

## Server Actions

### `updateHabit` (new, in `app/actions.ts`)

```ts
export async function updateHabit(habitId: string, name: string): Promise<void>
```

- Calls `supabase.auth.getUser()` and throws `'Not authenticated'` if no user (matching the existing `createHabit` pattern)
- Validates `name.trim()` is non-empty (throws if empty)
- Updates `habits.name` where `id = habitId`
- If the Supabase `.update()` call returns an error, throws `new Error(error.message)` (matching existing action pattern)
- RLS ensures user can only update their own habits
- Calls `revalidatePath('/')`

### `deleteHabit` (unchanged)

No server-side change. Delete confirmation is UI-only (two-step in `HabitName`). This is intentional — the action is only called after the user explicitly confirms in the UI. In the existing `deleteHabit` action, `revalidatePath('/')` is called only on the success path (after `.delete()` succeeds, before returning). Error paths throw before reaching `revalidatePath`, so a failed delete does not trigger revalidation — the component can safely return to `confirming-delete` state. `deleteHabit` intentionally omits an explicit `supabase.auth.getUser()` check (unlike `createHabit`/`updateHabit`) and relies on RLS instead. Do not add an auth check to this action.

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

- Photo/gravatar-based avatar (email-initial avatar is in scope; photo is not)
- Keyboard accessibility for hover-revealed icons (icons are mouse/touch only in this iteration)
- Reordering habits
- Bulk delete
- Password/account management
