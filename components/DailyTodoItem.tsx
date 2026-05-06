'use client'

import { useState, useTransition } from 'react'
import { toggleHabitLog } from '@/app/actions'
import { toast } from 'sonner'
import type { Habit } from './HabitGrid'

type Props = {
  habit: Habit
  initialChecked: boolean
  date: string
}

export function DailyTodoItem({ habit, initialChecked, date }: Props) {
  const [isChecked, setIsChecked] = useState(initialChecked)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const wasChecked = isChecked
    
    // Optimistic UI update
    setIsChecked(!wasChecked)

    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, date)
        if (!wasChecked) {
          toast.success(`Completed: ${habit.name}`)
        }
      } catch {
        setIsChecked(wasChecked)
        toast.error('Failed to sync. Please retry.')
      }
    })
  }

  return (
    <div 
      className={`relative group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
        isChecked 
          ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleToggle()
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
          isChecked 
            ? 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.6)]' 
            : 'border-white/20 group-hover:border-white/40'
        }`}>
          {isChecked && (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-foreground stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <span className={`text-lg font-medium transition-all duration-300 ${
          isChecked ? 'text-primary line-through opacity-80' : 'text-white'
        }`}>
          {habit.name}
        </span>
      </div>
      
      {/* Decorative pulse when not checked */}
      {!isChecked && (
        <div className="absolute right-5 w-2 h-2 rounded-full bg-secondary/50 animate-pulse group-hover:bg-secondary transition-colors" />
      )}
    </div>
  )
}
