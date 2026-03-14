import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HabitGrid } from '@/components/HabitGrid'
import { AddHabitForm } from '@/components/AddHabitForm'
import { formatDateISO, getDaysInMonth } from '@/lib/utils/dates'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const startOfMonth = formatDateISO(year, month, 1)
  const endOfMonth = formatDateISO(year, month, getDaysInMonth(year, month))

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name')
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, date')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
  ])

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Daily Habits</h1>
        <AddHabitForm />
      </div>
      <HabitGrid
        habits={habits ?? []}
        logs={logs ?? []}
        year={year}
        month={month}
      />
    </main>
  )
}
