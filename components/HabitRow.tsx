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
