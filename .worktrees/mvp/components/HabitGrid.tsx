import { HabitRow } from './HabitRow'
import { formatDateISO, getDaysInMonth, isToday, isFutureDate } from '@/lib/utils/dates'

export type Habit = {
  id: string
  name: string
}

export type HabitLog = {
  habit_id: string
  date: string
}

type Props = {
  habits: Habit[]
  logs: HabitLog[]
  year: number
  month: number
}

export function HabitGrid({ habits, logs, year, month }: Props) {
  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthLabel = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">{monthLabel}</h2>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {habits.length} habit{habits.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-linear-to-r from-violet-50/80 to-indigo-50/80 border-b border-border/50">
                <th className="text-left py-3 px-4 font-semibold text-foreground min-w-[160px]">
                  Habit
                </th>
                {days.map((day) => {
                  const date = formatDateISO(year, month, day)
                  const todayCol = isToday(date)
                  const futureCol = isFutureDate(date)
                  return (
                    <th
                      key={day}
                      className={`w-7 text-center text-xs font-medium py-3 ${
                        todayCol
                          ? 'text-primary font-bold'
                          : futureCol
                          ? 'text-muted-foreground/40'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {day}
                    </th>
                  )
                })}
                <th className="pl-4 pr-4 text-right text-xs font-semibold text-muted-foreground min-w-[60px] py-3">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody>
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
                    isEven={index % 2 === 0}
                  />
                )
              })}
            </tbody>
          </table>

          {habits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <p className="text-base font-medium text-foreground">No habits yet</p>
              <p className="text-sm text-muted-foreground">Click &ldquo;Add Habit&rdquo; to start tracking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
