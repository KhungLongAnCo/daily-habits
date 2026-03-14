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
      className={`text-xs font-medium tabular-nums ${
        rate >= 80
          ? 'text-green-600'
          : rate >= 50
          ? 'text-yellow-600'
          : 'text-muted-foreground'
      }`}
    >
      {rate}%
    </span>
  )
}
