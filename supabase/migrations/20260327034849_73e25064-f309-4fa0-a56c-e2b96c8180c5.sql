-- policy_actions table for tracking all enforcement actions
CREATE TABLE public.policy_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text NOT NULL,
  action_type text NOT NULL,
  previous_status text NOT NULL DEFAULT '',
  new_status text NOT NULL DEFAULT '',
  analyst_name text NOT NULL DEFAULT 'System',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read + insert for portfolio demo
CREATE POLICY "Public read policy_actions" ON public.policy_actions FOR SELECT TO public USING (true);
CREATE POLICY "Public insert policy_actions" ON public.policy_actions FOR INSERT TO public WITH CHECK (true);

-- Allow updating clusters (status changes)
CREATE POLICY "Public update clusters" ON public.clusters FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_policy_actions_cluster ON public.policy_actions(cluster_id);
CREATE INDEX idx_policy_actions_created ON public.policy_actions(created_at DESC);