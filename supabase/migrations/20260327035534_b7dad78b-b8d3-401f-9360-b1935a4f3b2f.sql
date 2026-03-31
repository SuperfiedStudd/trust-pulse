CREATE TABLE public.policy_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id text NOT NULL DEFAULT 'demo_merchant',
  risk_threshold integer NOT NULL DEFAULT 70,
  trial_weight numeric NOT NULL DEFAULT 1.0,
  refund_weight numeric NOT NULL DEFAULT 1.0,
  promo_weight numeric NOT NULL DEFAULT 0.8,
  payment_reuse_weight numeric NOT NULL DEFAULT 0.9,
  device_burst_weight numeric NOT NULL DEFAULT 1.2,
  review_capacity integer NOT NULL DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id)
);

CREATE POLICY "Public read policy_config" ON public.policy_config FOR SELECT TO public USING (true);
CREATE POLICY "Public insert policy_config" ON public.policy_config FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update policy_config" ON public.policy_config FOR UPDATE TO public USING (true) WITH CHECK (true);

INSERT INTO public.policy_config (merchant_id) VALUES ('demo_merchant');