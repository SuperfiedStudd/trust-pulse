# Repo Audit — Trust Graph for Subscription Abuse Ops

Audit date: 2026-03-30

## Folder Map

```
trust-pulse/
├── .env                          # ⚠️ Contains real Supabase credentials (must scrub)
├── .env.example                  # ✅ Template with placeholders
├── .gitignore                    # ✅ Covers .env, node_modules, dist
├── README.md                     # ⚠️ Placeholder only — needs rewrite
├── bun.lock / bun.lockb          # Bun lockfiles (redundant alongside package-lock.json)
├── package-lock.json             # npm lockfile
├── package.json                  # ✅ Renamed to trust-graph-abuse-ops
├── components.json               # shadcn/ui config — keep
├── eslint.config.js              # Keep
├── index.html                    # ⚠️ Says "Lovable App" — needs title/meta fix
├── playwright-fixture.ts         # Lovable test fixture — safe to delete
├── playwright.config.ts          # Lovable test config — safe to delete
├── postcss.config.js             # Keep
├── tailwind.config.ts            # Keep
├── tsconfig*.json                # Keep (3 files)
├── vite.config.ts                # Keep (uses lovable-tagger in dev — harmless)
├── vitest.config.ts              # Keep
├── public/
│   ├── favicon.ico               # Keep
│   ├── placeholder.svg           # Lovable placeholder — safe to delete
│   └── robots.txt                # Keep
├── src/
│   ├── App.tsx                   # Main router — keep
│   ├── App.css                   # Keep
│   ├── index.css                 # Keep
│   ├── main.tsx                  # Keep
│   ├── vite-env.d.ts             # Keep
│   ├── components/
│   │   ├── layout/               # AppLayout, AppSidebar, TopNav — keep all
│   │   ├── shared/               # ActionButton, KPICard, Pagination, RiskBadge, StatusBadge — keep all
│   │   ├── trust-graph/          # GraphCanvas, GraphToolbar, InspectorPanel, types — keep all
│   │   ├── ui/                   # 49 shadcn/ui components — keep (standard library)
│   │   └── NavLink.tsx           # Keep
│   ├── data/
│   │   └── mockData.ts           # Types + seeded demo data — keep (load-bearing for UI)
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Keep
│   │   ├── use-toast.ts          # Keep
│   │   ├── usePipelineData.ts    # Pipeline hooks (raw_events, derived_features, score_results) — keep
│   │   └── useSupabaseData.ts    # Core Supabase hooks — keep
│   ├── integrations/supabase/
│   │   ├── client.ts             # ✅ Already fixed to use import.meta.env
│   │   └── types.ts              # Auto-generated DB types — keep
│   ├── lib/
│   │   └── utils.ts              # cn() utility — keep
│   ├── pages/
│   │   ├── Overview.tsx          # Dashboard — keep
│   │   ├── RiskInbox.tsx         # Cluster queue — keep
│   │   ├── TrustGraph.tsx        # Graph visualization — keep
│   │   ├── EntityDetail.tsx      # Investigation view — keep
│   │   ├── Entities.tsx          # Entity browser — keep
│   │   ├── PolicySimulator.tsx   # Policy tuning — keep
│   │   ├── Settings.tsx          # Config — keep
│   │   ├── Index.tsx             # Redirect to Overview — keep
│   │   └── NotFound.tsx          # 404 — keep
│   └── test/
│       ├── example.test.ts       # Placeholder test (expect(true).toBe(true)) — harmless, keep
│       └── setup.ts              # Test setup — keep
└── supabase/
    ├── config.toml               # ✅ Already scrubbed
    ├── functions/
    │   ├── compute-scores/       # Edge function: scoring pipeline — keep
    │   ├── ingest-event/         # Edge function: event ingestion w/ dedupe — keep
    │   └── seed-data/            # Edge function: demo data seeder — keep
    └── migrations/               # 4 SQL migration files — keep
```

## Files Safe to Delete

| File | Reason |
|------|--------|
| `playwright-fixture.ts` | Lovable-specific test fixture, references uninstalled package |
| `playwright.config.ts` | Lovable-specific config, references uninstalled package |
| `public/placeholder.svg` | Lovable default placeholder, not used in app |
| `bun.lock` | Redundant — project uses npm (package-lock.json present) |
| `bun.lockb` | Redundant binary lockfile for Bun |

## Files That Need Manual Review

| File | Issue |
|------|-------|
| `.env` | Still contains real Supabase project ID and anon key — must be scrubbed before commit |
| `index.html` | Title/meta still say "Lovable App" with Lovable OG image URLs — should update |
| `src/data/mockData.ts` | Contains demo data + shared types, used by multiple pages — keep but clarify purpose |
| `vite.config.ts` | References `lovable-tagger` dev plugin — harmless in dev mode only |

## Secret-Risk Findings

| Location | Risk | Status |
|----------|------|--------|
| `.env` | Contains real Supabase URL + anon JWT | ⚠️ Must scrub before public push |
| `src/integrations/supabase/client.ts` | Was hardcoded, now uses `import.meta.env` | ✅ Fixed |
| `supabase/config.toml` | Was real project ID, now placeholder | ✅ Fixed |
| `supabase/functions/*/index.ts` | Use `Deno.env.get()` — safe, runtime-injected | ✅ OK |
| Git history | Prior commits may contain the real secrets | ⚠️ See Security Notes |

## Doc Gaps

- No README beyond placeholder
- No architecture documentation
- No CONTRIBUTING.md (optional for portfolio)
- No LICENSE file (optional — up to user)
- `index.html` title/meta not updated

## Recommended Next Steps

1. Scrub `.env` of real credentials
2. Fix `index.html` title/meta
3. Delete junk files listed above
4. Write README.md
5. Write architecture doc
6. Consider squashing git history to remove secret traces before public push
