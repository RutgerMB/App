import { describe, expect, it } from 'vitest'
import { getPeriodStats, niceMinutesAxis } from '@/lib/analytics'

describe('niceMinutesAxis', () => {
  it('uses even 25-minute steps instead of awkward tops like 90', () => {
    // Old formula: Math.ceil((78 * 1.15) / 5) * 5 === 90 → ticks 25,50,75,90
    const { max, ticks } = niceMinutesAxis(78)
    expect(max).toBe(100)
    expect(ticks).toEqual([25, 50, 75, 100])
  })

  it('keeps a sensible floor for empty / tiny data', () => {
    const { max, ticks } = niceMinutesAxis(0)
    expect(max).toBeGreaterThanOrEqual(20)
    expect(ticks.at(-1)).toBe(max)
    expect(ticks.every((t, i) => i === 0 || t - ticks[i - 1] === ticks[0])).toBe(true)
  })

  it('scales up for larger minute totals with even steps', () => {
    const { max, ticks } = niceMinutesAxis(180)
    expect(max).toBe(250)
    expect(ticks).toEqual([50, 100, 150, 200, 250])
  })
})

describe('getPeriodStats locale', () => {
  it('formats year month shortcuts in the selected app language', () => {
    const sessions = [
      {
        id: '1',
        type: 'pushups',
        reps: 10,
        earnedMinutes: 5,
        completedAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
      },
    ] as Parameters<typeof getPeriodStats>[0]

    const en = getPeriodStats(sessions, 'year', 'en')
    const nl = getPeriodStats(sessions, 'year', 'nl')
    const de = getPeriodStats(sessions, 'year', 'de')

    expect(en.length).toBeGreaterThan(0)
    expect(nl.length).toBe(en.length)

    const enLabels = en.map((d) => d.label).join('|')
    const nlLabels = nl.map((d) => d.label).join('|')
    const deLabels = de.map((d) => d.label).join('|')
    expect(nlLabels).not.toBe(enLabels)
    expect(deLabels).not.toBe(enLabels)

    const janEn = new Date(2024, 0, 1).toLocaleDateString('en-US', { month: 'short' })
    const janNl = new Date(2024, 0, 1).toLocaleDateString('nl-NL', { month: 'short' })
    expect(janEn).not.toBe(janNl)
  })
})
