import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as d3Force from "d3-force";
import { zoom as d3Zoom, zoomIdentity, ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import "d3-transition";
import { edgeColors, nodeColors, nodeIcons, type SimNode, type SimLink } from "./types";
import type { DbLinkEdge } from "@/hooks/useSupabaseData";

interface GraphCanvasProps {
  filteredEdges: DbLinkEdge[];
  accountMap: Map<string, { email: string; risk_level: string }>;
  deviceMap: Map<string, { fingerprint: string; risk_level: string }>;
  pmMap: Map<string, { brand: string; last4: string; risk_level: string }>;
  ipMap: Map<string, { address: string; risk_level: string }>;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  showLabels: boolean;
  highlightRisk: boolean;
  focusSuspicious: boolean;
  allEdges: DbLinkEdge[];
  onSimReady: (nodes: SimNode[], links: SimLink[]) => void;
  zoomRef: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
    fitBounds: (nodes: SimNode[]) => void;
  } | null>;
}

function buildNode(
  id: string,
  accountMap: GraphCanvasProps['accountMap'],
  deviceMap: GraphCanvasProps['deviceMap'],
  pmMap: GraphCanvasProps['pmMap'],
  ipMap: GraphCanvasProps['ipMap'],
): Omit<SimNode, 'x' | 'y'> {
  if (id.startsWith('DEV')) {
    const d = deviceMap.get(id);
    return { id, type: 'device', label: d ? `${d.fingerprint.slice(0, 8)}` : id, riskLevel: d?.risk_level || 'medium' };
  }
  if (id.startsWith('PM')) {
    const p = pmMap.get(id);
    return { id, type: 'payment_method', label: p ? `${p.brand} ···${p.last4}` : id, riskLevel: p?.risk_level || 'medium' };
  }
  if (id.startsWith('IP')) {
    const ip = ipMap.get(id);
    return { id, type: 'ip', label: ip?.address || id, riskLevel: ip?.risk_level || 'medium' };
  }
  const a = accountMap.get(id);
  return { id, type: 'account', label: a?.email || id, riskLevel: a?.risk_level || 'medium' };
}

function getConnectionCount(nodeId: string, edges: DbLinkEdge[]) {
  return edges.filter(e => e.source_id === nodeId || e.target_id === nodeId).length;
}

export function GraphCanvas({
  filteredEdges, accountMap, deviceMap, pmMap, ipMap,
  selectedNodeId, onSelectNode, showLabels, highlightRisk,
  focusSuspicious, allEdges, onSimReady, zoomRef,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3Force.Simulation<SimNode, SimLink> | null>(null);
  const dragNodeRef = useRef<string | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const zoomBehaviorRef = useRef<ReturnType<typeof d3Zoom<SVGSVGElement, unknown>> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build and run simulation
  useEffect(() => {
    if (filteredEdges.length === 0) {
      nodesRef.current = [];
      linksRef.current = [];
      onSimReady([], []);
      return;
    }

    const container = containerRef.current;
    const w = container?.clientWidth || 800;
    const h = container?.clientHeight || 600;

    const nodeSet = new Set<string>();
    filteredEdges.forEach(e => { nodeSet.add(e.source_id); nodeSet.add(e.target_id); });

    const nodes: SimNode[] = Array.from(nodeSet).map((id, i) => {
      const base = buildNode(id, accountMap, deviceMap, pmMap, ipMap);
      const angle = (i / nodeSet.size) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.3;
      return {
        ...base,
        x: w / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: h / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
      };
    });

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const links: SimLink[] = filteredEdges
      .filter(e => nodeById.has(e.source_id) && nodeById.has(e.target_id))
      .map(e => ({
        id: e.id, source: e.source_id, target: e.target_id,
        edge_type: e.edge_type, label: e.label,
      }));

    const sim = d3Force.forceSimulation(nodes)
      .force("link", d3Force.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(100).strength(0.3))
      .force("charge", d3Force.forceManyBody().strength(-350).distanceMax(400))
      .force("center", d3Force.forceCenter(w / 2, h / 2).strength(0.08))
      .force("collision", d3Force.forceCollide(38))
      .force("x", d3Force.forceX(w / 2).strength(0.03))
      .force("y", d3Force.forceY(h / 2).strength(0.03))
      .alpha(1).alphaDecay(0.025).velocityDecay(0.4);

    simRef.current = sim;
    nodesRef.current = nodes;
    linksRef.current = links;

    let settled = false;
    sim.on("tick", () => {
      nodesRef.current = nodes.map(n => ({ ...n }));
      linksRef.current = links.map(l => ({
        ...l,
        source: typeof l.source === 'object' ? (l.source as SimNode).id : l.source,
        target: typeof l.target === 'object' ? (l.target as SimNode).id : l.target,
      }));
      onSimReady(nodesRef.current, linksRef.current);

      // Auto-fit once simulation has mostly settled
      if (!settled && sim.alpha() < 0.15) {
        settled = true;
        setTimeout(() => zoomRef.current?.fitBounds(nodesRef.current), 50);
      }
    });

    return () => { sim.stop(); };
  }, [filteredEdges, accountMap, deviceMap, pmMap, ipMap]);

  // Zoom/pan setup
  useEffect(() => {
    if (!svgRef.current) return;
    const svgEl = select(svgRef.current);
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        transformRef.current = { x: event.transform.x, y: event.transform.y, k: event.transform.k };
        const g = svgRef.current?.querySelector('g.graph-layer');
        if (g) g.setAttribute('transform', `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
      });
    svgEl.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    const fitBounds = (nodes: SimNode[]) => {
      if (!nodes.length || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const padding = 60;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        if (n.x != null) { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); }
        if (n.y != null) { minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); }
      });
      const bw = maxX - minX || 1;
      const bh = maxY - minY || 1;
      const scale = Math.min((w - padding * 2) / bw, (h - padding * 2) / bh, 2);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const tx = w / 2 - cx * scale;
      const ty = h / 2 - cy * scale;
      const t = zoomIdentity.translate(tx, ty).scale(scale);
      svgEl.transition().duration(500).call(zoomBehavior.transform, t);
    };

    zoomRef.current = {
      zoomIn: () => svgEl.transition().duration(200).call(zoomBehavior.scaleBy, 1.4),
      zoomOut: () => svgEl.transition().duration(200).call(zoomBehavior.scaleBy, 0.7),
      reset: () => fitBounds(nodesRef.current),
      fitBounds,
    };

    return () => { svgEl.on(".zoom", null); };
  }, []);

  // Drag
  const handlePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragNodeRef.current = nodeId;
    simRef.current?.alphaTarget(0.3).restart();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const nodeId = dragNodeRef.current;
    if (!nodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const t = transformRef.current;
    const x = (e.clientX - rect.left - t.x) / t.k;
    const y = (e.clientY - rect.top - t.y) / t.k;
    const sim = simRef.current;
    if (sim) {
      const node = sim.nodes().find(n => n.id === nodeId);
      if (node) { node.fx = x; node.fy = y; }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const nodeId = dragNodeRef.current;
    if (!nodeId) return;
    const sim = simRef.current;
    if (sim) {
      const node = sim.nodes().find(n => n.id === nodeId);
      if (node) { node.fx = null; node.fy = null; }
      sim.alphaTarget(0);
    }
    dragNodeRef.current = null;
  }, []);

  // Hover tooltip handlers
  const handleNodeEnter = useCallback((e: React.PointerEvent, nodeId: string) => {
    if (dragNodeRef.current) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredNodeId(nodeId);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }, 200);
  }, []);

  const handleNodeLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredNodeId(null);
  }, []);

  const connectedIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedNodeId);
    allEdges.forEach(e => {
      if (e.source_id === selectedNodeId) ids.add(e.target_id);
      if (e.target_id === selectedNodeId) ids.add(e.source_id);
    });
    return ids;
  }, [selectedNodeId, allEdges]);

  // Focus suspicious: compute visible set
  const suspiciousIds = useMemo(() => {
    if (!focusSuspicious) return null;
    const highRiskIds = new Set<string>();
    nodesRef.current.forEach(n => {
      if (n.riskLevel === 'high' || n.riskLevel === 'critical') highRiskIds.add(n.id);
    });
    // Add direct neighbors
    const visible = new Set(highRiskIds);
    allEdges.forEach(e => {
      if (highRiskIds.has(e.source_id)) visible.add(e.target_id);
      if (highRiskIds.has(e.target_id)) visible.add(e.source_id);
    });
    return visible;
  }, [focusSuspicious, allEdges, nodesRef.current]);

  const hoveredNode = hoveredNodeId ? nodesRef.current.find(n => n.id === hoveredNodeId) : null;

  return (
    <div ref={containerRef} className="flex-1 relative bg-muted/30 overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: dragNodeRef.current ? 'grabbing' : 'grab' }}
      >
        <defs>
          <filter id="node-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        <g className="graph-layer">
          {/* Edges */}
          {linksRef.current.map(link => {
            const sId = typeof link.source === 'string' ? link.source : (link.source as SimNode).id;
            const tId = typeof link.target === 'string' ? link.target : (link.target as SimNode).id;
            const s = nodesRef.current.find(n => n.id === sId);
            const t = nodesRef.current.find(n => n.id === tId);
            if (!s || !t || s.x == null || t.x == null) return null;

            const isHL = selectedNodeId && connectedIds.has(sId) && connectedIds.has(tId);
            const dimmedBySelection = selectedNodeId && !isHL;
            const dimmedBySuspicious = suspiciousIds && (!suspiciousIds.has(sId) || !suspiciousIds.has(tId));
            const dimmed = dimmedBySelection || dimmedBySuspicious;

            return (
              <g key={link.id}>
                <line
                  x1={s.x} y1={s.y!} x2={t.x} y2={t.y!}
                  stroke={edgeColors[link.edge_type] || 'hsl(220, 10%, 70%)'}
                  strokeWidth={isHL ? 2.5 : 1.2}
                  strokeOpacity={dimmed ? 0.06 : isHL ? 0.8 : 0.35}
                  strokeDasharray={link.edge_type === 'timing_overlap' ? '5,3' : link.edge_type === 'refund_pattern' ? '2,2' : undefined}
                />
                {showLabels && !dimmed && (
                  <text x={(s.x! + t.x!) / 2} y={(s.y! + t.y!) / 2 - 4}
                    fontSize={8} fill="hsl(220, 10%, 46%)" textAnchor="middle"
                    opacity={isHL ? 0.9 : 0.5} style={{ pointerEvents: 'none' }}>
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodesRef.current.map(node => {
            if (node.x == null || node.y == null) return null;
            const isSel = selectedNodeId === node.id;
            const isConn = connectedIds.has(node.id);
            const dimmedBySelection = selectedNodeId && !isConn;
            const dimmedBySuspicious = suspiciousIds && !suspiciousIds.has(node.id);
            const dimmed = dimmedBySelection || dimmedBySuspicious;
            const isHighRisk = highlightRisk && (node.riskLevel === 'high' || node.riskLevel === 'critical');
            const isHovered = hoveredNodeId === node.id;
            const r = node.type === 'account' ? 22 : 17;
            const op = dimmed ? 0.12 : 1;

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onPointerDown={e => handlePointerDown(e, node.id)}
                onPointerEnter={e => handleNodeEnter(e, node.id)}
                onPointerLeave={handleNodeLeave}
                onClick={e => { e.stopPropagation(); if (!dragNodeRef.current) onSelectNode(isSel ? null : node.id); }}
                opacity={op}
              >
                {isSel && (
                  <>
                    <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} opacity={0.3}>
                      <animate attributeName="r" from={r + 5} to={r + 12} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={node.x} cy={node.y} r={r + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} opacity={0.5} />
                  </>
                )}
                {isHighRisk && !isSel && (
                  <circle cx={node.x} cy={node.y} r={r + 5} fill="none" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="3,3" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" from="0" to="12" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Hover ring */}
                {isHovered && !isSel && (
                  <circle cx={node.x} cy={node.y} r={r + 3} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1} opacity={0.3} />
                )}
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={nodeColors[node.type] || 'hsl(220, 10%, 50%)'}
                  stroke={isSel ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                  strokeWidth={isSel ? 3 : 2}
                  filter="url(#node-shadow)"
                />
                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={node.type === 'account' ? 13 : 11} style={{ pointerEvents: 'none' }}>
                  {nodeIcons[node.type] || '●'}
                </text>
                {(showLabels || isSel || isConn) && !dimmed && (
                  <text x={node.x} y={node.y + r + 12} textAnchor="middle" fontSize={9}
                    fontWeight={isSel ? 600 : 500} fill="hsl(var(--foreground))" style={{ pointerEvents: 'none' }}>
                    {node.label.length > 16 ? node.label.slice(0, 16) + '…' : node.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover tooltip (HTML overlay) */}
      {hoveredNode && !dragNodeRef.current && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 8 }}
        >
          <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs max-w-[240px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{nodeIcons[hoveredNode.type]}</span>
              <span className="font-semibold capitalize text-foreground">{hoveredNode.type.replace('_', ' ')}</span>
              <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                hoveredNode.riskLevel === 'critical' ? 'bg-risk-critical-bg text-risk-critical-foreground' :
                hoveredNode.riskLevel === 'high' ? 'bg-risk-high-bg text-risk-high-foreground' :
                hoveredNode.riskLevel === 'medium' ? 'bg-risk-medium-bg text-risk-medium-foreground' :
                'bg-risk-low-bg text-risk-low-foreground'
              }`}>{hoveredNode.riskLevel}</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-[10px]">{hoveredNode.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Label</span>
                <span className="font-medium truncate ml-2 max-w-[140px]">{hoveredNode.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-medium">{getConnectionCount(hoveredNode.id, allEdges)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node legend */}
      <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm border border-border rounded-md p-2 flex gap-3 text-[10px]">
        {Object.entries(nodeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
      {/* Edge legend */}
      <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm border border-border rounded-md p-2 flex gap-3 text-[10px]">
        {Object.entries(edgeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded shrink-0" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
