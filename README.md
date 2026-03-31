# Trust Graph — Subscription Abuse Ops Console

A working prototype of an abuse operations console for subscription-based platforms. Trust Graph detects, clusters, scores, and surfaces coordinated abuse patterns — trial cycling, refund fraud, promo exploitation, payment method reuse, and device burst signups — so an ops analyst can investigate and act.

Built with React, Supabase, and D3. Designed to demonstrate what a real abuse ops workflow looks like from ingestion to operator action.

---

## Problem Statement

Subscription platforms lose revenue to coordinated abuse: users create multiple accounts to exploit free trials, cycle refunds, stack promotional codes, or share payment methods across fake identities. These patterns are difficult to detect at the individual account level but become visible when you link entities together — shared devices, IPs, payment methods, and behavioral timing.

Most fraud tooling focuses on payment authorization. Trust Graph focuses on the **post-signup, pre-churn** abuse lifecycle that subscription and SaaS platforms face.

## Why This Matters for Stripe/Payment Ops

- **Trial abuse** inflates conversion funnels and wastes onboarding costs
- **Refund cycling** directly erodes revenue and triggers processor risk flags
- **Promo abuse** defeats acquisition economics
- **Dispute escalation** from denied refunds creates chargeback liability
- **Device burst signups** indicate automated farming operations

Trust Graph provides the operator console where these patterns are surfaced, investigated, and actioned.

---

## Core Workflows

### 1. Overview Dashboard
KPI cards showing flagged accounts, total exposure, pending clusters, and refund volume. Trend charts for flagged accounts over time and abuse type breakdown.

### 2. Risk Inbox
Sortable, filterable queue of abuse clusters ranked by risk score. Supports bulk actions (approve, block, review, verify, restrict promo). Each cluster links to a detailed investigation view.

### 3. Entity Investigation (`/entity/:id`)
Deep-dive into a cluster: linked accounts, devices, payment methods, IPs, timeline of events, rule triggers, AI-generated summary, analyst notes, and operator actions. All data is live from Supabase.

### 4. Trust Graph Visualization (`/trust-graph`)
D3 force-directed graph showing entity relationships within a cluster — accounts connected to shared devices, cards, and IPs. Visual encoding by risk level with interactive inspection panel.

### 5. Entities Browser (`/entities`)
Tabbed view across all entity types (accounts, devices, payment methods, IPs) with search and filtering.

### 6. Policy Simulator (`/policy-simulator`)
Adjust scoring weights (trial, refund, promo, payment reuse, device burst) and see projected impact on cluster risk distribution. Trigger full score recomputation via the `compute-scores` edge function.

### 7. Settings (`/settings`)
Configure policy thresholds, scoring weights, review capacity, and trigger pipeline operations.

---

## Architecture Summary

```
External Events (webhook/API)
        │
        ▼
┌─────────────────────┐
│   ingest-event      │  Supabase Edge Function
│   (dedupe, validate)│  → raw_events table
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   compute-scores    │  Supabase Edge Function
│   (feature extract, │  → derived_features table
│    heuristic score) │  → score_results table
└────────┬────────────┘  → pipeline_runs table
         │
         ▼
┌─────────────────────┐
│   React Frontend    │  Reads clusters, accounts, devices,
│   (Vite + shadcn)   │  payment methods, IPs, events, edges
│                     │  via Supabase client + React Query
└─────────────────────┘
```

### Pipeline Tables
| Table | Purpose |
|-------|---------|
| `raw_events` | Ingested events with dedupe keys |
| `derived_features` | Computed features per entity (account age, reuse rates, velocity) |
| `score_results` | Heuristic scores with risk band and top reasons |
| `pipeline_runs` | Audit log of scoring runs |

### Operator Tables
| Table | Purpose |
|-------|---------|
| `clusters` | Abuse clusters with risk scores, exposure, status |
| `accounts` | Linked accounts with trial/refund/payment counts |
| `devices` | Device fingerprints with account linkage |
| `payment_methods` | Cards with reuse and refund metrics |
| `ip_addresses` | IPs with VPN detection and account counts |
| `link_edges` | Graph edges connecting entities |
| `events` | Activity timeline per cluster |
| `rule_triggers` | Fired detection rules per cluster |
| `policy_config` | Scoring weights and thresholds |
| `policy_actions` | Operator action audit trail |
| `analyst_notes` | Investigation notes per cluster |
| `analysts` | Analyst roster |

See [docs/architecture.md](docs/architecture.md) for detailed pipeline documentation.

---

## What Is Real vs. Simulated

### Implemented and Working
- ✅ Event ingestion edge function with dedupe and validation
- ✅ Feature extraction from cluster/account/edge data
- ✅ Weighted heuristic scoring with configurable policy weights
- ✅ Score recomputation triggered from UI
- ✅ Pipeline run auditing
- ✅ Full CRUD operator workflows (approve, block, review, escalate)
- ✅ Realtime UI updates via Supabase channels
- ✅ D3 trust graph visualization
- ✅ Analyst notes and action history
- ✅ Bulk actions on cluster queue

### Simulated / Demo-Grade
- 🟡 Seed data loaded via edge function (not from a live payment processor)
- 🟡 AI summaries are pre-written, not generated by an LLM at runtime
- 🟡 No real Stripe webhook integration (ingestion endpoint is ready but not connected)
- 🟡 No authentication or RBAC
- 🟡 No streaming ingestion (Kafka, Flink) — uses request-based edge functions
- 🟡 Scoring is heuristic, not ML model inference

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm
- A Supabase project (free tier works)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/SuperfiedStudd/trust-pulse.git
cd trust-pulse

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 4. Set up the database
# Apply migrations via Supabase CLI or paste SQL from supabase/migrations/ into the SQL editor

# 5. Seed demo data
# Deploy the seed-data edge function and invoke it, or insert data manually

# 6. Deploy edge functions (optional — needed for score recomputation)
supabase functions deploy compute-scores
supabase functions deploy ingest-event
supabase functions deploy seed-data

# 7. Run the dev server
npm run dev
# Opens at http://localhost:8080
```

### Available Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

---

## Screenshots

<!-- Add screenshots here -->
<!-- ![Overview Dashboard](docs/screenshots/overview.png) -->
<!-- ![Risk Inbox](docs/screenshots/risk-inbox.png) -->
<!-- ![Entity Investigation](docs/screenshots/entity-detail.png) -->
<!-- ![Trust Graph](docs/screenshots/trust-graph.png) -->
<!-- ![Policy Simulator](docs/screenshots/policy-simulator.png) -->

---

## Limitations

- **No auth**: Any visitor can read and write data. This is a portfolio demo, not a production deployment.
- **No streaming**: Ingestion is request-based, not streaming. A production system would use Kafka or similar.
- **Heuristic scoring only**: The scorer uses weighted rules, not ML. The code is structured to swap in model inference later.
- **Pre-seeded data**: The demo runs on synthetic data loaded via the `seed-data` edge function. No live data connectors.
- **Single-tenant**: Hardcoded to `demo_merchant` in policy config. Multi-tenant would require schema changes.
- **No export/egestion**: There is no outbound integration to Stripe, CRMs, or ticketing systems.

## Future Improvements

- Stripe webhook integration for live event ingestion
- ML model scoring (replace heuristic with trained classifier)
- Authentication and RBAC for analyst roles
- Streaming ingestion layer
- Egestion to Stripe (auto-block, restrict trials) and ticketing systems
- Cluster auto-detection via graph algorithms (currently clusters are pre-defined in seed data)
- Time-series anomaly detection on velocity features
- Audit log export and compliance reporting

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, D3
- **Backend**: Supabase (Postgres + Edge Functions + Realtime)
- **State**: React Query (TanStack Query)
- **Build**: Vite + SWC

---

## License

This is a portfolio project. No license specified — contact the author for usage terms.
