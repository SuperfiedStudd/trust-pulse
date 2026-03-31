# Architecture — Trust Graph Abuse Ops

## System Overview

Trust Graph follows a three-stage pipeline architecture:

```
Raw Events → Derived Features → Score Results → Operator UI
```

Each stage is implemented as a separate concern with its own data table and processing logic.

---

## Stage 1: Event Ingestion

**Edge Function:** `supabase/functions/ingest-event/index.ts`
**Target Table:** `raw_events`

### What It Does
- Accepts single events or batches via HTTP POST
- Validates required fields (`event_type`, `entity_type`, `entity_id`)
- Generates or accepts a `dedupe_key` to prevent duplicate processing
- Handles dedupe collisions gracefully (unique constraint violation = success)
- Records `source_system` and `payload_json` for audit

### Supported Event Types
```
signup_created, free_trial_started, promo_redeemed,
payment_method_attached, refund_requested, refund_completed,
dispute_opened, login_attempt, device_seen, ip_seen,
account_link_detected, payment_completed, payment_declined
```

### What It Does NOT Do
- Does not trigger scoring automatically (scoring is a separate invocation)
- Does not create or update clusters (clustering is pre-defined in seed data)
- Does not connect to external webhooks (endpoint is ready, connector is not built)

---

## Stage 2: Feature Extraction + Scoring

**Edge Function:** `supabase/functions/compute-scores/index.ts`
**Target Tables:** `derived_features`, `score_results`, `pipeline_runs`

### What It Does

1. **Loads policy config** from `policy_config` table (weights per abuse type)
2. **Iterates all clusters** and their related accounts, events, edges
3. **Extracts derived features** per cluster:

| Feature | Source |
|---------|--------|
| `linked_accounts_count` | Count of accounts in cluster |
| `unique_payment_methods` | Distinct PMs from link_edges |
| `unique_devices` | Distinct devices from link_edges |
| `unique_ips` | Distinct IPs from link_edges |
| `promo_redemptions_30d` | Promo events in last 30 days |
| `refunds_30d` | Refund events in last 30 days |
| `disputes_90d` | Dispute events in last 90 days |
| `refund_rate_90d` | Refunds / (payments + refunds) in 90 days |
| `payment_method_reuse` | Accounts per payment method |
| `device_reuse` | Accounts per device |
| `ip_reuse` | Accounts per IP |
| `velocity_signups_24h` | Trial signups in last 24 hours |
| `velocity_refunds_7d` | Refunds in last 7 days |
| `prior_actions_count` | Previous operator actions on this cluster |

4. **Computes a weighted heuristic score** (0–100):
   - Base score from cluster size (capped at 15)
   - Signal contributions from each triggered rule
   - Weights from `policy_config` multiply signal contributions
   - Risk band: `critical` (80+), `high` (60+), `medium` (35+), `low` (<35)
   - Top 5 reasons sorted by contribution

5. **Upserts results** to `derived_features` and `score_results`
6. **Logs the pipeline run** with event counts and timing

### Score Version
Current version: `v1.0-heuristic`
The scorer is structured so that ML model inference can replace the heuristic function without changing the pipeline contract.

---

## Stage 3: Operator UI

**Stack:** React + React Query + Supabase Client

### Page Map

| Route | Page | What It Does |
|-------|------|-------------|
| `/` | Overview | KPI dashboard: flagged accounts, exposure, pending clusters, refund totals. Trend charts and abuse breakdown. |
| `/risk-inbox` | Risk Inbox | Sortable/filterable cluster queue. Bulk actions (approve, block, review, verify, restrict). |
| `/entity/:id` | Entity Detail | Deep investigation: cluster summary, linked entities, timeline, rule triggers, AI summary, analyst notes, action buttons. |
| `/entities` | Entities | Tabbed browser for accounts, devices, payment methods, IPs. |
| `/trust-graph` | Trust Graph | D3 force-directed graph of entity relationships. Interactive inspection panel. |
| `/policy-simulator` | Policy Simulator | Adjust scoring weights, preview risk distribution shift, trigger score recomputation. |
| `/settings` | Settings | Policy config, review capacity, pipeline controls. |

### Data Flow in UI

```
Supabase DB
    │
    ├── useSupabaseData hooks (clusters, accounts, devices, etc.)
    ├── usePipelineData hooks (raw_events, derived_features, scores)
    └── useRealtimeSync (Supabase channels → query invalidation)
         │
         ▼
    React Query cache
         │
         ▼
    Page components render
```

---

## Settings → Policy Simulator → Recompute Scores Flow

1. **Settings page** (`/settings`): Operator adjusts scoring weights (trial_weight, refund_weight, promo_weight, payment_reuse_weight, device_burst_weight) and review capacity. Saved to `policy_config` table.

2. **Policy Simulator** (`/policy-simulator`): Shows current weight configuration and projected impact on cluster risk distribution. Operator can preview changes before committing.

3. **Recompute Scores**: Operator triggers the `compute-scores` edge function. The function:
   - Reads updated weights from `policy_config`
   - Recomputes all derived features and scores
   - Writes results to `derived_features` and `score_results`
   - Logs the run to `pipeline_runs`
   - UI auto-refreshes via query invalidation

---

## What Ingestion Does

The `ingest-event` function is a real, working HTTP endpoint that:
- Accepts structured events matching the subscription abuse domain
- Deduplicates using a composite key or user-supplied `dedupe_key`
- Stores raw events for downstream processing
- Returns processed/failed counts

It is designed to receive webhooks from Stripe, payment processors, or internal event buses.

## What Egestion Does NOT Yet Do

There is no outbound integration. The system does not:
- Push block/restrict actions back to Stripe
- Create tickets in Jira/Zendesk
- Send alerts to Slack/PagerDuty
- Export data to data warehouses
- Trigger automated enforcement

All operator actions (approve, block, review, escalate) are recorded in `policy_actions` but do not propagate to external systems.

## What Is Intentionally Out of Scope

| Capability | Reason |
|-----------|--------|
| Authentication / RBAC | Portfolio demo — add when deploying for real |
| Streaming ingestion (Kafka/Flink) | Would require infrastructure beyond Supabase |
| ML model training/inference | Scorer is structured for it but uses heuristics |
| Automated cluster detection | Clusters are pre-defined in seed data |
| Multi-tenant support | Hardcoded to `demo_merchant` |
| Production monitoring / alerting | Not appropriate for demo scope |
