import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDaysInMonth,
  isFutureDate,
  isToday,
  getElapsedDays,
  formatDateISO,
} from './dates'

describe('getDaysInMonth', () => {
  it('returns 31 for March', () => {
    expect(getDaysInMonth(2026, 3)).toBe(31)
  })
  it('returns 28 for February in a non-leap year', () => {
    expect(getDaysInMonth(2025, 2)).toBe(28)
  })
  it('returns 29 for February in a leap year', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
  })
  it('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 4)).toBe(30)
  })
})

describe('isFutureDate', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns true for a date in the future', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isFutureDate('2026-03-15')).toBe(true)
  })
  it('returns false for today', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isFutureDate('2026-03-14')).toBe(false)
  })
  it('returns false for a past date', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isFutureDate('2026-03-01')).toBe(false)
  })
})

describe('isToday', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns true for today', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isToday('2026-03-14')).toBe(true)
  })
  it('returns false for yesterday', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(isToday('2026-03-13')).toBe(false)
  })
})

describe('getElapsedDays', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns 14 on March 14 for March 2026', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(getElapsedDays(2026, 3)).toBe(14)
  })
  it('returns total days in month when viewing past month', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(getElapsedDays(2026, 2)).toBe(28)
  })
  it('returns 0 for a future month', () => {
    vi.setSystemTime(new Date('2026-03-14T12:00:00Z'))
    expect(getElapsedDays(2026, 4)).toBe(0)
  })
})

describe('formatDateISO', () => {
  it('formats year/month/day into YYYY-MM-DD', () => {
    expect(formatDateISO(2026, 3, 5)).toBe('2026-03-05')
    expect(formatDateISO(2026, 12, 31)).toBe('2026-12-31')
  })
})
