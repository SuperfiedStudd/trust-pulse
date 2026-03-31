# Security Notes

## Environment Variables Required

| Variable | Description | Where Used |
|----------|-------------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) | Frontend client (`src/integrations/supabase/client.ts`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Frontend client |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Reference only |
| `SUPABASE_URL` | Supabase URL (auto-injected in Edge Functions) | `supabase/functions/*/index.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (auto-injected in Edge Functions) | `supabase/functions/*/index.ts` |

## What Must Never Be Committed

- `.env` — contains real credentials for your Supabase instance
- Any file containing `SUPABASE_SERVICE_ROLE_KEY` values
- Any JWT tokens or anon keys specific to your project
- Supabase project ID in `supabase/config.toml` (already templated)

## Current Security Status

| Item | Status |
|------|--------|
| `.gitignore` covers `.env` | ✅ Yes |
| `client.ts` uses `import.meta.env` | ✅ Yes (no hardcoded secrets) |
| `supabase/config.toml` scrubbed | ✅ Yes |
| Edge Functions use `Deno.env.get()` | ✅ Yes (runtime-injected, never committed) |
| `.env` file scrubbed locally | ✅ Yes |

## Git History Warning

Previous commits in this repo's history may still contain the original hardcoded Supabase URL and anon key. Before making this repo public:

**Option A (recommended for portfolio):** Create a fresh repo and push a single squashed commit.
```bash
# From repo root
git checkout --orphan clean-main
git add -A
git commit -m "Initial public release"
git branch -D main
git branch -m main
git push -f origin main
```

**Option B:** Use `git filter-repo` or BFG Repo-Cleaner to rewrite history.

## Supabase Dashboard Cleanup

If you previously used the hardcoded anon key publicly:
1. Go to your Supabase dashboard → Settings → API
2. Rotate the anon key
3. Update your local `.env` with the new key
4. This invalidates the old key that may exist in git history

## Frontend Key Exposure Note

The `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) is intentionally public — it ships to the browser in all Supabase apps. Security is enforced by Row Level Security (RLS) policies on the database, not by key secrecy. However, for portfolio repos, it's still best practice to template it out so reviewers don't accidentally interact with your live database.
