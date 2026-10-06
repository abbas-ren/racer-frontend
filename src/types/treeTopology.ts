export type GraphNodeType = 'farm_controller' | 'device_controller' | 'device';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  x: number;
  y: number;
  parentId?: string;
  status?: string;
  ip?: string;
  deviceId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphTransform {
  x: number;
  y: number;
  k: number;
}
