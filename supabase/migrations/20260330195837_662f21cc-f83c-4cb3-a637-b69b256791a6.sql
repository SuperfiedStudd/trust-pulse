-- Raw event ingestion table
CREATE TABLE public.raw_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  entity_type text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  cluster_id text,
  source_system text NOT NULL DEFAULT 'internal',
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingestion_status text NOT NULL DEFAULT 'pending',
  dedupe_key text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX raw_events_dedupe_key_idx ON public.raw_events (dedupe_key) WHERE dedupe_key != '';

ALTER TABLE public.raw_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read raw_events" ON public.raw_events FOR SELECT TO public USING (true);
CREATE POLICY "Public insert raw_events" ON public.raw_events FOR INSERT TO public WITH CHECK (true);

-- Derived features per entity
CREATE TABLE public.derived_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  cluster_id text,
  account_age_days integer NOT NULL DEFAULT 0,
  linked_accounts_count integer NOT NULL DEFAULT 0,
  unique_payment_methods integer NOT NULL DEFAULT 0,
  unique_devices integer NOT NULL DEFAULT 0,
  unique_ips integer NOT NULL DEFAULT 0,
  promo_redemptions_30d integer NOT NULL DEFAULT 0,
  refunds_30d integer NOT NULL DEFAULT 0,
  disputes_90d integer NOT NULL DEFAULT 0,
  refund_rate_90d numeric NOT NULL DEFAULT 0,
  payment_method_reuse integer NOT NULL DEFAULT 0,
  device_reuse integer NOT NULL DEFAULT 0,
  ip_reuse integer NOT NULL DEFAULT 0,
  velocity_signups_24h integer NOT NULL DEFAULT 0,
  velocity_refunds_7d integer NOT NULL DEFAULT 0,
  latest_event_at timestamptz,
  prior_actions_count integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

ALTER TABLE public.derived_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read derived_features" ON public.derived_features FOR SELECT TO public USING (true);
CREATE POLICY "Public upsert derived_features" ON public.derived_features FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update derived_features" ON public.derived_features FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Score results
CREATE TABLE public.score_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  risk_band text NOT NULL DEFAULT 'low',
  top_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  score_version text NOT NULL DEFAULT 'v1.0',
  scored_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, score_version)
);

ALTER TABLE public.score_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read score_results" ON public.score_results FOR SELECT TO public USING (true);
CREATE POLICY "Public upsert score_results" ON public.score_results FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update score_results" ON public.score_results FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Pipeline runs log
CREATE TABLE public.pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  events_processed integer NOT NULL DEFAULT 0,
  events_failed integer NOT NULL DEFAULT 0,
  entities_scored integer NOT NULL DEFAULT 0,
  score_version text NOT NULL DEFAULT 'v1.0',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text
);

ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pipeline_runs" ON public.pipeline_runs FOR SELECT TO public USING (true);
CREATE POLICY "Public insert pipeline_runs" ON public.pipeline_runs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update pipeline_runs" ON public.pipeline_runs FOR UPDATE TO public USING (true) WITH CHECK (true);