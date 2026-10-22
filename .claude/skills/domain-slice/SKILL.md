---
name: domain-slice
description: Build a new feature end to end in this project's shape (lib/<feature> domain + port + Supabase adapter, Zod validation, authenticated API routes, admin page, tests), modelled on the site alerts feature. Use when adding a new kind of data the admin or cashier manages.
disable-model-invocation: true
argument-hint: "<feature name and what it does>"
---

# New feature: $ARGUMENTS

Every feature in this app has the same shape. The site alerts feature is the reference: read its files before writing, and copy their structure, naming and comment style, not just their ideas.

| Layer | Reference file | New file |
| --- | --- | --- |
| Business constants (AGENTS.md § 7) | `lib/alerts/config.ts` | `lib/<feature>/config.ts` |
| Domain types | `lib/alerts/types.ts` | `lib/<feature>/types.ts` |
| Port | `lib/alerts/ports.ts` | `lib/<feature>/ports.ts` |
| Zod schemas, French messages | `lib/alerts/validation.ts` | `lib/<feature>/validation.ts` |
| Service (repo injected, default Supabase) | `lib/alerts/service.ts` | `lib/<feature>/service.ts` |
| Supabase adapter | `lib/alerts/adapters/supabase-alert-repository.ts` | `lib/<feature>/adapters/supabase-<feature>-repository.ts` |
| List + create routes | `app/api/admin/alerts/route.ts` | `app/api/admin/<feature>/route.ts` |
| Item routes | `app/api/admin/alerts/[id]/route.ts` | `app/api/admin/<feature>/[id]/route.ts` |
| Admin page (server component) | `app/admin/alerts/page.tsx` | `app/admin/<feature>/page.tsx` |
| Client manager | `components/admin/alerts/AlertsManager.tsx` | `components/admin/<feature>/<Feature>Manager.tsx` |
| Navigation entry | `components/ui/navigation.ts` | same file |
| Tests (in-memory repository) | `tests/alerts/alerts.test.ts` | `tests/<feature>/<feature>.test.ts` |
| SQL table | `supabase/site_alerts.sql` | use `/db-script` |

## Rules the reference already follows (keep them)

- **Layers**: Supabase is called only from the adapter. The service takes the port as its last parameter (`repo = defaultRepo`) so tests pass an in-memory one. No Next.js or Supabase import in `types.ts`, `ports.ts`, `validation.ts` or the domain logic.
- **Routes**: `export const dynamic = "force-dynamic"`. First line of every handler: `const auth = await requireAuth([...roles])` from `@/lib/loyalty/api-auth`, then `if (!auth.authorized) return auth.response;`. Admin features take `["ADMIN"]`; loyalty operations `["ADMIN", "CASHIER"]`.
- **Validation**: every body and every `[id]` goes through a Zod schema (`z.string().uuid(...)` for ids) before the service; failures return `400` with `{ error: "VALIDATION_ERROR", message, field? }`.
- **Errors**: unexpected failures are logged with the route name (`[POST /api/admin/<feature>]`) and return `500` with a stable `error` code and a French `message`. A missing row returns `404` with `NOT_FOUND`.
- **Pagination**: list routes read `parsePageParams` from `@/lib/loyalty/pagination` with the page sizes from `config.ts`; the adapter uses `.range()` and `{ count: "exact" }`. No query without a limit (AGENTS.md § 6).
- **Constants** in `config.ts` with a doc comment each; labels shown to users in French.
- **UI**: composes the primitives in `components/ui/` and theme tokens only (ESLint blocks raw colors and viewport units); 44px touch targets; destructive actions confirmed with the existing confirm dialog.
- **Public reads that must never break the site** catch and log, then return an empty result (see `getBannerAlerts`).

## Order

1. SQL script with `/db-script` (the table must exist before the code is deployed).
2. `config.ts`, `types.ts`, `ports.ts`, `validation.ts`, then tests for the validation and service with an in-memory repository.
3. Service, adapter, routes.
4. Page, manager component, navigation entry.
5. Check: `npm run lint`, `npx vitest run tests/<feature>`, then `npx tsc --noEmit -p .` on its own (it needs a lot of memory; do not run it in parallel with ESLint).

Finish by listing the files created, the SQL script to apply before deploying, and anything left for the user to test in the browser.
