import { AVLNodeData } from '../types';

export class AVLNode implements AVLNodeData {
  value: number;
  height: number = 1;
  balanceFactor: number = 0;
  left: AVLNode | null = null;
  right: AVLNode | null = null;
  id: string;

  constructor(value: number) {
    this.value = value;
    this.id = `node-${value}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class AVLTree {
  root: AVLNode | null = null;
  lastRotation: string = '';

  getHeight(node: AVLNode | null): number {
    return node ? node.height : 0;
  }

  getBalanceFactor(node: AVLNode | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  updateMetadata(node: AVLNode) {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    node.balanceFactor = this.getBalanceFactor(node);
  }

  rightRotate(y: AVLNode): AVLNode {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateMetadata(y);
    this.updateMetadata(x);

    return x;
  }

  leftRotate(x: AVLNode): AVLNode {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateMetadata(x);
    this.updateMetadata(y);

    return y;
  }

  insert(node: AVLNode | null, value: number, onStep: (msg: string, node: AVLNode | null) => void): AVLNode {
    if (node === null) {
      onStep(`Inserted value ${value}`, null);
      return new AVLNode(value);
    }

    onStep(`Comparing ${value} with ${node.value}`, node);

    if (value < node.value) {
      node.left = this.insert(node.left, value, onStep);
    } else if (value > node.value) {
      node.right = this.insert(node.right, value, onStep);
    } else {
      onStep(`Value ${value} already exists.`, node);
      return node;
    }

    this.updateMetadata(node);
    const balance = node.balanceFactor;

    // LL Case
    if (balance > 1 && value < node.left!.value) {
      onStep(`Imbalance detected at ${node.value} (BF: ${balance}). LL Rotation performing...`, node);
      this.lastRotation = 'LL Rotation';
      return this.rightRotate(node);
    }

    // RR Case
    if (balance < -1 && value > node.right!.value) {
      onStep(`Imbalance detected at ${node.value} (BF: ${balance}). RR Rotation performing...`, node);
      this.lastRotation = 'RR Rotation';
      return this.leftRotate(node);
    }

    // LR Case
    if (balance > 1 && value > node.left!.value) {
      onStep(`Imbalance detected at ${node.value} (BF: ${balance}). LR Rotation (Left then Right)...`, node);
      this.lastRotation = 'LR Rotation';
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }

    // RL Case
    if (balance < -1 && value < node.right!.value) {
      onStep(`Imbalance detected at ${node.value} (BF: ${balance}). RL Rotation (Right then Left)...`, node);
      this.lastRotation = 'RL Rotation';
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  delete(node: AVLNode | null, value: number, onStep: (msg: string, node: AVLNode | null) => void): AVLNode | null {
    if (node === null) {
      onStep(`Value ${value} not found for deletion.`, null);
      return null;
    }

    onStep(`Searching for ${value} at ${node.value}`, node);

    if (value < node.value) {
      node.left = this.delete(node.left, value, onStep);
    } else if (value > node.value) {
      node.right = this.delete(node.right, value, onStep);
    } else {
      // Node with value found
      if (!node.left || !node.right) {
        onStep(`Found ${value}. Removing and promoting child...`, node);
        const temp = node.left ? node.left : node.right;
        node = temp;
      } else {
        onStep(`Found ${value}. Finding inorder successor...`, node);
        const temp = this.minValueNode(node.right);
        onStep(`Inorder successor is ${temp.value}. Replacing ${value}...`, temp);
        node.value = temp.value;
        node.id = temp.id; // Maintain visual identity of the moved node
        node.right = this.delete(node.right, temp.value, onStep);
      }
    }

    if (node === null) return node;

    this.updateMetadata(node);
    const balance = node.balanceFactor;

    // Rebalancing
    if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
      onStep(`Imbalance at ${node.value} after delete. LL Rotation...`, node);
      return this.rightRotate(node);
    }

    if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
      onStep(`Imbalance at ${node.value} after delete. LR Rotation...`, node);
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }

    if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
      onStep(`Imbalance at ${node.value} after delete. RR Rotation...`, node);
      return this.leftRotate(node);
    }

    if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
      onStep(`Imbalance at ${node.value} after delete. RL Rotation...`, node);
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  minValueNode(node: AVLNode): AVLNode {
    let current = node;
    while (current.left !== null) current = current.left;
    return current;
  }

  search(node: AVLNode | null, value: number, onStep: (msg: string, node: AVLNode | null) => void): AVLNode | null {
    if (node === null) {
      onStep(`Value ${value} not found.`, null);
      return null;
    }
    onStep(`Comparing search value ${value} with node ${node.value}`, node);
    if (node.value === value) {
      onStep(`Found value ${value}!`, node);
      return node;
    }
    if (value < node.value) return this.search(node.left, value, onStep);
    return this.search(node.right, value, onStep);
  }

  // Traversals
  static inorder(node: AVLNode | null, result: number[] = []) {
    if (node) {
      this.inorder(node.left, result);
      result.push(node.value);
      this.inorder(node.right, result);
    }
    return result;
  }

  static preorder(node: AVLNode | null, result: number[] = []) {
    if (node) {
      result.push(node.value);
      this.preorder(node.left, result);
      this.preorder(node.right, result);
    }
    return result;
  }

  static postorder(node: AVLNode | null, result: number[] = []) {
    if (node) {
      this.postorder(node.left, result);
      this.postorder(node.right, result);
      result.push(node.value);
    }
    return result;
  }
}

// Deep clone to create React state compatible snapshots
export const cloneTree = (node: AVLNode | null): AVLNodeData | null => {
  if (!node) return null;
  return {
    value: node.value,
    height: node.height,
    balanceFactor: node.balanceFactor,
    id: node.id,
    left: cloneTree(node.left),
    right: cloneTree(node.right)
  };
};