'use client'

import { useState, useTransition } from 'react'
import { toggleTodo, deleteTodo } from '@/app/actions'
import { toast } from 'sonner'
import { Trash2, Clock } from 'lucide-react'

export type Todo = {
  id: string
  name: string
  due_date: string
  due_time: string | null
  completed: boolean
}

type Props = {
  todo: Todo
}

export function TodoItem({ todo }: Props) {
  const [isCompleted, setIsCompleted] = useState(todo.completed)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const wasCompleted = isCompleted
    setIsCompleted(!wasCompleted)

    startTransition(async () => {
      try {
        await toggleTodo(todo.id, !wasCompleted)
        if (!wasCompleted) {
          toast.success(`Task Completed: ${todo.name}`)
        }
      } catch {
        setIsCompleted(wasCompleted)
        toast.error('Failed to sync. Please retry.')
      }
    })
  }

  function handleDelete() {
    setIsDeleting(true)
    startTransition(async () => {
      try {
        await deleteTodo(todo.id)
        toast.success('Task terminated.')
      } catch {
        toast.error('Failed to terminate task.')
        setIsDeleting(false)
      }
    })
  }

  if (isDeleting) return null

  // Format time nicely if it exists
  let timeStr = null
  if (todo.due_time) {
    // due_time comes from postgres like "14:30:00"
    const [h, m] = todo.due_time.split(':')
    const d = new Date()
    d.setHours(parseInt(h, 10))
    d.setMinutes(parseInt(m, 10))
    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div 
      className={`relative group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
        isCompleted 
          ? 'bg-secondary/10 border-secondary/30 shadow-[0_0_10px_rgba(var(--secondary),0.1)]' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <div 
        className="flex items-center gap-4 cursor-pointer flex-1"
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
        <div className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-300 ${
          isCompleted 
            ? 'bg-secondary border-secondary shadow-[0_0_8px_rgba(var(--secondary),0.5)]' 
            : 'border-white/20 group-hover:border-white/40'
        }`}>
          {isCompleted && (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-secondary-foreground stroke-current stroke-[3]" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-base font-medium transition-all duration-300 ${
            isCompleted ? 'text-secondary line-through opacity-70' : 'text-white'
          }`}>
            {todo.name}
          </span>
          {timeStr && (
            <span className={`flex items-center text-xs mt-0.5 ${isCompleted ? 'text-secondary/50' : 'text-muted-foreground'}`}>
              <Clock size={12} className="mr-1" />
              {timeStr}
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete()
        }}
        className="opacity-0 group-hover:opacity-100 p-2 ml-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all transform hover:scale-110"
        aria-label={`Delete task ${todo.name}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
