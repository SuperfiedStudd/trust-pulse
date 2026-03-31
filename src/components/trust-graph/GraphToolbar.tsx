import { ZoomIn, ZoomOut, Maximize, Tag, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DbCluster } from "@/hooks/useSupabaseData";
import type { EdgeType } from "./types";

interface GraphToolbarProps {
  clusters: DbCluster[];
  activeClusterId: string | null;
  onClusterChange: (id: string) => void;
  edgeFilter: EdgeType | 'all';
  onEdgeFilterChange: (f: EdgeType | 'all') => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  highlightRisk: boolean;
  onHighlightRisk: () => void;
  focusSuspicious: boolean;
  onToggleFocusSuspicious: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  nodeCount: number;
  edgeCount: number;
}

export function GraphToolbar({
  clusters, activeClusterId, onClusterChange,
  edgeFilter, onEdgeFilterChange,
  showLabels, onToggleLabels,
  highlightRisk, onHighlightRisk,
  focusSuspicious, onToggleFocusSuspicious,
  onZoomIn, onZoomOut, onReset,
  nodeCount, edgeCount,
}: GraphToolbarProps) {
  const activeCluster = clusters.find(c => c.id === activeClusterId);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold tracking-tight text-foreground">CLUSTER</span>
        </div>
        <select
          className="h-7 text-xs border border-border rounded-md px-2 bg-card text-foreground font-mono min-w-[220px]"
          value={activeClusterId || ''}
          onChange={e => onClusterChange(e.target.value)}
        >
          {clusters.map(c => (
            <option key={c.id} value={c.id}>
              {c.id} · {c.top_abuse_reason} · Score {c.risk_score}
            </option>
          ))}
        </select>
        {activeCluster && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
            activeCluster.risk_level === 'critical' ? 'bg-risk-critical-bg text-risk-critical-foreground' :
            activeCluster.risk_level === 'high' ? 'bg-risk-high-bg text-risk-high-foreground' :
            'bg-risk-medium-bg text-risk-medium-foreground'
          }`}>
            {activeCluster.risk_level}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground mr-1">{nodeCount}n · {edgeCount}e</span>
        <div className="h-4 w-px bg-border mx-1" />

        <select
          className="h-7 text-xs border border-border rounded-md px-2 bg-card text-foreground"
          value={edgeFilter}
          onChange={e => onEdgeFilterChange(e.target.value as any)}
        >
          <option value="all">All edges</option>
          <option value="shared_device">Shared Device</option>
          <option value="shared_card">Shared Card</option>
          <option value="shared_ip">Shared IP</option>
          <option value="timing_overlap">Timing Overlap</option>
          <option value="refund_pattern">Refund Pattern</option>
        </select>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant={focusSuspicious ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={onToggleFocusSuspicious}
          title="Focus high/critical risk entities and their neighbors"
        >
          <Eye className="h-3 w-3" />
          <span className="hidden sm:inline">Suspicious</span>
        </Button>
        <Button
          variant={showLabels ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={onToggleLabels}
          title="Toggle labels"
        >
          <Tag className="h-3 w-3" />
        </Button>
        <Button
          variant={highlightRisk ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={onHighlightRisk}
          title="Highlight high-risk nodes"
        >
          <AlertTriangle className="h-3 w-3" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={onZoomIn} title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={onZoomOut} title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={onReset} title="Fit to view"><Maximize className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
