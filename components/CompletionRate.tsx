import { calculateCompletionRate } from '@/lib/utils/completion'

type Props = {
  checkedDates: string[]
  year: number
  month: number
}

export function CompletionRate({ checkedDates, year, month }: Props) {
  const rate = calculateCompletionRate(checkedDates, year, month)

  let colorClass = 'text-muted-foreground'
  let glowClass = ''
  
  if (rate >= 80) {
    colorClass = 'text-primary'
    glowClass = 'drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]'
  } else if (rate >= 50) {
    colorClass = 'text-secondary'
    glowClass = 'drop-shadow-[0_0_5px_rgba(var(--secondary),0.6)]'
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            rate >= 80 ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]' : 
            rate >= 50 ? 'bg-secondary' : 'bg-muted-foreground'
          }`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums tracking-wider ${colorClass} ${glowClass}`}>
        {rate.toString().padStart(2, '0')}%
      </span>
    </div>
  )
}
