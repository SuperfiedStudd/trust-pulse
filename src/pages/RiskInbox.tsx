import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ChevronDown, Check, Send, Ban, ShieldCheck, Gift, ArrowUpDown, Inbox, X } from "lucide-react";
import { useClusters, useBulkClusterAction } from "@/hooks/useSupabaseData";
import { formatCurrency, type RiskLevel, type AbuseType, type ReviewStatus } from "@/data/mockData";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActionButton } from "@/components/shared/ActionButton";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type SortField = 'risk_score' | 'linked_accounts' | 'exposure' | 'last_activity';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 25;

export default function RiskInbox() {
  const navigate = useNavigate();
  const { data: clusters, isLoading, error } = useClusters();
  const bulkAction = useBulkClusterAction();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [abuseFilter, setAbuseFilter] = useState<AbuseType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [actionPending, setActionPending] = useState(false);

  const allClusters = clusters || [];
  const pendingCount = allClusters.filter(c => c.status === 'pending').length;
  const criticalCount = allClusters.filter(c => c.risk_level === 'critical' || c.risk_level === 'high').length;

  const filtered = useMemo(() => {
    let result = allClusters.filter(c => {
      if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.top_abuse_reason.toLowerCase().includes(search.toLowerCase())) return false;
      if (riskFilter !== 'all' && c.risk_level !== riskFilter) return false;
      if (abuseFilter !== 'all' && c.abuse_type !== abuseFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      let av: number, bv: number;
      if (sortField === 'risk_score') { av = a.risk_score; bv = b.risk_score; }
      else if (sortField === 'linked_accounts') { av = a.linked_accounts; bv = b.linked_accounts; }
      else if (sortField === 'exposure') { av = Number(a.exposure); bv = Number(b.exposure); }
      else { av = 0; bv = 0; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [allClusters, search, riskFilter, abuseFilter, statusFilter, sortField, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(0);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map(c => c.id)));
  };

  const handleBulkAction = async (actionType: string, newStatus: string, label: string) => {
    if (selected.size === 0) return;
    setActionPending(true);
    try {
      await bulkAction.mutateAsync({ clusterIds: Array.from(selected), actionType, newStatus });
      toast.success(`${label} applied to ${selected.size} cluster${selected.size > 1 ? 's' : ''}`, {
        description: `Status → ${newStatus}. Changes are now live.`,
      });
      setSelected(new Set());
    } catch {
      toast.error(`Failed to apply ${label}`, { description: 'Check your connection and retry.' });
    } finally {
      setActionPending(false);
    }
  };

  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <th className={`table-header py-2 px-3 cursor-pointer select-none hover:text-foreground transition-colors ${className}`} onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 transition-colors ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`} />
      </span>
    </th>
  );

  const selectedExposure = useMemo(() => {
    return allClusters.filter(c => selected.has(c.id)).reduce((s, c) => s + Number(c.exposure), 0);
  }, [selected, allClusters]);

  return (
    <div className="space-y-3 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Risk Inbox</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} clusters · <span className="font-medium text-risk-high-foreground">{pendingCount} pending</span> · {criticalCount} high/critical
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select className="h-7 text-xs border border-border rounded-md px-2 bg-card text-foreground" value={riskFilter} onChange={e => { setRiskFilter(e.target.value as any); setPage(0); }}>
          <option value="all">All Risk</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="h-7 text-xs border border-border rounded-md px-2 bg-card text-foreground" value={abuseFilter} onChange={e => { setAbuseFilter(e.target.value as any); setPage(0); }}>
          <option value="all">All Abuse Types</option>
          <option value="trial_abuse">Trial Abuse</option>
          <option value="refund_cycling">Refund Cycling</option>
          <option value="promo_abuse">Promo Abuse</option>
          <option value="payment_reuse">Payment Reuse</option>
          <option value="device_burst">Device Burst</option>
        </select>
        <select className="h-7 text-xs border border-border rounded-md px-2 bg-card text-foreground" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(0); }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="blocked">Blocked</option>
          <option value="approved">Approved</option>
        </select>
        <Input placeholder="Search by ID or reason…" className="h-7 text-xs w-52 bg-card" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        {(riskFilter !== 'all' || abuseFilter !== 'all' || statusFilter !== 'all' || search) && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { setRiskFilter('all'); setAbuseFilter('all'); setStatusFilter('all'); setSearch(''); setPage(0); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Failed to load clusters. Check your connection and retry.</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No clusters match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Adjust risk level, abuse type, or status filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="table-header text-left py-2 px-3 w-8"><Checkbox checked={selected.size === paged.length && paged.length > 0} onCheckedChange={toggleAll} /></th>
                    <th className="table-header text-left py-2 px-3">Cluster</th>
                    <SortHeader field="risk_score" label="Risk" className="text-left" />
                    <SortHeader field="linked_accounts" label="Accounts" className="text-center" />
                    <SortHeader field="exposure" label="Exposure" className="text-right" />
                    <th className="table-header text-left py-2 px-3">Abuse Pattern</th>
                    <th className="table-header text-left py-2 px-3">Action</th>
                    <th className="table-header text-left py-2 px-3">Status</th>
                    <th className="table-header text-left py-2 px-3">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => {
                    const isSelected = selected.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-border last:border-0 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 hover:bg-primary/15 ring-inset ring-1 ring-primary/30'
                            : 'hover:bg-muted/40'
                        }`}
                        onClick={() => navigate(`/entity/${c.id}`)}
                      >
                        <td className="py-2 px-3" onClick={e => { e.stopPropagation(); toggleSelect(c.id); }}><Checkbox checked={isSelected} /></td>
                        <td className="py-2 px-3">
                          <span className="text-xs font-mono font-medium">{c.id}</span>
                        </td>
                        <td className="py-2 px-3"><RiskBadge level={c.risk_level as any} /></td>
                        <td className="py-2 px-3 text-xs text-center font-medium">{c.linked_accounts}</td>
                        <td className="py-2 px-3 text-xs text-right font-medium">{formatCurrency(Number(c.exposure))}</td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{c.top_abuse_reason}</td>
                        <td className="py-2 px-3">
                          <span className="text-[11px] font-medium capitalize text-foreground">{c.recommended_action.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2 px-3"><StatusBadge status={c.status as any} /></td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{c.owner || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="card-surface p-3 flex items-center gap-3 sticky bottom-4 shadow-lg border-2 border-primary/30 ring-1 ring-primary/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{selected.size}</div>
            <div>
              <span className="text-xs font-semibold text-foreground block">cluster{selected.size > 1 ? 's' : ''} selected</span>
              <span className="text-[10px] text-muted-foreground">Exposure: {formatCurrency(selectedExposure)}</span>
            </div>
          </div>
          <div className="h-6 w-px bg-border" />
          <ActionButton label="Approve" icon={Check} variant="allow" onClick={() => handleBulkAction('allow', 'approved', 'Approve')} disabled={actionPending} />
          <ActionButton label="Review" icon={Send} variant="review" onClick={() => handleBulkAction('send_to_review', 'reviewing', 'Send to Review')} disabled={actionPending} />
          <ActionButton label="Block" icon={Ban} variant="block" onClick={() => handleBulkAction('block_trial', 'blocked', 'Block')} disabled={actionPending} />
          <ActionButton label="Verify" icon={ShieldCheck} variant="verify" onClick={() => handleBulkAction('require_verification', 'reviewing', 'Verify')} disabled={actionPending} />
          <ActionButton label="Restrict" icon={Gift} variant="restrict" onClick={() => handleBulkAction('restrict_promo', 'blocked', 'Restrict Promo')} disabled={actionPending} />
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7" onClick={() => setSelected(new Set())}>
              <X className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}