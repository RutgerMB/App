# RepLock Economy — Pricing Recommendation

**Scope:** Mobile-only (iOS + Google Play). Web is dev/testing only.  
**Currency:** EUR primary (stores localize automatically).

## Summary

| Plan | Price | Effective/mo | Action |
|------|-------|--------------|--------|
| Monthly | €7.99/mo | €7.99 | **Keep** |
| Yearly | €59.99/yr | €5.00 | **Add — lead paywall** |

37% annual discount. Savings: €35.89/year vs 12× monthly.

## Product IDs

### Apple App Store

| Product | ID | Price |
|---------|-----|-------|
| Pro Monthly | `replock_pro_monthly` | €7.99 |
| Pro Yearly | `replock_pro_yearly` | €59.99 |

Subscription group: `replock_pro`

### Google Play

| Subscription | Base plan | Price |
|--------------|-----------|-------|
| `replock_pro` | `monthly-plan` | €7.99 |
| `replock_pro` | `yearly-plan` | €59.99 |

## RevenueCat mapping

- **Entitlement:** `pro`
- **Offering:** `default` — annual package default, monthly secondary
- **Webhook:** `POST /api/webhooks/revenuecat`

## Free / trial (keep, tune UX)

- 7-day trial, 3 apps — keep
- 1 app free after trial — keep
- Add day-5 urgency banner and annual pre-selected on paywall
- Optional launch intro: €49.99 first year (48h win-back only)

Full analysis: see `.cursor/agents/economy.md`
