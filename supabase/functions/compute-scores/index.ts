// Edge Function: compute-scores
// Pipeline: raw_events → derived_features → score_results
// Computes derived features from cluster/account data, then applies
// a weighted heuristic scorer. Structured for future ML model replacement.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCORE_VERSION = "v1.0-heuristic";

// --- Scorer Module ---
// Weighted heuristic scorer. Replace with ML model inference later.
interface Features {
  linked_accounts_count: number;
  unique_payment_methods: number;
  unique_devices: number;
  unique_ips: number;
  promo_redemptions_30d: number;
  refunds_30d: number;
  disputes_90d: number;
  refund_rate_90d: number;
  payment_method_reuse: number;
  device_reuse: number;
  ip_reuse: number;
  velocity_signups_24h: number;
  velocity_refunds_7d: number;
  prior_actions_count: number;
}

interface ScoreOutput {
  score: number;
  risk_band: string;
  top_reasons: string[];
}

function computeScore(f: Features, weights: Record<string, number>): ScoreOutput {
  const signals: { name: string; contribution: number; reason: string }[] = [];

  if (f.refunds_30d >= 3)
    signals.push({ name: "refund_velocity", contribution: 18 * (weights.refund_weight || 1), reason: `${f.refunds_30d} refunds in 30d — high refund velocity` });
  if (f.refund_rate_90d > 0.3)
    signals.push({ name: "refund_rate", contribution: 15 * (weights.refund_weight || 1), reason: `${(f.refund_rate_90d * 100).toFixed(0)}% refund rate in 90d` });
  if (f.disputes_90d > 0)
    signals.push({ name: "dispute_spike", contribution: 20 * Math.min(f.disputes_90d, 3), reason: `${f.disputes_90d} dispute(s) in 90d — chargeback risk` });
  if (f.promo_redemptions_30d >= 2)
    signals.push({ name: "promo_abuse", contribution: 12 * (weights.promo_weight || 1), reason: `${f.promo_redemptions_30d} promo redemptions across linked accounts` });
  if (f.payment_method_reuse >= 3)
    signals.push({ name: "pm_reuse", contribution: 14 * (weights.payment_reuse_weight || 1), reason: `Payment method reused across ${f.payment_method_reuse} accounts` });
  if (f.device_reuse >= 3)
    signals.push({ name: "device_reuse", contribution: 12 * (weights.device_burst_weight || 1), reason: `Shared device across ${f.device_reuse} accounts in cluster` });
  if (f.ip_reuse >= 3)
    signals.push({ name: "ip_reuse", contribution: 8, reason: `IP address shared by ${f.ip_reuse} accounts` });
  if (f.velocity_signups_24h >= 3)
    signals.push({ name: "signup_burst", contribution: 15 * (weights.trial_weight || 1), reason: `${f.velocity_signups_24h} signups in 24h burst` });
  if (f.linked_accounts_count >= 5)
    signals.push({ name: "large_cluster", contribution: 10, reason: `Large cluster with ${f.linked_accounts_count} linked accounts` });

  // Base score from cluster size
  const baseScore = Math.min(f.linked_accounts_count * 3, 15);
  const signalScore = signals.reduce((s, sig) => s + sig.contribution, 0);
  const rawScore = Math.min(Math.round(baseScore + signalScore), 100);

  const risk_band = rawScore >= 80 ? "critical" : rawScore >= 60 ? "high" : rawScore >= 35 ? "medium" : "low";

  // Top reasons sorted by contribution
  const top_reasons = signals
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
    .map(s => s.reason);

  return { score: rawScore, risk_band, top_reasons };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Log pipeline run
    const { data: run } = await supabase
      .from("pipeline_runs")
      .insert({ run_type: "full_recompute", status: "running", score_version: SCORE_VERSION })
      .select("id")
      .single();
    const runId = run?.id;

    // Load policy config weights
    const { data: config } = await supabase
      .from("policy_config")
      .select("*")
      .eq("merchant_id", "demo_merchant")
      .single();

    const weights = {
      trial_weight: Number(config?.trial_weight || 1),
      refund_weight: Number(config?.refund_weight || 1),
      promo_weight: Number(config?.promo_weight || 0.8),
      payment_reuse_weight: Number(config?.payment_reuse_weight || 0.9),
      device_burst_weight: Number(config?.device_burst_weight || 1.2),
    };

    // Load all clusters with their related data
    const [clustersRes, accountsRes, eventsRes, edgesRes, actionsRes] = await Promise.all([
      supabase.from("clusters").select("*"),
      supabase.from("accounts").select("*"),
      supabase.from("events").select("*"),
      supabase.from("link_edges").select("*"),
      supabase.from("policy_actions").select("cluster_id"),
    ]);

    const clusters = clustersRes.data || [];
    const accounts = accountsRes.data || [];
    const events = eventsRes.data || [];
    const edges = edgesRes.data || [];
    const actions = actionsRes.data || [];

    let entitiesScored = 0;
    let eventCount = events.length;

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const d90 = new Date(now.getTime() - 90 * 86400000);

    for (const cluster of clusters) {
      const cAccounts = accounts.filter(a => a.cluster_id === cluster.id);
      const cEvents = events.filter(e => e.cluster_id === cluster.id);
      const cEdges = edges.filter(e => e.cluster_id === cluster.id);
      const cActions = actions.filter(a => a.cluster_id === cluster.id);

      const deviceIds = new Set(cEdges.filter(e => e.source_id?.startsWith("DEV") || e.target_id?.startsWith("DEV")).flatMap(e => [e.source_id, e.target_id]).filter(id => id?.startsWith("DEV")));
      const pmIds = new Set(cEdges.filter(e => e.source_id?.startsWith("PM") || e.target_id?.startsWith("PM")).flatMap(e => [e.source_id, e.target_id]).filter(id => id?.startsWith("PM")));
      const ipIds = new Set(cEdges.filter(e => e.source_id?.startsWith("IP") || e.target_id?.startsWith("IP")).flatMap(e => [e.source_id, e.target_id]).filter(id => id?.startsWith("IP")));

      const refundEvents30d = cEvents.filter(e => e.event_type === "refund" && new Date(e.created_at) >= d30);
      const disputeEvents90d = cEvents.filter(e => e.event_type === "dispute" && new Date(e.created_at) >= d90);
      const promoEvents30d = cEvents.filter(e => e.event_type === "promo_used" && new Date(e.created_at) >= d30);
      const paymentEvents90d = cEvents.filter(e => e.event_type === "payment" && new Date(e.created_at) >= d90);
      const refundEvents90d = cEvents.filter(e => e.event_type === "refund" && new Date(e.created_at) >= d90);
      const signupEvents24h = cEvents.filter(e => e.event_type === "trial_signup" && new Date(e.created_at) >= new Date(now.getTime() - 86400000));

      const totalPayments90d = paymentEvents90d.length + refundEvents90d.length;
      const refundRate90d = totalPayments90d > 0 ? refundEvents90d.length / totalPayments90d : 0;

      const latestEvent = cEvents.length > 0 ? cEvents.reduce((latest, e) => new Date(e.created_at) > new Date(latest.created_at) ? e : latest).created_at : null;

      const features: Features = {
        linked_accounts_count: cAccounts.length,
        unique_payment_methods: pmIds.size,
        unique_devices: deviceIds.size,
        unique_ips: ipIds.size,
        promo_redemptions_30d: promoEvents30d.length,
        refunds_30d: refundEvents30d.length,
        disputes_90d: disputeEvents90d.length,
        refund_rate_90d: refundRate90d,
        payment_method_reuse: Math.max(0, pmIds.size > 0 ? cAccounts.length / pmIds.size : 0),
        device_reuse: Math.max(0, deviceIds.size > 0 ? cAccounts.length / deviceIds.size : 0),
        ip_reuse: Math.max(0, ipIds.size > 0 ? cAccounts.length / ipIds.size : 0),
        velocity_signups_24h: signupEvents24h.length,
        velocity_refunds_7d: cEvents.filter(e => e.event_type === "refund" && new Date(e.created_at) >= new Date(now.getTime() - 7 * 86400000)).length,
        prior_actions_count: cActions.length,
      };

      // Upsert derived features
      await supabase.from("derived_features").upsert({
        entity_type: "cluster",
        entity_id: cluster.id,
        cluster_id: cluster.id,
        account_age_days: Math.floor((now.getTime() - new Date(cluster.created_at).getTime()) / 86400000),
        linked_accounts_count: features.linked_accounts_count,
        unique_payment_methods: features.unique_payment_methods,
        unique_devices: features.unique_devices,
        unique_ips: features.unique_ips,
        promo_redemptions_30d: features.promo_redemptions_30d,
        refunds_30d: features.refunds_30d,
        disputes_90d: features.disputes_90d,
        refund_rate_90d: features.refund_rate_90d,
        payment_method_reuse: Math.round(features.payment_method_reuse),
        device_reuse: Math.round(features.device_reuse),
        ip_reuse: Math.round(features.ip_reuse),
        velocity_signups_24h: features.velocity_signups_24h,
        velocity_refunds_7d: features.velocity_refunds_7d,
        latest_event_at: latestEvent,
        prior_actions_count: features.prior_actions_count,
        computed_at: now.toISOString(),
      }, { onConflict: "entity_type,entity_id" });

      // Compute and upsert score
      const scoreResult = computeScore(features, weights);

      await supabase.from("score_results").upsert({
        entity_type: "cluster",
        entity_id: cluster.id,
        score: scoreResult.score,
        risk_band: scoreResult.risk_band,
        top_reasons: scoreResult.top_reasons,
        score_version: SCORE_VERSION,
        scored_at: now.toISOString(),
      }, { onConflict: "entity_type,entity_id,score_version" });

      entitiesScored++;
    }

    // Update pipeline run
    if (runId) {
      await supabase.from("pipeline_runs").update({
        status: "completed",
        events_processed: eventCount,
        events_failed: 0,
        entities_scored: entitiesScored,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);
    }

    return new Response(
      JSON.stringify({
        status: "completed",
        entities_scored: entitiesScored,
        events_processed: eventCount,
        score_version: SCORE_VERSION,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
