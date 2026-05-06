import { getElapsedDays } from './dates'

export function calculateCompletionRate(
  checkedDates: string[],
  year: number,
  month: number
): number {
  const elapsed = getElapsedDays(year, month)
  if (elapsed === 0) return 0

  // Only count dates that fall within the given year/month
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  const inMonth = checkedDates.filter((d) => d.startsWith(prefix))

  return Math.round((inMonth.length / elapsed) * 100)
}
