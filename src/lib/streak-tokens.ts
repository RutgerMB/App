import { localDateString } from '@/lib/dates'

/** Pro streak-restore tokens refill to this cap each local calendar month. */
export const STREAK_RESET_TOKENS_MAX = 5

export function localMonthKey(date: Date = new Date()): string {
  return localDateString(date).slice(0, 7)
}

export function clampStreakResetTokens(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(STREAK_RESET_TOKENS_MAX, Math.floor(value)))
}

/**
 * Pro users get 5/5 on the first day of each local month (when the YYYY-MM key changes).
 * Free users keep a clamped count (typically 0) without monthly refill.
 */
export function refillStreakResetTokensIfNeeded(opts: {
  isPro: boolean
  tokens: number | null | undefined
  tokensMonth: string | null | undefined
  today?: string
}): { tokens: number; tokensMonth: string; refilled: boolean } {
  const month = (opts.today ?? localDateString()).slice(0, 7)
  const current = clampStreakResetTokens(opts.tokens)

  if (!opts.isPro) {
    return { tokens: current, tokensMonth: opts.tokensMonth ?? month, refilled: false }
  }

  if (opts.tokensMonth !== month) {
    return { tokens: STREAK_RESET_TOKENS_MAX, tokensMonth: month, refilled: true }
  }

  return { tokens: current, tokensMonth: month, refilled: false }
}

/** Consume one token; never goes below 0. */
export function consumeStreakResetToken(tokens: number): number {
  return clampStreakResetTokens(tokens - 1)
}
