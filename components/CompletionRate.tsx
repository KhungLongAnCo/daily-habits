// No 'use client' needed — pure display component used inside Client Component
import { calculateCompletionRate } from '@/lib/utils/completion'

type Props = {
  checkedDates: string[]
  year: number
  month: number
}

export function CompletionRate({ checkedDates, year, month }: Props) {
  const rate = calculateCompletionRate(checkedDates, year, month)

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
        rate >= 80
          ? 'bg-emerald-100 text-emerald-700'
          : rate >= 50
          ? 'bg-amber-100 text-amber-700'
          : rate > 0
          ? 'bg-violet-100 text-violet-600'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {rate}%
    </span>
  )
}
