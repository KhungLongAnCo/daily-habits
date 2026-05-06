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

export type Todo = {
  id: string
  name: string
  due_date: string
  due_time: string | null
  completed: boolean
}

type Props = {
  habits: Habit[]
  logs: HabitLog[]
  todos: Todo[]
  year: number
  month: number
}

export function HabitGrid({ habits, logs, todos, year, month }: Props) {
  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthLabel = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-heading font-bold text-white tracking-wide">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Live Sync</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <table className="w-full text-sm border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="text-left py-4 px-4 font-semibold text-white/70 min-w-[180px] sticky left-0 bg-background/80 backdrop-blur-md z-10 border-b border-white/5">
                Directive
              </th>
              {days.map((day) => {
                const isWeekend = new Date(year, month - 1, day).getDay() % 6 === 0
                const dateStr = formatDateISO(year, month, day)
                const dayTodos = todos.filter(t => t.due_date === dateStr)
                const hasTodos = dayTodos.length > 0

                return (
                  <th
                    key={day}
                    className={`w-10 text-center py-4 text-xs font-semibold border-b border-white/5 relative group ${
                      isWeekend ? 'text-primary/70' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center cursor-help">
                      <span>{day}</span>
                      {hasTodos && (
                        <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(var(--secondary),1)]" />
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    {hasTodos && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 p-3 rounded-xl glass-panel opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none translate-y-2 group-hover:translate-y-0 text-left">
                        <div className="text-[10px] uppercase tracking-widest text-secondary mb-2 font-bold">Tasks: {dayTodos.length}</div>
                        <ul className="space-y-1.5">
                          {dayTodos.slice(0, 3).map(todo => (
                            <li key={todo.id} className={`text-xs truncate ${todo.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                              <span className="mr-1 opacity-50 font-mono">{todo.due_time ? todo.due_time.substring(0, 5) : '•'}</span>
                              {todo.name}
                            </li>
                          ))}
                          {dayTodos.length > 3 && (
                            <li className="text-[10px] text-white/40 mt-1">+{dayTodos.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </th>
                )
              })}
              <th className="px-4 py-4 text-right text-xs font-semibold text-white/70 min-w-[80px] border-b border-white/5 sticky right-0 bg-background/80 backdrop-blur-md z-10">
                Integrity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {habits.map((habit, index) => {
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
                  index={index}
                />
              )
            })}
          </tbody>
        </table>
        
        {habits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-white">No protocols defined</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Initialize your first habit to begin tracking your behavioral metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
