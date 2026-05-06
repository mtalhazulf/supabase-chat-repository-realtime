# Realtime Chat — Multi-tenant Support Platform

Next.js 15 + Bun + Supabase Realtime + Prisma + OpenRouter.

A complete multi-tenant chat platform with an embeddable widget. Each workspace has
its own conversations, branding, AI configuration, and members.

## Features

- **Multi-tenant** workspaces with row-level security
- **Realtime** chat backed by Supabase
  - Admin agents → `postgres_changes` (RLS-aware)
  - Anonymous visitors → broadcast channels
- **Three message types**: `human` (agent), `lead` (visitor), `ai`
- **Embeddable widget** — drop-in `<script>` tag for any website
- **Customizable** chatbot — colors, position, welcome, lead capture, AI prompt
- **OpenRouter** AI auto-replies (any supported model)
- **Prisma** for the data model + raw SQL for RLS/triggers/realtime

## Stack

| Layer       | Tool                                        |
| ----------- | ------------------------------------------- |
| Runtime     | Bun                                         |
| Framework   | Next.js 15 (App Router, Turbopack)          |
| UI          | Tailwind CSS, lucide-react                  |
| Auth + DB   | Supabase (auth, Postgres, Realtime, RLS)    |
| Migrations  | Prisma (schema), raw SQL (RLS/triggers)     |
| AI          | OpenRouter                                  |

## Setup

```bash
bun install

# 1. Configure env
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#         SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL,
#         OPENROUTER_API_KEY

# 2. Push schema and apply RLS/triggers/realtime
bun run db:setup           # = db:push + db:policies

# 3. Start dev server
bun run dev
```

Visit http://localhost:3000 and sign up.

## Embedding the chatbot

After creating a workspace, copy the snippet from the **Embed** tab:

```html
<script async src="https://your-app.com/embed.js" data-tenant="TENANT_UUID"></script>
```

Or iframe-only:

```html
<iframe src="https://your-app.com/widget/TENANT_UUID" style="..."></iframe>
```

## How realtime works

| Listener           | Mechanism             | Why                                       |
| ------------------ | --------------------- | ----------------------------------------- |
| Admin inbox        | `postgres_changes`    | Authenticated members satisfy RLS         |
| Admin chat thread  | `postgres_changes`    | Same                                      |
| Visitor widget     | Supabase **broadcast** | Anon clients can't receive RLS-gated rows |

Server routes (`/api/widget/send`, `/api/agent/send`) broadcast the inserted message
on the `conv:{conversationId}` channel after the DB insert.

## Architectural notes

- **Prisma owns schema.** Tables, columns, indexes, enums.
- **`supabase/sql/policies.sql` owns the rest.** RLS policies, helper functions,
  triggers, FKs to `auth.users`, and the realtime publication. Idempotent —
  re-run after any schema change with `bun run db:policies`.
- **App reads/writes via Supabase JS** (so RLS is enforced and realtime works
  natively). Prisma is used at runtime only for trusted server tasks if needed.

## Project layout

```
prisma/schema.prisma             # data model
supabase/sql/policies.sql        # RLS + triggers + realtime publication
scripts/apply-policies.ts        # `bun run db:policies`
src/middleware.ts                # Supabase session refresh + auth gate
src/lib/supabase/{browser,server,admin}.ts
src/lib/broadcast.ts             # server-side broadcasts to anon listeners
src/lib/openrouter.ts            # OpenRouter chat completions
src/app/(auth)/                  # login + signup
src/app/dashboard/               # admin panel (multi-tenant)
src/app/widget/[tenantId]/       # embeddable widget UI
src/app/api/widget/              # public widget APIs
src/app/api/agent/send/          # authenticated agent send
src/app/embed.js/                # one-line `<script>` loader
```
