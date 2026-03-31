import { Flag, DollarSign, Target, Users, Sparkles, TrendingUp, AlertTriangle, Activity, Zap, Database } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClusters, useAnalysts, useOverviewStats, useEvents, usePolicyActions } from "@/hooks/useSupabaseData";
import { useRawEventStats, useLatestPipelineRun } from "@/hooks/usePipelineData";
import { formatCurrency, abuseTypeLabels } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { formatDateTime, getSafeDate } from "@/lib/utils";

const chartColors = ['hsl(225, 73%, 57%)', 'hsl(262, 60%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(0, 72%, 51%)'];

export default function Overview() {
  const navigate = useNavigate();
  const { data: clusters, isLoading: clustersLoading } = useClusters();
  const { data: analysts, isLoading: analystsLoading } = useAnalysts();
  const { data: stats, isLoading: statsLoading } = useOverviewStats();
  const { data: allEvents } = useEvents();
  const { data: policyActions } = usePolicyActions();
  const { data: eventStats } = useRawEventStats();
  const { data: latestRun } = useLatestPipelineRun();

  const topClusters = (clusters || []).filter(c => c.risk_level === 'high' || c.risk_level === 'critical').slice(0, 5);
  const isLoading = clustersLoading || analystsLoading || statsLoading;

  const abuseTypeBreakdown = useMemo(() => {
    const cl = clusters || [];
    const counts: Record<string, number> = {};
    cl.forEach(c => { counts[c.abuse_type] = (counts[c.abuse_type] || 0) + c.linked_accounts; });
    return Object.entries(abuseTypeLabels).map(([key, label]) => ({
      type: label, count: counts[key] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [clusters]);

  const flaggedAccountsTrend = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, { count: number; blocked: number }> = {};
    days.forEach(d => { counts[d] = { count: 0, blocked: 0 }; });
    (allEvents || []).forEach(e => {
      const eventDate = getSafeDate(e.created_at);
      if (!eventDate) return;
      const day = days[eventDate.getDay()];
      counts[day].count++;
      if (e.risk_level === 'high' || e.risk_level === 'critical') counts[day].blocked++;
    });
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ date: d, count: counts[d].count, blocked: counts[d].blocked }));
  }, [allEvents]);

  const recommendedActions = useMemo(() => {
    const cl = clusters || [];
    const pending = cl.filter(c => c.status === 'pending');
    const actions: { id: string; action: string; detail: string; priority: 'high' | 'medium'; count: number }[] = [];

    const critPending = pending.filter(c => c.risk_level === 'critical');
    if (critPending.length) actions.push({ id: 'ra0', action: `Triage ${critPending.length} critical cluster${critPending.length > 1 ? 's' : ''} now`, detail: `Exposure: ${formatCurrency(critPending.reduce((s, c) => s + Number(c.exposure), 0))}`, priority: 'high', count: critPending.length });

    const trialClusters = pending.filter(c => c.abuse_type === 'trial_abuse');
    if (trialClusters.length) actions.push({ id: 'ra1', action: `Block or verify ${trialClusters.length} trial abuse ring${trialClusters.length > 1 ? 's' : ''}`, detail: `${trialClusters.reduce((s, c) => s + c.trial_signups, 0)} suspicious signups`, priority: 'high', count: trialClusters.length });

    const refundClusters = pending.filter(c => c.abuse_type === 'refund_cycling');
    if (refundClusters.length) actions.push({ id: 'ra2', action: `Investigate ${refundClusters.length} refund cycling pattern${refundClusters.length > 1 ? 's' : ''}`, detail: `${refundClusters.reduce((s, c) => s + c.refunds, 0)} refunds flagged`, priority: 'high', count: refundClusters.length });

    const deviceClusters = pending.filter(c => c.abuse_type === 'device_burst');
    if (deviceClusters.length) actions.push({ id: 'ra3', action: `Flag device burst accounts for verification`, detail: `${deviceClusters.reduce((s, c) => s + c.linked_accounts, 0)} accounts from shared devices`, priority: 'medium', count: deviceClusters.length });

    if (actions.length === 0) actions.push({ id: 'ra0', action: 'Inbox clear — all clusters triaged', detail: 'No pending clusters require action', priority: 'medium', count: 0 });
    return actions;
  }, [clusters]);

  const recentActivity = useMemo(() => {
    const items: { id: string; message: string; time: string; type: 'alert' | 'action' | 'system' }[] = [];

    (policyActions || []).slice(0, 4).forEach(a => {
      const verb = a.action_type === 'block_trial' ? 'blocked' :
        a.action_type === 'allow' ? 'approved' :
        a.action_type === 'restrict_promo' ? 'restricted promos on' :
        a.action_type === 'require_verification' ? 'required verification for' :
        `actioned`;
      items.push({ id: a.id, message: `${a.analyst_name} ${verb} ${a.cluster_id}`, time: formatDateTime(a.created_at), type: 'action' });
    });

    const highRiskEvents = (allEvents || []).filter(e => e.risk_level === 'high' || e.risk_level === 'critical').slice(0, 4);
    highRiskEvents.forEach(e => {
      if (items.length < 8) {
        items.push({ id: e.id, message: e.description, time: formatDateTime(e.created_at), type: 'alert' });
      }
    });

    return items.slice(0, 8);
  }, [policyActions, allEvents]);

  const fpRate = useMemo(() => {
    const cl = clusters || [];
    const approved = cl.filter(c => c.status === 'approved').length;
    const total = cl.filter(c => c.status !== 'pending').length;
    return total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
  }, [clusters]);

  const totalExposure = stats?.totalExposure || 0;
  const blockedExposure = useMemo(() => {
    return (clusters || []).filter(c => c.status === 'blocked').reduce((s, c) => s + Number(c.exposure), 0);
  }, [clusters]);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Daily risk operations summary</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <KPICard label="Pending Review" value={String(stats?.pendingClusters || 0)} icon={Flag} trend={`${stats?.clusterCount || 0} total clusters`} trendUp iconColor="bg-risk-high-bg" />
            <KPICard label="Total Exposure" value={formatCurrency(totalExposure)} icon={DollarSign} trend={`${formatCurrency(blockedExposure)} blocked`} trendUp iconColor="bg-risk-low-bg" />
            <KPICard label="False Positive Rate" value={`${fpRate}%`} icon={Target} trend="approved ÷ actioned" iconColor="bg-muted" />
            <KPICard label="Accounts Flagged" value={String(stats?.flaggedToday || 0)} icon={Users} trend={`${stats?.accountCount || 0} total tracked`} trendUp iconColor="bg-risk-medium-bg" />
          </>
        )}
      </div>

      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Pipeline Health</h3>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">raw events → scoring</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <PipelineMetric label="Raw Events" value={String(eventStats?.total ?? 0)} />
          <PipelineMetric label="Processed" value={String(eventStats?.processed ?? 0)} />
          <PipelineMetric label="Failed" value={String(eventStats?.failed ?? 0)} highlight={(eventStats?.failed ?? 0) > 0} />
          <PipelineMetric label="Latest Run" value={formatDateTime(latestRun?.completed_at || latestRun?.started_at)} />
          <PipelineMetric label="Entities Scored" value={String(latestRun?.entities_scored ?? 0)} />
          <PipelineMetric label="Score Version" value={latestRun?.score_version || '—'} mono />
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
          Live controls stay in Settings → Pipeline &amp; Scoring. Saved policy config feeds the simulator baseline and the next scoring recompute.
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-surface p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Event Volume — Last 7 Days</h3>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={flaggedAccountsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid hsl(220, 13%, 90%)' }} />
              <Line type="monotone" dataKey="count" stroke="hsl(225, 73%, 57%)" strokeWidth={2} dot={{ r: 2.5 }} name="Total Events" />
              <Line type="monotone" dataKey="blocked" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 2.5 }} name="High Risk" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Priority Actions</h3>
          </div>
          <div className="space-y-2.5">
            {recommendedActions.map(ra => (
              <div key={ra.id} className="flex items-start gap-2">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${ra.priority === 'high' ? 'bg-destructive' : 'bg-risk-medium'}`} />
                <div>
                  <p className="text-xs text-foreground font-medium leading-snug">{ra.action}</p>
                  <p className="text-[10px] text-muted-foreground">{ra.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-surface p-4">
          <h3 className="text-sm font-medium mb-3">Abuse Pattern Distribution</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={abuseTypeBreakdown} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} width={85} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid hsl(220, 13%, 90%)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14} name="Linked Accounts">
                {abuseTypeBreakdown.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-medium">Highest Risk Clusters</h3>
          </div>
          {clustersLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : topClusters.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No high-risk clusters detected</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left pb-2">Cluster</th>
                  <th className="table-header text-left pb-2">Risk</th>
                  <th className="table-header text-right pb-2">Exposure</th>
                  <th className="table-header text-left pb-2">Pattern</th>
                  <th className="table-header text-left pb-2">Status</th>
                  <th className="table-header text-right pb-2">Accts</th>
                </tr>
              </thead>
              <tbody>
                {topClusters.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/entity/${c.id}`)}>
                    <td className="py-2 text-xs font-mono font-medium text-foreground">{c.id}</td>
                    <td className="py-2"><RiskBadge level={c.risk_level as any} /></td>
                    <td className="py-2 text-xs text-right font-medium">{formatCurrency(Number(c.exposure))}</td>
                    <td className="py-2 text-xs text-muted-foreground">{c.top_abuse_reason}</td>
                    <td className="py-2"><StatusBadge status={c.status as any} /></td>
                    <td className="py-2 text-xs text-right">{c.linked_accounts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Policy Effectiveness</h3>
          </div>
          <div className="space-y-2.5">
            <ProgressMetric label="Triage Rate" value={clusters ? Math.round(((clusters.filter(c => c.status !== 'pending').length) / Math.max(clusters.length, 1)) * 100) : 0} color="bg-primary" />
            <ProgressMetric label="Block Rate" value={clusters ? Math.round(((clusters.filter(c => c.status === 'blocked').length) / Math.max(clusters.length, 1)) * 100) : 0} color="bg-destructive" />
            <ProgressMetric label="Approval Rate" value={clusters ? Math.round(((clusters.filter(c => c.status === 'approved').length) / Math.max(clusters.length, 1)) * 100) : 0} color="bg-risk-low" />
          </div>
        </div>

        <div className="card-surface p-4">
          <h3 className="text-sm font-medium mb-3">Analyst Workload</h3>
          {analystsLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : (analysts || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No analysts configured</p>
          ) : (
            <div className="space-y-2">
              {(analysts || []).map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">{a.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 rounded-full bg-muted flex-1 overflow-hidden">
                        <div className={`h-full rounded-full ${a.cases_count / a.capacity > 0.8 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.min((a.cases_count / a.capacity) * 100, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{a.cases_count}/{a.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent activity recorded</p>
            ) : (
              recentActivity.map(act => (
                <div key={act.id} className="flex items-start gap-2">
                  <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${act.type === 'alert' ? 'bg-destructive' : act.type === 'action' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-foreground leading-relaxed">{act.message}</p>
                    <p className="text-[10px] text-muted-foreground">{act.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function ProgressMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PipelineMetric({ label, value, highlight = false, mono = false }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? 'text-destructive' : 'text-foreground'} ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</p>
    </div>
  );
}