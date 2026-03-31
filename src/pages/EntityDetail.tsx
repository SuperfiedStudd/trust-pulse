import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, Ban, ShieldCheck, StickyNote, Sparkles, Clock, Network, Shield, Activity, FileText, Link2, Gauge, Zap, BarChart3 } from "lucide-react";
import { useCluster, useAccounts, useEvents, useRuleTriggers, useAnalystNotes, useAddAnalystNote, useLinkEdges, useClusterAction, usePolicyActions, useDevices, usePaymentMethods, useIpAddresses } from "@/hooks/useSupabaseData";
import { useDerivedFeatures, useScoreResult } from "@/hooks/usePipelineData";
import { formatCurrency } from "@/data/mockData";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActionButton } from "@/components/shared/ActionButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/utils";

const eventTypeIcons: Record<string, { icon: string; color: string }> = {
  trial_signup: { icon: '🎫', color: 'bg-primary/10' },
  payment: { icon: '💳', color: 'bg-risk-low-bg' },
  payment_declined: { icon: '❌', color: 'bg-risk-medium-bg' },
  refund: { icon: '↩️', color: 'bg-risk-high-bg' },
  dispute: { icon: '⚠️', color: 'bg-risk-high-bg' },
  account_created: { icon: '👤', color: 'bg-muted' },
  promo_used: { icon: '🎁', color: 'bg-risk-medium-bg' },
  device_linked: { icon: '💻', color: 'bg-muted' },
};

export default function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState<'events' | 'sources' | 'segments' | 'actions'>('events');

  const { data: cluster, isLoading: clusterLoading } = useCluster(id);
  const { data: accounts } = useAccounts(id);
  const { data: events } = useEvents(id);
  const { data: triggers } = useRuleTriggers(id);
  const { data: notes } = useAnalystNotes(id);
  const { data: edges } = useLinkEdges(id);
  const { data: policyActions } = usePolicyActions(id);
  const { data: allDevices } = useDevices();
  const { data: allPMs } = usePaymentMethods();
  const { data: allIPs } = useIpAddresses();
  const addNote = useAddAnalystNote();
  const clusterAction = useClusterAction();
  const { data: derivedFeaturesList } = useDerivedFeatures(id);
  const { data: scoreResult } = useScoreResult(id);
  const derivedFeatures = derivedFeaturesList?.[0] || null;

  const deviceMap = useMemo(() => new Map((allDevices || []).map(d => [d.id, d])), [allDevices]);
  const pmMap = useMemo(() => new Map((allPMs || []).map(p => [p.id, p])), [allPMs]);
  const ipMap = useMemo(() => new Map((allIPs || []).map(ip => [ip.id, ip])), [allIPs]);

  // Edge type breakdown for relationship summary
  const edgeTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (edges || []).forEach(e => { counts[e.edge_type] = (counts[e.edge_type] || 0) + 1; });
    return counts;
  }, [edges]);

  // Event type breakdown for mini-stats
  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (events || []).forEach(e => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
    return counts;
  }, [events]);

  const totalEventAmount = useMemo(() => {
    return (events || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [events]);

  if (clusterLoading) {
    return <div className="space-y-4 max-w-[1400px]"><Skeleton className="h-12 w-64" /><div className="grid grid-cols-6 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div><Skeleton className="h-96" /></div>;
  }

  if (!cluster) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Shield className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cluster not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/risk-inbox')}>Back to Risk Inbox</Button>
      </div>
    );
  }

  const deviceIds = [...new Set((edges || []).filter(e => e.source_id.startsWith('DEV') || e.target_id.startsWith('DEV')).flatMap(e => [e.source_id, e.target_id]).filter(id => id.startsWith('DEV')))];
  const pmIds = [...new Set((edges || []).filter(e => e.source_id.startsWith('PM') || e.target_id.startsWith('PM')).flatMap(e => [e.source_id, e.target_id]).filter(id => id.startsWith('PM')))];
  const ipIds = [...new Set((edges || []).filter(e => e.source_id.startsWith('IP') || e.target_id.startsWith('IP')).flatMap(e => [e.source_id, e.target_id]).filter(id => id.startsWith('IP')))];

  const handleAddNote = async () => {
    if (!note.trim() || !id) return;
    try {
      await addNote.mutateAsync({ clusterId: id, content: note.trim(), analystName: 'Current Analyst' });
      setNote("");
      toast.success("Note added to investigation");
    } catch { toast.error("Failed to add note"); }
  };

  const handleAction = async (actionType: string, newStatus: string, label: string) => {
    if (!id) return;
    try {
      await clusterAction.mutateAsync({ clusterId: id, actionType, newStatus });
      toast.success(`${label} — ${id} status updated to ${newStatus}`);
    } catch { toast.error(`Failed to apply ${label}`); }
  };

  const summaryPoints = cluster.ai_summary
    .split(/[.!]\s+/)
    .filter(s => s.trim().length > 10)
    .slice(0, 5);

  const tabCounts = {
    events: (events || []).length,
    sources: deviceIds.length + pmIds.length + ipIds.length,
    segments: (accounts || []).length,
    actions: (policyActions || []).length,
  };

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header">Cluster {cluster.id}</h1>
              <RiskBadge level={cluster.risk_level as any} />
              <StatusBadge status={cluster.status as any} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cluster.abuse_type.replace(/_/g, ' ')} · Exposure {formatCurrency(Number(cluster.exposure))} · Owner: {cluster.owner || 'Unassigned'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton label="Approve" icon={Check} variant="allow" onClick={() => handleAction('approve', 'approved', 'Approve')} />
          <ActionButton label="Escalate" icon={AlertTriangle} variant="verify" onClick={() => handleAction('escalate', 'reviewing', 'Escalate')} />
          <ActionButton label="Block" icon={Ban} variant="block" onClick={() => handleAction('block', 'blocked', 'Block')} />
          <ActionButton label="Verify" icon={ShieldCheck} variant="review" onClick={() => handleAction('require_verification', 'reviewing', 'Verify')} />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <KPITile label="Risk Score" value={String(cluster.risk_score)} highlight={cluster.risk_score >= 80} />
        <KPITile label="Linked Accounts" value={String(cluster.linked_accounts)} />
        <KPITile label="Trial Signups" value={String(cluster.trial_signups)} />
        <KPITile label="Refunds" value={String(cluster.refunds)} highlight={cluster.refunds > 3} />
        <KPITile label="Payment Attempts" value={String(cluster.payment_attempts)} />
        <KPITile label="Disputes" value={String(cluster.disputes)} highlight={cluster.disputes > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-3">
          {/* Relationship Summary Bar */}
          <div className="card-surface p-3">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-medium">Cluster Topology</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">{(edges || []).length} edges · {deviceIds.length + pmIds.length + ipIds.length + (accounts || []).length} entities</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniStat label="Accounts" value={String((accounts || []).length)} icon="👤" />
              <MiniStat label="Devices" value={String(deviceIds.length)} icon="💻" />
              <MiniStat label="Cards" value={String(pmIds.length)} icon="💳" />
              <MiniStat label="IPs" value={String(ipIds.length)} icon="🌐" />
            </div>
            {Object.keys(edgeTypeCounts).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
                {Object.entries(edgeTypeCounts).map(([type, count]) => (
                  <span key={type} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {type.replace(/_/g, ' ')} × {count}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tabbed Content */}
          <div className="card-surface">
            <div className="flex border-b border-border">
              {(['events', 'sources', 'segments', 'actions'] as const).map(tab => (
                <button key={tab} className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'segments' ? 'Accounts' : tab}
                  <span className="ml-1 text-[10px] text-muted-foreground">({tabCounts[tab]})</span>
                </button>
              ))}
            </div>

            <ScrollArea className="max-h-[480px]">
              <div className="p-4">
                {activeTab === 'events' && (
                  <div>
                    {/* Event stats bar */}
                    {(events || []).length > 0 && (
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Gauge className="h-3 w-3" />
                          <span>{(events || []).length} events</span>
                        </div>
                        {totalEventAmount > 0 && (
                          <span className="text-[10px] text-muted-foreground">Total: {formatCurrency(totalEventAmount)}</span>
                        )}
                        <div className="flex gap-1.5 ml-auto flex-wrap">
                          {Object.entries(eventTypeCounts).slice(0, 5).map(([type, count]) => (
                            <span key={type} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {type.replace(/_/g, ' ')} ({count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Investigation Timeline</h3>
                    </div>
                    {(events || []).length === 0 ? (
                      <EmptyTab icon={<Activity className="h-5 w-5" />} title="No events recorded" description="This cluster has no event timeline yet. Events appear as accounts generate activity." />
                    ) : (
                      <div className="space-y-0">
                        {(events || []).map((event, i) => {
                          const config = eventTypeIcons[event.event_type] || { icon: '•', color: 'bg-muted' };
                          return (
                            <div key={event.id} className="flex gap-3 relative group">
                              {i < (events || []).length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />}
                              <div className={`h-7 w-7 rounded-full ${config.color} flex items-center justify-center text-xs shrink-0 z-10`}>{config.icon}</div>
                              <div className="flex-1 pb-3 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-foreground">{event.description}</p>
                                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatDateTime(event.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {event.amount && <span className="text-[10px] font-medium text-foreground">{formatCurrency(Number(event.amount))}</span>}
                                  {event.risk_level && event.risk_level !== 'low' && <RiskBadge level={event.risk_level as any} className="text-[9px] px-1 py-0" />}
                                  {event.account_id && <span className="text-[10px] text-muted-foreground font-mono">{event.account_id}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sources' && (
                  <div className="space-y-4">
                    {tabCounts.sources === 0 ? (
                      <EmptyTab icon={<Network className="h-5 w-5" />} title="No linked sources" description="No devices, payment methods, or IPs are linked to this cluster yet. Sources appear when accounts share infrastructure." />
                    ) : (
                      <>
                        <SourceSection title="Devices" icon="💻" count={deviceIds.length} ids={deviceIds} renderItem={did => {
                          const d = deviceMap.get(did);
                          return (
                            <div key={did} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px]">{did}</span>
                                {d && <span className="text-muted-foreground">{d.os} · {d.browser}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {d && <span className="text-[10px] text-muted-foreground">{d.account_count} accts</span>}
                                <RiskBadge level={(d?.risk_level || 'medium') as any} />
                              </div>
                            </div>
                          );
                        }} />

                        <SourceSection title="Payment Methods" icon="💳" count={pmIds.length} ids={pmIds} renderItem={pid => {
                          const p = pmMap.get(pid);
                          return (
                            <div key={pid} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px]">{pid}</span>
                                {p && <span className="text-muted-foreground">{p.brand} ····{p.last4}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {p && <span className="text-[10px] text-muted-foreground">{p.total_transactions} txns · {p.total_refunds} refunds</span>}
                                <RiskBadge level={(p?.risk_level || 'medium') as any} />
                              </div>
                            </div>
                          );
                        }} />

                        <SourceSection title="IP Addresses" icon="🌐" count={ipIds.length} ids={ipIds} renderItem={iid => {
                          const ip = ipMap.get(iid);
                          return (
                            <div key={iid} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px]">{ip?.address || iid}</span>
                                {ip && <span className="text-muted-foreground">{ip.location}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {ip?.is_vpn && <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">VPN</span>}
                                {ip && <span className="text-[10px] text-muted-foreground">{ip.account_count} accts</span>}
                                <RiskBadge level={(ip?.risk_level || 'medium') as any} />
                              </div>
                            </div>
                          );
                        }} />
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'segments' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Network className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-medium">Linked Accounts ({(accounts || []).length})</h3>
                    </div>
                    {(accounts || []).length === 0 ? (
                      <EmptyTab icon={<Network className="h-5 w-5" />} title="No linked accounts" description="This cluster has no associated accounts. Accounts get linked when they share devices, payment methods, or IPs." />
                    ) : (
                      <div className="space-y-1.5">
                        {(accounts || []).map(acc => (
                          <div key={acc.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">👤</div>
                              <div className="min-w-0">
                                <span className="font-medium block truncate">{acc.email}</span>
                                <span className="text-[10px] text-muted-foreground">{acc.id} · {acc.trial_count} trials · {acc.refund_count} refunds</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={acc.status as any} />
                              <RiskBadge level={acc.risk_level as any} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'actions' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-medium">Action Audit Trail</h3>
                    </div>
                    {(policyActions || []).length === 0 ? (
                      <EmptyTab icon={<FileText className="h-5 w-5" />} title="No actions taken" description="This cluster is awaiting analyst review. Actions will appear here once an operator approves, blocks, or escalates this cluster." />
                    ) : (
                      <div className="space-y-0">
                        {(policyActions || []).map((a, i) => (
                          <div key={a.id} className="flex gap-3 relative">
                            {i < (policyActions || []).length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />}
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 z-10">⚡</div>
                            <div className="flex-1 pb-3 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium capitalize">{a.action_type.replace(/_/g, ' ')}</span>
                                  <span className="text-muted-foreground text-[10px]">→</span>
                                  <StatusBadge status={a.new_status as any} />
                                </div>
                                <span className="text-[10px] text-muted-foreground">{formatDateTime(a.created_at)}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                by {a.analyst_name} · from {a.previous_status || 'initial'}
                                {a.notes && <span className="ml-1">· {a.notes}</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-3">
          {/* Risk Triggers */}
          <div className="card-surface p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <h3 className="text-xs font-medium">Rule Triggers ({(triggers || []).length})</h3>
            </div>
            {(triggers || []).length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2">No automated rules triggered — manual review may still be warranted.</p>
            ) : (
              <div className="space-y-1.5">
                {(triggers || []).map(trigger => (
                  <div key={trigger.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${trigger.severity === 'critical' ? 'bg-destructive' : trigger.severity === 'high' ? 'bg-risk-high' : 'bg-risk-medium'}`} />
                    <div>
                      <p className="text-[11px] text-foreground leading-relaxed">{trigger.description}</p>
                      <span className="text-[10px] text-muted-foreground capitalize">{trigger.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Case Summary */}
          <div className="card-surface p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-xs font-medium">Case Guidance</h3>
            </div>
            <div className="space-y-2">
              <div className="bg-destructive/5 border border-destructive/10 rounded-md p-2">
                <span className="text-[10px] font-semibold text-destructive block mb-0.5">Primary Pattern</span>
                <span className="text-[11px] text-foreground">{cluster.top_abuse_reason}</span>
              </div>
              <div className="space-y-1">
                {summaryPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">{p.trim()}</span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-md p-2">
                <span className="text-[10px] font-semibold text-primary block mb-0.5">Recommended</span>
                <span className="text-[11px] text-foreground capitalize">{cluster.recommended_action.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {/* Quick Risk Snapshot */}
          <div className="card-surface p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-medium">Risk Snapshot</h3>
            </div>
            <div className="space-y-1.5">
              <SnapshotRow label="Abuse Type" value={cluster.abuse_type.replace(/_/g, ' ')} />
              <SnapshotRow label="Risk Score" value={`${cluster.risk_score}/100`} highlight={cluster.risk_score >= 80} />
              <SnapshotRow label="Exposure" value={formatCurrency(Number(cluster.exposure))} />
              <SnapshotRow label="Edges" value={String((edges || []).length)} />
              <SnapshotRow label="Last Active" value={formatDate(cluster.last_activity)} />
              <SnapshotRow label="Created" value={formatDate(cluster.created_at)} />
            </div>
          </div>

          {/* Pipeline Score */}
          {scoreResult && (
            <div className="card-surface p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-medium">Pipeline Score</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono ml-auto">{scoreResult.score_version}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-2xl font-bold ${scoreResult.score >= 80 ? 'text-destructive' : scoreResult.score >= 60 ? 'text-risk-high' : scoreResult.score >= 35 ? 'text-risk-medium' : 'text-risk-low'}`}>
                  {scoreResult.score}
                </div>
                <div>
                  <RiskBadge level={scoreResult.risk_band as any} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Scored {formatDateTime(scoreResult.scored_at)}</p>
                </div>
              </div>
              {scoreResult.top_reasons.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Top Risk Signals</p>
                  {scoreResult.top_reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-destructive mt-1.5 shrink-0" />
                      <span className="text-[10px] text-foreground leading-relaxed">{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Derived Features */}
          {derivedFeatures && (
            <div className="card-surface p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-medium">Computed Features</h3>
              </div>
              <div className="space-y-1.5">
                <SnapshotRow label="Linked Accounts" value={String(derivedFeatures.linked_accounts_count)} />
                <SnapshotRow label="Unique PMs" value={String(derivedFeatures.unique_payment_methods)} />
                <SnapshotRow label="Unique Devices" value={String(derivedFeatures.unique_devices)} />
                <SnapshotRow label="Unique IPs" value={String(derivedFeatures.unique_ips)} />
                <SnapshotRow label="Refunds (30d)" value={String(derivedFeatures.refunds_30d)} highlight={derivedFeatures.refunds_30d >= 3} />
                <SnapshotRow label="Disputes (90d)" value={String(derivedFeatures.disputes_90d)} highlight={derivedFeatures.disputes_90d > 0} />
                <SnapshotRow label="Refund Rate (90d)" value={`${(Number(derivedFeatures.refund_rate_90d) * 100).toFixed(0)}%`} highlight={Number(derivedFeatures.refund_rate_90d) > 0.3} />
                <SnapshotRow label="Promo (30d)" value={String(derivedFeatures.promo_redemptions_30d)} highlight={derivedFeatures.promo_redemptions_30d >= 2} />
                <SnapshotRow label="PM Reuse" value={String(derivedFeatures.payment_method_reuse)} highlight={derivedFeatures.payment_method_reuse >= 3} />
                <SnapshotRow label="Device Reuse" value={String(derivedFeatures.device_reuse)} highlight={derivedFeatures.device_reuse >= 3} />
                {derivedFeatures.velocity_signups_24h > 0 && <SnapshotRow label="Signups (24h)" value={String(derivedFeatures.velocity_signups_24h)} highlight />}
                {derivedFeatures.velocity_refunds_7d > 0 && <SnapshotRow label="Refunds (7d)" value={String(derivedFeatures.velocity_refunds_7d)} highlight />}
              </div>
              <p className="text-[9px] text-muted-foreground mt-2 pt-2 border-t border-border">Computed {formatDateTime(derivedFeatures.computed_at)}</p>
            </div>
          )}

          {/* Operator Notes */}
          <div className="card-surface p-3">
            <h3 className="text-xs font-medium mb-2">Investigation Notes</h3>
            {(notes || []).length > 0 && (
              <div className="space-y-1.5 mb-2">
                {(notes || []).map(n => (
                  <div key={n.id} className="text-[11px] p-2 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-foreground leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="font-medium">{n.analyst_name}</span>
                      <span>·</span>
                      <span>{formatDateTime(n.created_at)}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
            {(notes || []).length === 0 && (
              <p className="text-[10px] text-muted-foreground mb-2">No notes yet — document your findings below.</p>
            )}
            <Textarea placeholder="Document findings, rationale, or next steps…" className="text-xs resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} />
            <Button size="sm" className="mt-1.5 text-xs gap-1.5 h-7" disabled={!note.trim() || addNote.isPending} onClick={handleAddNote}>
              <StickyNote className="h-3 w-3" />{addNote.isPending ? 'Saving…' : 'Add Note'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPITile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card-surface p-2.5 text-center ${highlight ? 'ring-1 ring-destructive/20' : ''}`}>
      <p className={`text-lg font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/30">
      <span className="text-sm">{icon}</span>
      <div>
        <span className="text-xs font-bold text-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground ml-1">{label}</span>
      </div>
    </div>
  );
}

function SourceSection({ title, icon, count, ids, renderItem }: { title: string; icon: string; count: number; ids: string[]; renderItem: (id: string) => React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{icon}</span>
        <h4 className="text-xs font-medium">{title} ({count})</h4>
      </div>
      <div className="space-y-1">{ids.map(id => renderItem(id))}</div>
    </div>
  );
}

function EmptyTab({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="py-8 px-4 text-center">
      <div className="text-muted-foreground mx-auto mb-2 flex justify-center">{icon}</div>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

function SnapshotRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}