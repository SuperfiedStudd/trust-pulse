import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClusters, useAccounts, useDevices, usePaymentMethods, useIpAddresses } from "@/hooks/useSupabaseData";

interface SearchResult {
  id: string;
  type: 'cluster' | 'account' | 'device' | 'payment_method' | 'ip';
  label: string;
  sublabel: string;
  risk: string;
  route: string;
}

const typeIcons: Record<string, string> = {
  cluster: '🔗',
  account: '👤',
  device: '💻',
  payment_method: '💳',
  ip: '🌐',
};

const typeLabels: Record<string, string> = {
  cluster: 'Cluster',
  account: 'Account',
  device: 'Device',
  payment_method: 'Payment',
  ip: 'IP Address',
};

export function TopNav() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: clusters } = useClusters();
  const { data: accounts } = useAccounts();
  const { data: devices } = useDevices();
  const { data: pms } = usePaymentMethods();
  const { data: ips } = useIpAddresses();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); inputRef.current?.focus(); }
      if (e.key === 'Escape') { setOpen(false); setQuery(""); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    const out: SearchResult[] = [];
    const limit = 12;

    (clusters || []).forEach(c => {
      if (out.length >= limit) return;
      if (c.id.toLowerCase().includes(q) || c.top_abuse_reason.toLowerCase().includes(q) || c.abuse_type.toLowerCase().includes(q)) {
        out.push({ id: c.id, type: 'cluster', label: c.id, sublabel: `${c.top_abuse_reason} · Score ${c.risk_score}`, risk: c.risk_level, route: `/entity/${c.id}` });
      }
    });
    (accounts || []).forEach(a => {
      if (out.length >= limit) return;
      if (a.id.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) {
        out.push({ id: a.id, type: 'account', label: a.email, sublabel: `${a.name} · ${a.id}`, risk: a.risk_level, route: a.cluster_id ? `/entity/${a.cluster_id}` : '/entities' });
      }
    });
    (devices || []).forEach(d => {
      if (out.length >= limit) return;
      if (d.id.toLowerCase().includes(q) || d.fingerprint.toLowerCase().includes(q)) {
        out.push({ id: d.id, type: 'device', label: `${d.fingerprint.slice(0, 12)}…`, sublabel: `${d.os} · ${d.browser} · ${d.account_count} accounts`, risk: d.risk_level, route: '/entities' });
      }
    });
    (pms || []).forEach(p => {
      if (out.length >= limit) return;
      if (p.id.toLowerCase().includes(q) || p.last4.includes(q) || p.brand.toLowerCase().includes(q)) {
        out.push({ id: p.id, type: 'payment_method', label: `${p.brand} ····${p.last4}`, sublabel: `${p.account_count} accounts · ${p.total_transactions} txns`, risk: p.risk_level, route: '/entities' });
      }
    });
    (ips || []).forEach(ip => {
      if (out.length >= limit) return;
      if (ip.id.toLowerCase().includes(q) || ip.address.toLowerCase().includes(q) || ip.location.toLowerCase().includes(q)) {
        out.push({ id: ip.id, type: 'ip', label: ip.address, sublabel: `${ip.location}${ip.is_vpn ? ' · VPN' : ''} · ${ip.account_count} accounts`, risk: ip.risk_level, route: '/entities' });
      }
    });

    return out;
  }, [query, clusters, accounts, devices, pms, ips]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.route);
    setOpen(false);
    setQuery("");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground text-sm">Trust Graph</span>
          <span className="text-muted-foreground">for Subscription Abuse Ops</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div ref={containerRef} className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            placeholder="Search clusters, accounts, IPs… ⌘K"
            className="h-8 w-72 pl-8 pr-8 text-xs bg-muted/50 border-border"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { if (query.length >= 2) setOpen(true); }}
          />
          {query && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { setQuery(""); setOpen(false); }}>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}

          {open && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 w-96 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-border">
                <span className="text-[10px] text-muted-foreground font-medium">{results.length} result{results.length !== 1 ? 's' : ''}</span>
              </div>
              <ScrollArea className="max-h-80">
                <div className="py-1">
                  {results.map(r => (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelect(r)}
                    >
                      <span className="text-sm">{typeIcons[r.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-foreground truncate">{r.label}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{typeLabels[r.type]}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{r.sublabel}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize shrink-0 ${
                        r.risk === 'critical' ? 'bg-risk-critical-bg text-risk-critical-foreground' :
                        r.risk === 'high' ? 'bg-risk-high-bg text-risk-high-foreground' :
                        r.risk === 'medium' ? 'bg-risk-medium-bg text-risk-medium-foreground' :
                        'bg-risk-low-bg text-risk-low-foreground'
                      }`}>{r.risk}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {open && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full mt-1 left-0 w-96 bg-popover border border-border rounded-lg shadow-xl z-50 p-4">
              <p className="text-xs text-muted-foreground text-center">No results for "{query}"</p>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hidden md:flex">
          <span>Acme Corp</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hidden md:flex">
          <Calendar className="h-3 w-3" />
          <span>Last 7 days</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
            3
          </Badge>
        </Button>

        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground">
          SC
        </div>
      </div>
    </header>
  );
}
