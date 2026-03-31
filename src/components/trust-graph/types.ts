import type * as d3Force from "d3-force";

export type EdgeType = 'shared_device' | 'shared_card' | 'shared_ip' | 'timing_overlap' | 'refund_pattern';

export const edgeColors: Record<string, string> = {
  shared_device: 'hsl(239, 84%, 67%)',
  shared_card: 'hsl(38, 92%, 50%)',
  shared_ip: 'hsl(0, 84%, 60%)',
  timing_overlap: 'hsl(258, 90%, 66%)',
  refund_pattern: 'hsl(330, 81%, 60%)',
};

export const nodeColors: Record<string, string> = {
  account: 'hsl(217, 91%, 60%)',
  device: 'hsl(258, 90%, 66%)',
  payment_method: 'hsl(38, 92%, 50%)',
  ip: 'hsl(0, 84%, 60%)',
};

export const nodeIcons: Record<string, string> = {
  account: '👤',
  device: '💻',
  payment_method: '💳',
  ip: '🌐',
};

export interface SimNode extends d3Force.SimulationNodeDatum {
  id: string;
  type: string;
  label: string;
  riskLevel: string;
}

export interface SimLink extends d3Force.SimulationLinkDatum<SimNode> {
  id: string;
  edge_type: string;
  label: string;
}
