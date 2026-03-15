import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HabitGrid } from '@/components/HabitGrid'
import { AddHabitForm } from '@/components/AddHabitForm'
import { UserMenu } from '@/components/UserMenu'
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
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-background to-indigo-50">
      <header className="border-b border-border/50 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">✦</span>
            </div>
            <h1 className="text-xl font-bold bg-linear-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              Daily Habits
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu email={user.email ?? undefined} />
            <AddHabitForm />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <HabitGrid
          habits={habits ?? []}
          logs={logs ?? []}
          year={year}
          month={month}
        />
      </main>
    </div>
  )
}
