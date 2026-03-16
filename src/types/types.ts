
export interface AVLNodeData {
  value: number;
  height: number;
  balanceFactor: number;
  left: AVLNodeData | null;
  right: AVLNodeData | null;
  id: string; // Unique ID for keying animations
}

export type OperationType = 'INSERT' | 'DELETE' | 'SEARCH' | 'ROTATE' | 'NONE';

export interface VisualNode {
  data: AVLNodeData;
  x: number;
  y: number;
  parentId: string | null;
}

export interface AnimationStep {
  message: string;
  highlightedNodes: string[];
  treeSnapshot: AVLNodeData | null;
  rotationType?: 'LL' | 'RR' | 'LR' | 'RL';
}
