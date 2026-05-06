import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HabitGrid } from '@/components/HabitGrid'
import { AddHabitForm } from '@/components/AddHabitForm'
import { formatDateISO, getDaysInMonth } from '@/lib/utils/dates'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const startOfMonth = formatDateISO(year, month, 1)
  const endOfMonth = formatDateISO(year, month, getDaysInMonth(year, month))

  const [{ data: habits }, { data: logs }, { data: todosData }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name')
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, date')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
    supabase
      .from('todos')
      .select('id, name, due_date, due_time, completed')
      .gte('due_date', startOfMonth)
      .lte('due_date', endOfMonth)
      .order('due_time', { ascending: true, nullsFirst: false }),
  ])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Abstract Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-20 animate-in fade-in duration-700">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest text-primary uppercase shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              Operational Status: Nominal
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-black text-gradient-primary tracking-tight">
              Habit Protocol
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Synchronizing daily behavioral patterns.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              href="/todo"
              className="flex z-50 items-center justify-center h-12 px-5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20 transition-all font-bold tracking-wide"
            >
              Today's View
            </Link>
            <AddHabitForm />
          </div>
        </header>

        <div className="glass rounded-3xl p-1 md:p-6 overflow-hidden">
          <HabitGrid
            habits={habits ?? []}
            logs={logs ?? []}
            todos={todosData ?? []}
            year={year}
            month={month}
          />
        </div>
      </main>
    </div>
  )
}
