# SupplyLine

Wholesale storefront for case-priced business orders. Built with Next.js App Router, TypeScript, Tailwind CSS, and Clerk.

## Local development

```bash
npm run dev
```

Clerk keys live in `.env.local` (created by `clerk init`). Copy `.env.example` if you need to recreate the file.

```bash
npm test
npm run test:integration
npm run lighthouse
```

Preview/staging env vars: `.env.preview.example`. Backup and promote checklist: [docs/operations.md](./docs/operations.md).

## Routes

Public: `/`, `/catalog`, `/products/[sku]`, `/cart`, `/quick-order`, `/reorder`, `/sign-in`, `/sign-up`

Signed-in: `/checkout`, `/account`, `/account/orders`, `/admin`, `/create-organization`

See [AGENTS.md](./AGENTS.md) for the full phased roadmap.
