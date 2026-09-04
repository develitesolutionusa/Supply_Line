# Operations checklist (B8)

Confirm these before promoting `main` to production.

## Backups

- Open **Supabase → Project Settings → Database → Backups**.
- Pro: point-in-time recovery enabled.
- Free: daily backups retained for at least 7 days.
- Do not use production as a scratch database. Apply schema only via `/supabase/migrations`.

## Staging

- Staging is the Vercel Preview environment for this repo.
- Mirror production services, but keep Stripe in **test mode**.
- Copy `.env.preview.example` into the Preview env (never Production).
- QA the preview URL (catalog, checkout with a test card, admin, webhooks) before promoting `main`.

## Observability

- Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` on Preview and Production.
- Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` so production builds upload source maps.
- Clerk and Stripe webhook failures are logged with `logError` and sent to Sentry.

## Load and integration tests

```bash
npm test
npm run test:integration   # skipped unless STRIPE_SECRET_KEY is sk_test_
npm run db:rls
npm run load:test          # against LOAD_TEST_BASE_URL, default http://localhost:3000
```
