import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyTodoItem } from '@/components/DailyTodoItem'
import { todayISO } from '@/lib/utils/dates'
import Link from 'next/link'

export default async function TodoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = todayISO()

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name')
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('date', today),
  ])

  const safeHabits = habits ?? []
  const safeLogs = logs ?? []
  const completedHabitIds = new Set(safeLogs.map((l) => l.habit_id))

  // Sort habits so unchecked are at top
  const sortedHabits = [...safeHabits].sort((a, b) => {
    const aChecked = completedHabitIds.has(a.id)
    const bChecked = completedHabitIds.has(b.id)
    if (aChecked === bChecked) return 0
    return aChecked ? 1 : -1
  })

  // Format today's date nicely
  const dateObj = new Date()
  const displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const progress = safeHabits.length > 0 
    ? Math.round((safeLogs.length / safeHabits.length) * 100) 
    : 0

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center pt-20 px-4 pb-12">
      {/* Abstract Glowing Orbs */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="mb-12 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest text-secondary uppercase shadow-[0_0_15px_rgba(var(--secondary),0.1)]">
            Daily Directives
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tight mb-3">
            {displayDate}
          </h1>
          <p className="text-muted-foreground text-lg">
            Focus on today's protocols.
          </p>
          
          <div className="mt-8 mb-4 flex justify-between text-sm font-semibold text-white/70 px-1">
            <span>Overall Integrity</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <div className="space-y-4">
          {sortedHabits.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No protocols initialized</h2>
              <p className="text-muted-foreground mb-6">Switch to the main dashboard to establish your habits.</p>
              <Link 
                href="/"
                className="px-6 py-3 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 transition-all font-semibold"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            sortedHabits.map((habit, idx) => (
              <div 
                key={habit.id} 
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
              >
                <DailyTodoItem 
                  habit={habit} 
                  initialChecked={completedHabitIds.has(habit.id)} 
                  date={today} 
                />
              </div>
            ))
          )}
        </div>
        
        {sortedHabits.length > 0 && (
          <div className="mt-12 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-white transition-colors group"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Return to Full Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
