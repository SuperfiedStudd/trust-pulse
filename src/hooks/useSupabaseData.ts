import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Realtime hook — invalidates queries when clusters or policy_actions change
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clusters' }, () => {
        queryClient.invalidateQueries({ queryKey: ["clusters"] });
        queryClient.invalidateQueries({ queryKey: ["cluster"] });
        queryClient.invalidateQueries({ queryKey: ["overview_stats"] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'policy_actions' }, () => {
        queryClient.invalidateQueries({ queryKey: ["policy_actions"] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analyst_notes' }, () => {
        queryClient.invalidateQueries({ queryKey: ["analyst_notes"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}

// Types matching DB schema
export interface DbCluster {
  id: string;
  risk_score: number;
  risk_level: string;
  linked_accounts: number;
  exposure: number;
  abuse_type: string;
  top_abuse_reason: string;
  recommended_action: string;
  owner: string;
  status: string;
  last_activity: string;
  trial_signups: number;
  refunds: number;
  payment_attempts: number;
  disputes: number;
  ai_summary: string;
  created_at: string;
  updated_at: string;
}

export interface DbAccount {
  id: string;
  email: string;
  name: string;
  cluster_id: string | null;
  risk_level: string;
  trial_count: number;
  refund_count: number;
  payment_count: number;
  last_activity: string;
  status: string;
  created_at: string;
}

export interface DbDevice {
  id: string;
  fingerprint: string;
  type: string;
  os: string;
  browser: string;
  account_count: number;
  risk_level: string;
  last_seen: string;
  created_at: string;
}

export interface DbPaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  account_count: number;
  risk_level: string;
  total_transactions: number;
  total_refunds: number;
  created_at: string;
}

export interface DbIpAddress {
  id: string;
  address: string;
  location: string;
  account_count: number;
  risk_level: string;
  is_vpn: boolean;
  last_seen: string;
  created_at: string;
}

export interface DbLinkEdge {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  label: string;
  cluster_id: string | null;
  weight: number;
  created_at: string;
}

export interface DbEvent {
  id: string;
  cluster_id: string | null;
  account_id: string | null;
  event_type: string;
  description: string;
  risk_level: string | null;
  amount: number | null;
  created_at: string;
}

export interface DbRuleTrigger {
  id: string;
  cluster_id: string;
  description: string;
  severity: string;
  created_at: string;
}

export interface DbAnalystNote {
  id: string;
  cluster_id: string;
  analyst_name: string;
  content: string;
  created_at: string;
}

export interface DbAnalyst {
  id: string;
  name: string;
  avatar: string;
  cases_count: number;
  capacity: number;
  created_at: string;
}

// Hooks
export function useClusters() {
  return useQuery({
    queryKey: ["clusters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clusters")
        .select("*")
        .order("risk_score", { ascending: false });
      if (error) throw error;
      return data as DbCluster[];
    },
  });
}

export function useCluster(id: string | undefined) {
  return useQuery({
    queryKey: ["cluster", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clusters")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbCluster;
    },
    enabled: !!id,
  });
}

export function useAccounts(clusterId?: string) {
  return useQuery({
    queryKey: ["accounts", clusterId],
    queryFn: async () => {
      let query = supabase.from("accounts").select("*").order("created_at", { ascending: false });
      if (clusterId) query = query.eq("cluster_id", clusterId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbAccount[];
    },
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("account_count", { ascending: false });
      if (error) throw error;
      return data as DbDevice[];
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment_methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("account_count", { ascending: false });
      if (error) throw error;
      return data as DbPaymentMethod[];
    },
  });
}

export function useIpAddresses() {
  return useQuery({
    queryKey: ["ip_addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_addresses")
        .select("*")
        .order("account_count", { ascending: false });
      if (error) throw error;
      return data as DbIpAddress[];
    },
  });
}

export function useLinkEdges(clusterId?: string) {
  return useQuery({
    queryKey: ["link_edges", clusterId],
    queryFn: async () => {
      let query = supabase.from("link_edges").select("*");
      if (clusterId) query = query.eq("cluster_id", clusterId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbLinkEdge[];
    },
  });
}

export function useEvents(clusterId?: string) {
  return useQuery({
    queryKey: ["events", clusterId],
    queryFn: async () => {
      let query = supabase.from("events").select("*").order("created_at", { ascending: false });
      if (clusterId) query = query.eq("cluster_id", clusterId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbEvent[];
    },
  });
}

export function useRuleTriggers(clusterId?: string) {
  return useQuery({
    queryKey: ["rule_triggers", clusterId],
    queryFn: async () => {
      let query = supabase.from("rule_triggers").select("*");
      if (clusterId) query = query.eq("cluster_id", clusterId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbRuleTrigger[];
    },
  });
}

export function useAnalystNotes(clusterId?: string) {
  return useQuery({
    queryKey: ["analyst_notes", clusterId],
    queryFn: async () => {
      let query = supabase.from("analyst_notes").select("*").order("created_at", { ascending: false });
      if (clusterId) query = query.eq("cluster_id", clusterId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbAnalystNote[];
    },
  });
}

export function useAddAnalystNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clusterId, content, analystName }: { clusterId: string; content: string; analystName: string }) => {
      const { data, error } = await supabase
        .from("analyst_notes")
        .insert({ cluster_id: clusterId, content, analyst_name: analystName })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["analyst_notes", variables.clusterId] });
    },
  });
}

export function useAnalysts() {
  return useQuery({
    queryKey: ["analysts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analysts").select("*");
      if (error) throw error;
      return data as DbAnalyst[];
    },
  });
}

// Policy actions
export interface DbPolicyAction {
  id: string;
  cluster_id: string;
  action_type: string;
  previous_status: string;
  new_status: string;
  analyst_name: string;
  notes: string;
  created_at: string;
}

export function usePolicyActions(clusterId?: string) {
  return useQuery({
    queryKey: ["policy_actions", clusterId],
    queryFn: async () => {
      let query = supabase.from("policy_actions").select("*").order("created_at", { ascending: false });
      if (clusterId) query = query.eq("cluster_id", clusterId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbPolicyAction[];
    },
  });
}

export function useClusterAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clusterId, actionType, newStatus, analystName = 'Current Analyst' }: {
      clusterId: string; actionType: string; newStatus: string; analystName?: string;
    }) => {
      // Get current status
      const { data: cluster } = await supabase.from("clusters").select("status").eq("id", clusterId).single();
      const previousStatus = cluster?.status || 'unknown';

      // Update cluster
      const { error: updateError } = await supabase
        .from("clusters")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", clusterId);
      if (updateError) throw updateError;

      // Insert policy action record
      const { error: actionError } = await supabase
        .from("policy_actions")
        .insert({ cluster_id: clusterId, action_type: actionType, previous_status: previousStatus, new_status: newStatus, analyst_name: analystName });
      if (actionError) throw actionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["cluster"] });
      queryClient.invalidateQueries({ queryKey: ["policy_actions"] });
      queryClient.invalidateQueries({ queryKey: ["overview_stats"] });
    },
  });
}

export function useBulkClusterAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clusterIds, actionType, newStatus, analystName = 'Current Analyst' }: {
      clusterIds: string[]; actionType: string; newStatus: string; analystName?: string;
    }) => {
      for (const clusterId of clusterIds) {
        const { data: cluster } = await supabase.from("clusters").select("status").eq("id", clusterId).single();
        const previousStatus = cluster?.status || 'unknown';

        const { error: updateError } = await supabase
          .from("clusters")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", clusterId);
        if (updateError) throw updateError;

        await supabase
          .from("policy_actions")
          .insert({ cluster_id: clusterId, action_type: actionType, previous_status: previousStatus, new_status: newStatus, analyst_name: analystName });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["policy_actions"] });
      queryClient.invalidateQueries({ queryKey: ["overview_stats"] });
    },
  });
}

// Overview KPI derived data
export function useOverviewStats() {
  return useQuery({
    queryKey: ["overview_stats"],
    queryFn: async () => {
      const [clustersRes, accountsRes, eventsRes] = await Promise.all([
        supabase.from("clusters").select("*"),
        supabase.from("accounts").select("risk_level, status"),
        supabase.from("events").select("event_type, amount"),
      ]);
      
      const clusters = (clustersRes.data || []) as DbCluster[];
      const accounts = (accountsRes.data || []) as Pick<DbAccount, 'risk_level' | 'status'>[];
      const events = (eventsRes.data || []) as Pick<DbEvent, 'event_type' | 'amount'>[];

      const flaggedToday = accounts.filter(a => a.risk_level !== 'low').length;
      const totalExposure = clusters.reduce((sum, c) => sum + Number(c.exposure), 0);
      const pendingClusters = clusters.filter(c => c.status === 'pending').length;
      const refundEvents = events.filter(e => e.event_type === 'refund');
      const totalRefundAmount = refundEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // Abuse breakdown from clusters
      const abuseBreakdown = clusters.reduce((acc, c) => {
        acc[c.abuse_type] = (acc[c.abuse_type] || 0) + c.linked_accounts;
        return acc;
      }, {} as Record<string, number>);

      return {
        flaggedToday,
        totalExposure,
        pendingClusters,
        totalRefundAmount,
        clusterCount: clusters.length,
        accountCount: accounts.length,
        abuseBreakdown,
      };
    },
  });
}

// Policy config
export interface DbPolicyConfig {
  id: string;
  merchant_id: string;
  risk_threshold: number;
  trial_weight: number;
  refund_weight: number;
  promo_weight: number;
  payment_reuse_weight: number;
  device_burst_weight: number;
  review_capacity: number;
  updated_at: string;
}

export function usePolicyConfig() {
  return useQuery({
    queryKey: ["policy_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_config")
        .select("*")
        .eq("merchant_id", "demo_merchant")
        .single();
      if (error) throw error;
      return data as DbPolicyConfig;
    },
  });
}

export function useUpdatePolicyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<DbPolicyConfig, 'id' | 'merchant_id'>>) => {
      const { error } = await supabase
        .from("policy_config")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("merchant_id", "demo_merchant");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy_config"] });
    },
  });
}
