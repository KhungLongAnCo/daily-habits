import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateCompletionRate } from './completion'

describe('calculateCompletionRate', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns 0 when no days checked', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    expect(calculateCompletionRate([], 2026, 3)).toBe(0)
  })

  it('returns 100 when all elapsed days are checked', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    const allDays = Array.from({ length: 14 }, (_, i) =>
      `2026-03-${String(i + 1).padStart(2, '0')}`
    )
    expect(calculateCompletionRate(allDays, 2026, 3)).toBe(100)
  })

  it('returns 50 when half of elapsed days are checked', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    const halfDays = Array.from({ length: 7 }, (_, i) =>
      `2026-03-${String(i + 1).padStart(2, '0')}`
    )
    expect(calculateCompletionRate(halfDays, 2026, 3)).toBe(50)
  })

  it('rounds to nearest integer', () => {
    vi.setSystemTime(new Date('2026-03-03'))
    // 1 out of 3 days = 33.33...%
    expect(calculateCompletionRate(['2026-03-01'], 2026, 3)).toBe(33)
  })

  it('returns 0 when elapsed days is 0 (future month)', () => {
    vi.setSystemTime(new Date('2026-03-14'))
    expect(calculateCompletionRate([], 2026, 4)).toBe(0)
  })
})
