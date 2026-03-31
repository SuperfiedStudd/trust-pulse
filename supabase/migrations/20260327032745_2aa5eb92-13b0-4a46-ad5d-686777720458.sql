
-- Analysts
CREATE TABLE public.analysts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  cases_count integer NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clusters
CREATE TABLE public.clusters (
  id text PRIMARY KEY,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  linked_accounts integer NOT NULL DEFAULT 0,
  exposure numeric NOT NULL DEFAULT 0,
  abuse_type text NOT NULL DEFAULT 'trial_abuse',
  top_abuse_reason text NOT NULL DEFAULT '',
  recommended_action text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  last_activity text NOT NULL DEFAULT '',
  trial_signups integer NOT NULL DEFAULT 0,
  refunds integer NOT NULL DEFAULT 0,
  payment_attempts integer NOT NULL DEFAULT 0,
  disputes integer NOT NULL DEFAULT 0,
  ai_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Accounts
CREATE TABLE public.accounts (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  cluster_id text REFERENCES public.clusters(id),
  risk_level text NOT NULL DEFAULT 'low',
  trial_count integer NOT NULL DEFAULT 0,
  refund_count integer NOT NULL DEFAULT 0,
  payment_count integer NOT NULL DEFAULT 0,
  last_activity text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Devices
CREATE TABLE public.devices (
  id text PRIMARY KEY,
  fingerprint text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Desktop',
  os text NOT NULL DEFAULT '',
  browser text NOT NULL DEFAULT '',
  account_count integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  last_seen text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment Methods
CREATE TABLE public.payment_methods (
  id text PRIMARY KEY,
  type text NOT NULL DEFAULT 'credit',
  last4 text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  account_count integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  total_transactions integer NOT NULL DEFAULT 0,
  total_refunds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- IP Addresses
CREATE TABLE public.ip_addresses (
  id text PRIMARY KEY,
  address text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  account_count integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  is_vpn boolean NOT NULL DEFAULT false,
  last_seen text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Link Edges (graph relationships)
CREATE TABLE public.link_edges (
  id text PRIMARY KEY,
  source_id text NOT NULL,
  target_id text NOT NULL,
  edge_type text NOT NULL,
  label text NOT NULL DEFAULT '',
  cluster_id text REFERENCES public.clusters(id),
  weight numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Events (unified timeline)
CREATE TABLE public.events (
  id text PRIMARY KEY,
  cluster_id text REFERENCES public.clusters(id),
  account_id text,
  event_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  risk_level text,
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rule Triggers
CREATE TABLE public.rule_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text REFERENCES public.clusters(id) NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Analyst Notes
CREATE TABLE public.analyst_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text REFERENCES public.clusters(id) NOT NULL,
  analyst_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: allow public read for portfolio demo
CREATE POLICY "Public read clusters" ON public.clusters FOR SELECT USING (true);
CREATE POLICY "Public read accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Public read devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Public read payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Public read ip_addresses" ON public.ip_addresses FOR SELECT USING (true);
CREATE POLICY "Public read link_edges" ON public.link_edges FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read rule_triggers" ON public.rule_triggers FOR SELECT USING (true);
CREATE POLICY "Public read analyst_notes" ON public.analyst_notes FOR SELECT USING (true);
CREATE POLICY "Public read analysts" ON public.analysts FOR SELECT USING (true);
CREATE POLICY "Public insert analyst_notes" ON public.analyst_notes FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_accounts_cluster ON public.accounts(cluster_id);
CREATE INDEX idx_link_edges_cluster ON public.link_edges(cluster_id);
CREATE INDEX idx_events_cluster ON public.events(cluster_id);
CREATE INDEX idx_rule_triggers_cluster ON public.rule_triggers(cluster_id);
CREATE INDEX idx_analyst_notes_cluster ON public.analyst_notes(cluster_id);
