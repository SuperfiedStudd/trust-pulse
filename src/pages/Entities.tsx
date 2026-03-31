import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpDown } from "lucide-react";
import { useAccounts, useClusters, useDevices, usePaymentMethods, useIpAddresses } from "@/hooks/useSupabaseData";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

type TabType = 'accounts' | 'devices' | 'payment_methods' | 'ips' | 'clusters';
const PAGE_SIZE = 25;

export default function Entities() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data: accounts, isLoading: accLoading } = useAccounts();
  const { data: clusters, isLoading: clLoading } = useClusters();
  const { data: devices, isLoading: devLoading } = useDevices();
  const { data: paymentMethods, isLoading: pmLoading } = usePaymentMethods();
  const { data: ipRecords, isLoading: ipLoading } = useIpAddresses();

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'accounts', label: 'Accounts', count: accounts?.length || 0 },
    { key: 'devices', label: 'Devices', count: devices?.length || 0 },
    { key: 'payment_methods', label: 'Payment Methods', count: paymentMethods?.length || 0 },
    { key: 'ips', label: 'IP Addresses', count: ipRecords?.length || 0 },
    { key: 'clusters', label: 'Clusters', count: clusters?.length || 0 },
  ];

  const isLoading = activeTab === 'accounts' ? accLoading : activeTab === 'devices' ? devLoading : activeTab === 'payment_methods' ? pmLoading : activeTab === 'ips' ? ipLoading : clLoading;

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(0);
  };

  const SortHeader = ({ field, label, className = '' }: { field: string; label: string; className?: string }) => (
    <th className={`table-header py-2.5 px-3 cursor-pointer select-none hover:text-foreground ${className}`} onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/50'}`} /></span>
    </th>
  );

  // Generic sort + filter + paginate
  const processData = <T extends Record<string, any>>(data: T[] | undefined, searchFn: (item: T) => boolean): { paged: T[]; total: number } => {
    let items = (data || []).filter(searchFn);
    if (sortField) {
      items = [...items].sort((a, b) => {
        const av = typeof a[sortField] === 'number' ? a[sortField] : 0;
        const bv = typeof b[sortField] === 'number' ? b[sortField] : 0;
        return sortDir === 'desc' ? bv - av : av - bv;
      });
    }
    return { paged: items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), total: items.length };
  };

  const switchTab = (tab: TabType) => { setActiveTab(tab); setPage(0); setSortField(''); setSearch(''); };

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Entities</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Browse and search all system entities</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search entities..." className="h-8 w-64 pl-8 text-xs" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
      </div>

      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button key={tab.key} className={`px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => switchTab(tab.key)}>
            {tab.label}<span className="ml-1.5 text-[10px] text-muted-foreground">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <>
            {activeTab === 'accounts' && (() => {
              const { paged: rows, total } = processData(accounts, a => !search || a.email.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()));
              return (<>
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="table-header text-left py-2.5 px-3">Account ID</th>
                    <th className="table-header text-left py-2.5 px-3">Email</th>
                    <th className="table-header text-left py-2.5 px-3">Risk</th>
                    <th className="table-header text-left py-2.5 px-3">Cluster</th>
                    <SortHeader field="trial_count" label="Trials" className="text-center" />
                    <SortHeader field="refund_count" label="Refunds" className="text-center" />
                    <th className="table-header text-left py-2.5 px-3">Status</th>
                    <th className="table-header text-left py-2.5 px-3">Last Activity</th>
                  </tr></thead>
                  <tbody>
                    {rows.map(a => (
                      <tr key={a.id} className={`border-b border-border last:border-0 transition-colors ${a.cluster_id ? 'hover:bg-muted/30 cursor-pointer' : 'opacity-70'}`} onClick={() => a.cluster_id && navigate(`/entity/${a.cluster_id}`)}>
                        <td className="py-2.5 px-3 text-xs font-mono font-medium">{a.id}</td>
                        <td className="py-2.5 px-3 text-xs">{a.email}</td>
                        <td className="py-2.5 px-3"><RiskBadge level={a.risk_level as any} /></td>
                        <td className="py-2.5 px-3 text-xs font-mono text-primary">{a.cluster_id || '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-center">{a.trial_count}</td>
                        <td className="py-2.5 px-3 text-xs text-center">{a.refund_count}</td>
                        <td className="py-2.5 px-3 text-xs capitalize">{a.status}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{formatDateTime(a.last_activity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
              </>);
            })()}

            {activeTab === 'devices' && (() => {
              const { paged: rows, total } = processData(devices, d => !search || d.id.toLowerCase().includes(search.toLowerCase()) || d.fingerprint.toLowerCase().includes(search.toLowerCase()));
              return (<>
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="table-header text-left py-2.5 px-3">Device ID</th>
                    <th className="table-header text-left py-2.5 px-3">Fingerprint</th>
                    <th className="table-header text-left py-2.5 px-3">Type</th>
                    <th className="table-header text-left py-2.5 px-3">OS / Browser</th>
                    <th className="table-header text-left py-2.5 px-3">Risk</th>
                    <SortHeader field="account_count" label="Accounts" className="text-center" />
                    <th className="table-header text-left py-2.5 px-3">Last Seen</th>
                  </tr></thead>
                  <tbody>
                    {rows.map(d => (
                      <tr key={d.id} className="border-b border-border last:border-0 transition-colors text-muted-foreground/80">
                        <td className="py-2.5 px-3 text-xs font-mono font-medium">{d.id}</td>
                        <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{d.fingerprint}</td>
                        <td className="py-2.5 px-3 text-xs">{d.type}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.os} / {d.browser}</td>
                        <td className="py-2.5 px-3"><RiskBadge level={d.risk_level as any} /></td>
                        <td className="py-2.5 px-3 text-xs text-center">{d.account_count}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{formatDateTime(d.last_seen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
              </>);
            })()}

            {activeTab === 'payment_methods' && (() => {
              const { paged: rows, total } = processData(paymentMethods, pm => !search || pm.id.toLowerCase().includes(search.toLowerCase()) || pm.brand.toLowerCase().includes(search.toLowerCase()));
              return (<>
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="table-header text-left py-2.5 px-3">ID</th>
                    <th className="table-header text-left py-2.5 px-3">Brand</th>
                    <th className="table-header text-left py-2.5 px-3">Last 4</th>
                    <th className="table-header text-left py-2.5 px-3">Type</th>
                    <th className="table-header text-left py-2.5 px-3">Risk</th>
                    <SortHeader field="account_count" label="Accounts" className="text-center" />
                    <SortHeader field="total_transactions" label="Transactions" className="text-center" />
                    <SortHeader field="total_refunds" label="Refunds" className="text-center" />
                  </tr></thead>
                  <tbody>
                    {rows.map(pm => (
                      <tr key={pm.id} className="border-b border-border last:border-0 transition-colors text-muted-foreground/80">
                        <td className="py-2.5 px-3 text-xs font-mono font-medium">{pm.id}</td>
                        <td className="py-2.5 px-3 text-xs">{pm.brand}</td>
                        <td className="py-2.5 px-3 text-xs font-mono">•••• {pm.last4}</td>
                        <td className="py-2.5 px-3 text-xs capitalize">{pm.type}</td>
                        <td className="py-2.5 px-3"><RiskBadge level={pm.risk_level as any} /></td>
                        <td className="py-2.5 px-3 text-xs text-center">{pm.account_count}</td>
                        <td className="py-2.5 px-3 text-xs text-center">{pm.total_transactions}</td>
                        <td className="py-2.5 px-3 text-xs text-center">{pm.total_refunds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
              </>);
            })()}

            {activeTab === 'ips' && (() => {
              const { paged: rows, total } = processData(ipRecords, ip => !search || ip.address.toLowerCase().includes(search.toLowerCase()) || ip.location.toLowerCase().includes(search.toLowerCase()));
              return (<>
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="table-header text-left py-2.5 px-3">ID</th>
                    <th className="table-header text-left py-2.5 px-3">Address</th>
                    <th className="table-header text-left py-2.5 px-3">Location</th>
                    <th className="table-header text-left py-2.5 px-3">Risk</th>
                    <SortHeader field="account_count" label="Accounts" className="text-center" />
                    <th className="table-header text-center py-2.5 px-3">VPN</th>
                    <th className="table-header text-left py-2.5 px-3">Last Seen</th>
                  </tr></thead>
                  <tbody>
                    {rows.map(ip => (
                      <tr key={ip.id} className="border-b border-border last:border-0 transition-colors text-muted-foreground/80">
                        <td className="py-2.5 px-3 text-xs font-mono font-medium">{ip.id}</td>
                        <td className="py-2.5 px-3 text-xs font-mono">{ip.address}</td>
                        <td className="py-2.5 px-3 text-xs">{ip.location}</td>
                        <td className="py-2.5 px-3"><RiskBadge level={ip.risk_level as any} /></td>
                        <td className="py-2.5 px-3 text-xs text-center">{ip.account_count}</td>
                        <td className="py-2.5 px-3 text-xs text-center">{ip.is_vpn ? '🔒 Yes' : 'No'}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{formatDateTime(ip.last_seen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
              </>);
            })()}

            {activeTab === 'clusters' && (() => {
              const { paged: rows, total } = processData(clusters, c => !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.top_abuse_reason.toLowerCase().includes(search.toLowerCase()));
              return (<>
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="table-header text-left py-2.5 px-3">Cluster ID</th>
                    <th className="table-header text-left py-2.5 px-3">Risk</th>
                    <SortHeader field="linked_accounts" label="Accounts" className="text-center" />
                    <th className="table-header text-left py-2.5 px-3">Type</th>
                    <SortHeader field="exposure" label="Exposure" className="text-right" />
                    <th className="table-header text-left py-2.5 px-3">Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.map(c => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/entity/${c.id}`)}>
                        <td className="py-2.5 px-3 text-xs font-mono font-medium">{c.id}</td>
                        <td className="py-2.5 px-3"><RiskBadge level={c.risk_level as any} /></td>
                        <td className="py-2.5 px-3 text-xs text-center">{c.linked_accounts}</td>
                        <td className="py-2.5 px-3 text-xs">{c.top_abuse_reason}</td>
                        <td className="py-2.5 px-3 text-xs text-right font-medium">${Number(c.exposure).toLocaleString()}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={c.status as any} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
              </>);
            })()}
          </>
        )}
      </div>
    </div>
  );
}
