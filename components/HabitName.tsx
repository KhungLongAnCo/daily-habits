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
