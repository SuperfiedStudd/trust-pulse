import { Sparkles, Network, Shield, Activity, AlertTriangle, ChevronRight } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DbCluster, DbLinkEdge, DbRuleTrigger } from "@/hooks/useSupabaseData";
import type { SimNode } from "./types";
import { edgeColors } from "./types";

interface InspectorPanelProps {
  selectedNode: SimNode | null;
  selectedNodeId: string | null;
  connectedEdges: DbLinkEdge[];
  activeCluster: DbCluster | null;
  ruleTriggers: DbRuleTrigger[];
  nodeMap: Map<string, SimNode>;
}

function ClusterOverview({ cluster, ruleTriggers }: { cluster: DbCluster; ruleTriggers: DbRuleTrigger[] }) {
  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Network className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground">Cluster Overview</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-md p-2">
          <span className="text-[10px] text-muted-foreground block">Cluster ID</span>
          <span className="font-mono font-medium text-[11px]">{cluster.id}</span>
        </div>
        <div className="bg-muted/50 rounded-md p-2">
          <span className="text-[10px] text-muted-foreground block">Risk Score</span>
          <span className="font-bold text-sm">{cluster.risk_score}</span>
        </div>
        <div className="bg-muted/50 rounded-md p-2">
          <span className="text-[10px] text-muted-foreground block">Abuse Type</span>
          <span className="font-medium capitalize">{cluster.abuse_type.replace(/_/g, ' ')}</span>
        </div>
        <div className="bg-muted/50 rounded-md p-2">
          <span className="text-[10px] text-muted-foreground block">Linked Accounts</span>
          <span className="font-bold">{cluster.linked_accounts}</span>
        </div>
        <div className="bg-muted/50 rounded-md p-2">
          <span className="text-[10px] text-muted-foreground block">Exposure</span>
          <span className="font-bold">${cluster.exposure.toLocaleString()}</span>
        </div>
        <div className="bg-muted/50 rounded-md p-2">
          <span className="text-[10px] text-muted-foreground block">Status</span>
          <span className="font-medium capitalize">{cluster.status}</span>
        </div>
      </div>

      <div className="bg-muted/50 rounded-md p-2">
        <span className="text-[10px] text-muted-foreground block mb-1">Activity</span>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
          <div><span className="font-bold block">{cluster.trial_signups}</span>Trials</div>
          <div><span className="font-bold block">{cluster.refunds}</span>Refunds</div>
          <div><span className="font-bold block">{cluster.payment_attempts}</span>Payments</div>
          <div><span className="font-bold block">{cluster.disputes}</span>Disputes</div>
        </div>
      </div>

      {ruleTriggers.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span className="font-medium text-[11px]">Rule Triggers</span>
          </div>
          <div className="space-y-1">
            {ruleTriggers.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-start gap-1.5 text-[10px]">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                  t.severity === 'critical' ? 'bg-destructive' : t.severity === 'high' ? 'bg-risk-high' : 'bg-risk-medium'
                }`} />
                <span className="text-muted-foreground leading-tight">{t.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NodeDetail({ node, connectedEdges, selectedNodeId, nodeMap }: {
  node: SimNode; connectedEdges: DbLinkEdge[]; selectedNodeId: string; nodeMap: Map<string, SimNode>;
}) {
  const neighbors = new Map<string, SimNode>();
  connectedEdges.forEach(e => {
    const otherId = e.source_id === selectedNodeId ? e.target_id : e.source_id;
    const other = nodeMap.get(otherId);
    if (other) neighbors.set(otherId, other);
  });

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground">Entity Detail</span>
      </div>

      <div className="space-y-1.5">
        <Row label="ID" value={<span className="font-mono text-[10px]">{node.id}</span>} />
        <Row label="Type" value={<span className="capitalize font-medium">{node.type.replace('_', ' ')}</span>} />
        <Row label="Risk" value={<RiskBadge level={node.riskLevel as any} />} />
        <Row label="Label" value={<span className="font-medium break-all">{node.label}</span>} />
        <Row label="Connections" value={<span className="font-bold">{connectedEdges.length}</span>} />
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-[11px]">Connected Edges ({connectedEdges.length})</span>
        </div>
        <div className="space-y-1">
          {connectedEdges.map(e => {
            const otherId = e.source_id === selectedNodeId ? e.target_id : e.source_id;
            const other = nodeMap.get(otherId);
            return (
              <div key={e.id} className="flex items-center gap-1.5 text-[10px] bg-muted/40 rounded px-1.5 py-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: edgeColors[e.edge_type] || '#999' }} />
                <span className="text-muted-foreground truncate flex-1">{e.label}</span>
                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-[9px] truncate max-w-[80px]">{other?.label || otherId}</span>
              </div>
            );
          })}
        </div>
      </div>

      {neighbors.size > 0 && (
        <div>
          <span className="font-medium text-[11px] block mb-1.5">Related Entities ({neighbors.size})</span>
          <div className="flex flex-wrap gap-1">
            {Array.from(neighbors.values()).map(n => (
              <span key={n.id} className="inline-flex items-center gap-1 text-[10px] bg-muted/60 rounded px-1.5 py-0.5">
                <span className="capitalize">{n.type.replace('_', ' ')}</span>
                <RiskBadge level={n.riskLevel as any} className="text-[8px] px-1 py-0" />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      {value}
    </div>
  );
}

function RiskExplanation({ cluster }: { cluster: DbCluster }) {
  // Break AI summary into structured points
  const points = cluster.ai_summary
    .split(/[.!]\s+/)
    .filter(s => s.trim().length > 10)
    .slice(0, 4);

  return (
    <div className="p-3 border-t border-border">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold">Case Guidance</span>
      </div>

      <div className="space-y-2 text-[10px]">
        <div className="bg-destructive/5 border border-destructive/10 rounded-md p-2">
          <span className="font-semibold text-destructive block mb-0.5">Primary Pattern</span>
          <span className="text-muted-foreground">{cluster.top_abuse_reason}</span>
        </div>

        <div className="space-y-1">
          {points.map((p, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
              <span className="text-muted-foreground leading-relaxed">{p.trim()}</span>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-md p-2">
          <span className="font-semibold text-primary block mb-0.5">Recommended Action</span>
          <span className="text-muted-foreground capitalize">{cluster.recommended_action.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
}

export function InspectorPanel({
  selectedNode, selectedNodeId, connectedEdges,
  activeCluster, ruleTriggers, nodeMap,
}: InspectorPanelProps) {
  return (
    <div className="w-72 shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-card">
        <h3 className="text-xs font-semibold tracking-tight text-foreground">
          {selectedNode ? 'Entity Inspector' : 'Cluster Intel'}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        {selectedNode && selectedNodeId ? (
          <NodeDetail
            node={selectedNode}
            connectedEdges={connectedEdges}
            selectedNodeId={selectedNodeId}
            nodeMap={nodeMap}
          />
        ) : activeCluster ? (
          <ClusterOverview cluster={activeCluster} ruleTriggers={ruleTriggers} />
        ) : (
          <div className="p-4 text-xs text-muted-foreground">Select a cluster to begin investigation</div>
        )}
      </ScrollArea>

      {activeCluster && <RiskExplanation cluster={activeCluster} />}
    </div>
  );
}
