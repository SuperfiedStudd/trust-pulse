import { useState, useMemo, useRef, useCallback } from "react";
import { useClusters, useLinkEdges, useAccounts, useDevices, usePaymentMethods, useIpAddresses, useRuleTriggers } from "@/hooks/useSupabaseData";
import { GraphToolbar } from "@/components/trust-graph/GraphToolbar";
import { GraphCanvas } from "@/components/trust-graph/GraphCanvas";
import { InspectorPanel } from "@/components/trust-graph/InspectorPanel";
import type { SimNode, SimLink, EdgeType } from "@/components/trust-graph/types";

export default function TrustGraph() {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeFilter, setEdgeFilter] = useState<EdgeType | 'all'>('all');
  const [showLabels, setShowLabels] = useState(false);
  const [highlightRisk, setHighlightRisk] = useState(false);
  const [focusSuspicious, setFocusSuspicious] = useState(false);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const zoomRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void; fitBounds: (nodes: SimNode[]) => void } | null>(null);

  const { data: clusters, isLoading: clustersLoading } = useClusters();
  const { data: allAccounts } = useAccounts();
  const { data: allDevices } = useDevices();
  const { data: allPMs } = usePaymentMethods();
  const { data: allIPs } = useIpAddresses();

  const activeClusterId = selectedClusterId || (clusters?.[0]?.id ?? null);
  const { data: edges, isLoading: edgesLoading } = useLinkEdges(activeClusterId || undefined);
  const { data: ruleTriggers } = useRuleTriggers(activeClusterId || undefined);
  const activeCluster = clusters?.find(c => c.id === activeClusterId);

  const accountMap = useMemo(() => {
    const m = new Map<string, { email: string; risk_level: string }>();
    (allAccounts || []).forEach(a => m.set(a.id, { email: a.email, risk_level: a.risk_level }));
    return m;
  }, [allAccounts]);
  const deviceMap = useMemo(() => {
    const m = new Map<string, { fingerprint: string; risk_level: string }>();
    (allDevices || []).forEach(d => m.set(d.id, { fingerprint: d.fingerprint, risk_level: d.risk_level }));
    return m;
  }, [allDevices]);
  const pmMap = useMemo(() => {
    const m = new Map<string, { brand: string; last4: string; risk_level: string }>();
    (allPMs || []).forEach(p => m.set(p.id, { brand: p.brand, last4: p.last4, risk_level: p.risk_level }));
    return m;
  }, [allPMs]);
  const ipMap = useMemo(() => {
    const m = new Map<string, { address: string; risk_level: string }>();
    (allIPs || []).forEach(ip => m.set(ip.id, { address: ip.address, risk_level: ip.risk_level }));
    return m;
  }, [allIPs]);

  const filteredEdges = useMemo(() => {
    const e = edges || [];
    return edgeFilter === 'all' ? e : e.filter(ed => ed.edge_type === edgeFilter);
  }, [edges, edgeFilter]);

  const nodeMap = useMemo(() => new Map(simNodes.map(n => [n.id, n])), [simNodes]);
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) || null : null;
  const connectedEdges = (edges || []).filter(e => e.source_id === selectedNodeId || e.target_id === selectedNodeId);

  const handleClusterChange = useCallback((id: string) => {
    setSelectedClusterId(id);
    setSelectedNodeId(null);
    setHighlightRisk(false);
    setFocusSuspicious(false);
  }, []);

  const handleSimReady = useCallback((nodes: SimNode[], links: SimLink[]) => {
    setSimNodes(nodes);
    setSimLinks(links);
  }, []);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] max-w-full">
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        <GraphToolbar
          clusters={clusters || []}
          activeClusterId={activeClusterId}
          onClusterChange={handleClusterChange}
          edgeFilter={edgeFilter}
          onEdgeFilterChange={setEdgeFilter}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(v => !v)}
          highlightRisk={highlightRisk}
          onHighlightRisk={() => setHighlightRisk(v => !v)}
          focusSuspicious={focusSuspicious}
          onToggleFocusSuspicious={() => setFocusSuspicious(v => !v)}
          onZoomIn={() => zoomRef.current?.zoomIn()}
          onZoomOut={() => zoomRef.current?.zoomOut()}
          onReset={() => zoomRef.current?.reset()}
          nodeCount={simNodes.length}
          edgeCount={simLinks.length}
        />

        {clustersLoading || edgesLoading ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <p className="text-xs text-muted-foreground">Loading graph…</p>
          </div>
        ) : filteredEdges.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <p className="text-xs text-muted-foreground">No edges found for this cluster</p>
          </div>
        ) : (
          <GraphCanvas
            filteredEdges={filteredEdges}
            accountMap={accountMap}
            deviceMap={deviceMap}
            pmMap={pmMap}
            ipMap={ipMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            showLabels={showLabels}
            highlightRisk={highlightRisk}
            focusSuspicious={focusSuspicious}
            allEdges={edges || []}
            onSimReady={handleSimReady}
            zoomRef={zoomRef}
          />
        )}
      </div>

      <InspectorPanel
        selectedNode={selectedNode}
        selectedNodeId={selectedNodeId}
        connectedEdges={connectedEdges}
        activeCluster={activeCluster || null}
        ruleTriggers={ruleTriggers || []}
        nodeMap={nodeMap}
      />
    </div>
  );
}
