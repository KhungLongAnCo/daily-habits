// All date comparisons use UTC to avoid timezone-dependent test failures.

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayISO(): string {
  const now = new Date()
  return formatDateISO(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate())
}

export function isFutureDate(date: string): boolean {
  return date > todayISO()
}

export function isToday(date: string): boolean {
  return date === todayISO()
}

export function getElapsedDays(year: number, month: number): number {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const currentDay = now.getUTCDate()

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return getDaysInMonth(year, month)
  }

  if (year === currentYear && month === currentMonth) {
    return currentDay
  }

  return 0
}
