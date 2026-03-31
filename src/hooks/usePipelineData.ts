/**
 * Pipeline data hooks for raw_events, derived_features, score_results, pipeline_runs.
 * Architecture: raw events → derived features → risk scoring → UI surfaces
 * Future: Kafka/streaming ingestion, feature store, ML model inference replace heuristics.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---

export interface RawEvent {
  id: string;
  event_type: string;
  event_time: string;
  entity_type: string;
  entity_id: string;
  cluster_id: string | null;
  source_system: string;
  payload_json: Record<string, unknown>;
  ingestion_status: string;
  dedupe_key: string;
  created_at: string;
}

export interface DerivedFeatures {
  id: string;
  entity_type: string;
  entity_id: string;
  cluster_id: string | null;
  account_age_days: number;
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
  latest_event_at: string | null;
  prior_actions_count: number;
  computed_at: string;
}

export interface ScoreResult {
  id: string;
  entity_type: string;
  entity_id: string;
  score: number;
  risk_band: string;
  top_reasons: string[];
  score_version: string;
  scored_at: string;
}

export interface PipelineRun {
  id: string;
  run_type: string;
  status: string;
  events_processed: number;
  events_failed: number;
  entities_scored: number;
  score_version: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// --- Hooks ---

export function useRawEvents(limit = 50) {
  return useQuery({
    queryKey: ["raw_events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_events")
        .select("*")
        .order("event_time", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as RawEvent[];
    },
  });
}

export function useRawEventStats() {
  return useQuery({
    queryKey: ["raw_event_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_events")
        .select("ingestion_status, event_type");
      if (error) throw error;
      const events = data || [];
      const total = events.length;
      const processed = events.filter(e => (e as any).ingestion_status === "processed").length;
      const failed = events.filter(e => (e as any).ingestion_status === "failed").length;
      const pending = events.filter(e => (e as any).ingestion_status === "pending").length;
      const byType: Record<string, number> = {};
      events.forEach(e => { byType[(e as any).event_type] = (byType[(e as any).event_type] || 0) + 1; });
      return { total, processed, failed, pending, byType };
    },
  });
}

export function useDerivedFeatures(entityId?: string) {
  return useQuery({
    queryKey: ["derived_features", entityId],
    queryFn: async () => {
      let query = supabase.from("derived_features").select("*");
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DerivedFeatures[];
    },
    enabled: entityId ? true : true,
  });
}

export function useScoreResult(entityId?: string) {
  return useQuery({
    queryKey: ["score_result", entityId],
    queryFn: async () => {
      if (!entityId) return null;
      const { data, error } = await supabase
        .from("score_results")
        .select("*")
        .eq("entity_id", entityId)
        .eq("entity_type", "cluster")
        .order("scored_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ScoreResult | null;
    },
    enabled: !!entityId,
  });
}

export function usePipelineRuns(limit = 10) {
  return useQuery({
    queryKey: ["pipeline_runs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as PipelineRun[];
    },
  });
}

export function useLatestPipelineRun() {
  return useQuery({
    queryKey: ["latest_pipeline_run"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PipelineRun | null;
    },
  });
}

export function useTriggerScoring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("compute-scores");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score_result"] });
      queryClient.invalidateQueries({ queryKey: ["derived_features"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline_runs"] });
      queryClient.invalidateQueries({ queryKey: ["latest_pipeline_run"] });
      queryClient.invalidateQueries({ queryKey: ["raw_event_stats"] });
    },
  });
}
