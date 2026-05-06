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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{monthLabel}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 font-medium min-w-[140px]">Habit</th>
              {days.map((day) => (
                <th
                  key={day}
                  className="w-7 text-center text-xs font-normal text-muted-foreground"
                >
                  {day}
                </th>
              ))}
              <th className="pl-4 text-right text-xs font-normal text-muted-foreground min-w-[50px]">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
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
                />
              )
            })}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No habits yet. Add one above.
          </p>
        )}
      </div>
    </div>
  )
}
