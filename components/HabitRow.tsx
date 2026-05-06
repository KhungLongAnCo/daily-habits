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
  index: number
}

export function HabitRow({ habit, checkedDates, days, year, month, index }: Props) {
  const [optimisticDates, setOptimisticDates] = useState<string[]>(checkedDates)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

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
        toast.error('Failed to update protocol sync. Please retry.')
      }
    })
  }

  function handleDelete() {
    setIsDeleting(true)
    startTransition(async () => {
      try {
        await deleteHabit(habit.id)
        toast.success('Protocol terminated.')
      } catch {
        toast.error('Failed to terminate protocol.')
        setIsDeleting(false)
      }
    })
  }

  if (isDeleting) {
    return null // Optimistic hide
  }

  return (
    <tr 
      className="group transition-colors hover:bg-white/[0.02]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="py-4 px-4 font-medium sticky left-0 bg-background/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none z-10 transition-colors group-hover:bg-[#1a0f2e]/80">
        <div className="flex items-center justify-between gap-2 mr-2">
          <span className="truncate max-w-[140px] text-white/90 group-hover:text-white transition-colors">{habit.name}</span>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all transform hover:scale-110"
            aria-label={`Terminate ${habit.name}`}
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
          <td key={day} className="text-center py-2 relative">
            {today && (
              <div className="absolute inset-0 bg-primary/5 pointer-events-none border-x border-primary/20" />
            )}
            <div className="flex items-center justify-center h-full">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isFuture || isPending}
                onChange={() => handleToggle(day)}
                title={date}
                className={`w-5 h-5 cursor-pointer ${
                  today ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
                aria-label={`${habit.name} on day ${day}`}
              />
            </div>
          </td>
        )
      })}
      <td className="px-4 py-4 text-right sticky right-0 bg-background/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none z-10 transition-colors group-hover:bg-[#1a0f2e]/80">
        <CompletionRate checkedDates={optimisticDates} year={year} month={month} />
      </td>
    </tr>
  )
}
