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
  isEven: boolean
}

export function HabitRow({ habit, checkedDates, days, year, month, isEven }: Props) {
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
    <tr className={`border-t border-border/30 transition-colors hover:bg-violet-50/40 ${isEven ? 'bg-white/40' : 'bg-white/10'}`}>
      <td className="py-2.5 px-4">
        <HabitName habit={habit} />
      </td>
      {days.map((day) => {
        const date = formatDateISO(year, month, day)
        const isChecked = optimisticDates.includes(date)
        const isFuture = isFutureDate(date)
        const today = isToday(date)

        return (
          <td
            key={day}
            className={`text-center py-2 ${today ? 'bg-primary/5' : ''}`}
          >
            <button
              onClick={() => handleToggle(day)}
              disabled={isFuture || isPending}
              aria-label={`${habit.name} on day ${day}`}
              aria-pressed={isChecked}
              className={`
                w-5 h-5 rounded-full border-2 transition-all duration-150 mx-auto flex items-center justify-center
                ${isChecked
                  ? 'bg-primary border-primary shadow-sm shadow-primary/30'
                  : today
                  ? 'border-primary/50 hover:border-primary hover:bg-primary/10'
                  : isFuture
                  ? 'border-border/30 cursor-not-allowed opacity-30'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                }
                ${today && !isFuture ? 'ring-2 ring-primary/20 ring-offset-1' : ''}
                ${isPending ? 'opacity-60' : ''}
              `}
            >
              {isChecked && (
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 5L3.8 7.5L8.5 2.5" />
                </svg>
              )}
            </button>
          </td>
        )
      })}
      <td className="pl-4 pr-4 text-right">
        <CompletionRate checkedDates={optimisticDates} year={year} month={month} />
      </td>
    </tr>
  )
}
