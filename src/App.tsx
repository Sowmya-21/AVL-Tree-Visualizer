
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AVLTree, cloneTree, AVLNode } from './services/avlLogic';
import { AVLNodeData, AnimationStep } from './types/types';
import Legend from './components/Legend';
import TraversalDisplay from './components/TraversalDisplay';

// Interface for the calculated layout positions
interface NodePosition {
  x: number;
  y: number;
  width: number;
}

const App: React.FC = () => {
  // Tree State
  const [treeRoot, setTreeRoot] = useState<AVLNodeData | null>(null);
  const avlTreeRef = useRef(new AVLTree());

  // UI State
  const [inputValue, setInputValue] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('avl-visualizer-theme');
      return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  const [statusMessage, setStatusMessage] = useState<string>('Welcome to AVL Visualizer. Insert a value to begin.');
  const [lastRotationType, setLastRotationType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [animationQueue, setAnimationQueue] = useState<AnimationStep[]>([]);
  
  // Animation Control
  const [animationSpeed, setAnimationSpeed] = useState<number>(6); // Range 1 - 10
  const animationDelay = useMemo(() => (11 - animationSpeed) * 200, [animationSpeed]);
  const transitionDuration = useMemo(() => animationDelay * 0.8, [animationDelay]);

  // Layout & View State
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // Fixed: Removed invalid reference to 'e' in initial state. 
  // dragStart is properly initialized in handleMouseDown.
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Responsive sizing
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: Math.max(500, window.innerHeight * 0.6)
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('avl-visualizer-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('avl-visualizer-theme', 'light');
    }
  }, [isDarkMode]);

  // Animation Engine
  useEffect(() => {
    if (animationQueue.length > 0 && !isProcessing) {
      const runAnimation = async () => {
        setIsProcessing(true);
        const nextStep = animationQueue[0];
        
        setStatusMessage(nextStep.message);
        setHighlightedNodes(nextStep.highlightedNodes);
        
        if (nextStep.message.includes('LL Rotation')) setLastRotationType('LL Rotation');
        else if (nextStep.message.includes('RR Rotation')) setLastRotationType('RR Rotation');
        else if (nextStep.message.includes('LR Rotation')) setLastRotationType('LR Rotation');
        else if (nextStep.message.includes('RL Rotation')) setLastRotationType('RL Rotation');

        if (nextStep.treeSnapshot !== undefined) {
          setTreeRoot(nextStep.treeSnapshot);
        }

        await new Promise(resolve => setTimeout(resolve, animationDelay));
        
        setAnimationQueue(prev => prev.slice(1));
        setIsProcessing(false);
      };
      runAnimation();
    }
  }, [animationQueue, isProcessing, animationDelay]);

  const layoutCache = useMemo(() => {
    const positions = new Map<string, NodePosition>();
    const minNodeGap = 60;
    const levelHeight = orientation === 'vertical' ? 100 : 140;

    const calculateWidth = (node: AVLNodeData | null): number => {
      if (!node) return 0;
      const leftWidth = calculateWidth(node.left);
      const rightWidth = calculateWidth(node.right);
      const width = Math.max(leftWidth + rightWidth + (node.left && node.right ? minNodeGap : 0), 40);
      return width;
    };

    const assignPositions = (node: AVLNodeData | null, x: number, y: number) => {
      if (!node) return;

      const leftSubtreeWidth = calculateWidth(node.left);
      const rightSubtreeWidth = calculateWidth(node.right);

      positions.set(node.id, { x, y, width: leftSubtreeWidth + rightSubtreeWidth });

      if (orientation === 'vertical') {
        if (node.left) {
          assignPositions(node.left, x - (rightSubtreeWidth/2 + minNodeGap/2 + leftSubtreeWidth/2), y + levelHeight);
        }
        if (node.right) {
          assignPositions(node.right, x + (leftSubtreeWidth/2 + minNodeGap/2 + rightSubtreeWidth/2), y + levelHeight);
        }
      } else {
        if (node.left) {
          assignPositions(node.left, x + levelHeight, y - (rightSubtreeWidth/2 + minNodeGap/2 + leftSubtreeWidth/2));
        }
        if (node.right) {
          assignPositions(node.right, x + levelHeight, y + (leftSubtreeWidth/2 + minNodeGap/2 + rightSubtreeWidth/2));
        }
      }
    };

    if (treeRoot) {
      assignPositions(treeRoot, 0, 0);
    }
    return positions;
  }, [treeRoot, orientation]);

  const addAnimationStep = (message: string, node: AVLNode | null) => {
    const currentRoot = cloneTree(avlTreeRef.current.root);
    setAnimationQueue(prev => [
      ...prev,
      {
        message,
        highlightedNodes: node ? [node.id] : [],
        treeSnapshot: currentRoot
      }
    ]);
  };

  const handleInsert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    setInputValue('');
    setLastRotationType(null);
    setIsProcessing(true);
    const newRoot = avlTreeRef.current.insert(
      avlTreeRef.current.root, 
      val, 
      (msg, node) => addAnimationStep(msg, node)
    );
    avlTreeRef.current.root = newRoot;
    addAnimationStep(`Operation complete. Value ${val} added.`, null);
    setIsProcessing(false);
  };

  const handleDelete = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    setInputValue('');
    setLastRotationType(null);
    setIsProcessing(true);
    const newRoot = avlTreeRef.current.delete(
      avlTreeRef.current.root, 
      val, 
      (msg, node) => addAnimationStep(msg, node)
    );
    avlTreeRef.current.root = newRoot;
    addAnimationStep(`Operation complete. Value ${val} removed if present.`, null);
    setIsProcessing(false);
  };

  const handleSearch = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    setInputValue('');
    setLastRotationType(null);
    setIsProcessing(true);
    avlTreeRef.current.search(
      avlTreeRef.current.root, 
      val, 
      (msg, node) => addAnimationStep(msg, node)
    );
    addAnimationStep(`Search for ${val} finished.`, null);
    setIsProcessing(false);
  };

  const handleClear = () => {
    avlTreeRef.current.root = null;
    setTreeRoot(null);
    setAnimationQueue([]);
    setHighlightedNodes([]);
    setLastRotationType(null);
    setIsProcessing(false);
    setStatusMessage('Tree cleared.');
  };

  const handleClearQueue = () => {
    setAnimationQueue([]);
    setIsProcessing(false);
    setHighlightedNodes([]);
    setLastRotationType(null);
    setStatusMessage('Animations stopped. View synchronized.');
    setTreeRoot(cloneTree(avlTreeRef.current.root));
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001;
    setZoom(prev => Math.min(Math.max(0.1, prev + delta), 4));
  };

  const traversals = {
    inorder: AVLTree.inorder(avlTreeRef.current.root),
    preorder: AVLTree.preorder(avlTreeRef.current.root),
    postorder: AVLTree.postorder(avlTreeRef.current.root)
  };

  const renderNodes = (node: AVLNodeData | null): React.ReactNode => {
    if (!node) return null;
    const pos = layoutCache.get(node.id);
    if (!pos) return null;

    const nodeRadius = 26;
    const isHighlighted = highlightedNodes.includes(node.id);
    const isImbalanced = Math.abs(node.balanceFactor) > 1;

    return (
      <g key={node.id}>
        {node.left && layoutCache.has(node.left.id) && (
          <line 
            x1={pos.x} y1={pos.y} 
            x2={layoutCache.get(node.left.id)!.x} 
            y2={layoutCache.get(node.left.id)!.y}
            className="stroke-slate-300 dark:stroke-slate-600 transition-all ease-in-out"
            style={{ transitionDuration: `${transitionDuration}ms` }}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
        {node.right && layoutCache.has(node.right.id) && (
          <line 
            x1={pos.x} y1={pos.y} 
            x2={layoutCache.get(node.right.id)!.x} 
            y2={layoutCache.get(node.right.id)!.y}
            className="stroke-slate-300 dark:stroke-slate-600 transition-all ease-in-out"
            style={{ transitionDuration: `${transitionDuration}ms` }}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {renderNodes(node.left)}
        {renderNodes(node.right)}

        <g 
          className="transition-all ease-in-out node-group" 
          transform={`translate(${pos.x}, ${pos.y})`}
          style={{ transitionDuration: `${transitionDuration}ms` }}
        >
          {isImbalanced && (
            <circle 
              r={nodeRadius}
              className="animate-pulsate-red pointer-events-none"
            />
          )}

          <circle 
            r={nodeRadius}
            className={`
              transition-all duration-500 cursor-grab active:cursor-grabbing
              ${isHighlighted ? 'fill-amber-400 stroke-amber-600 dark:fill-amber-500 dark:stroke-amber-400 animate-glow' : 
                isImbalanced ? 'fill-rose-500 stroke-rose-700 dark:fill-rose-600 dark:stroke-rose-400' : 
                'fill-blue-500 stroke-blue-600 dark:fill-blue-600 dark:stroke-blue-400'}
              stroke-[3px] shadow-lg dark:shadow-blue-900/20
            `}
          />
          <text 
            dy=".3em" 
            textAnchor="middle" 
            className="fill-white font-bold text-sm pointer-events-none select-none"
          >
            {node.value}
          </text>
          
          <g transform={`translate(${nodeRadius + 4}, -${nodeRadius - 4})`} className="pointer-events-none select-none opacity-90">
             <rect width="42" height="34" rx="4" className="fill-white/95 dark:fill-slate-800/95 stroke-slate-200 dark:stroke-slate-700 shadow-sm" />
             <text x="5" y="14" className="fill-slate-500 dark:fill-slate-400 font-mono text-[9px] font-bold">H: {node.height}</text>
             <text x="5" y="28" className={`font-mono text-[9px] font-bold ${isImbalanced ? 'fill-rose-500' : 'fill-slate-500 dark:fill-slate-400'}`}>BF: {node.balanceFactor}</text>
          </g>
        </g>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg shadow-blue-500/20 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">AVL Visualizer Pro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subtree-Width Optimized Layout Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-600"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
            ) : (
              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Operations</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium mb-1.5 ml-1 text-slate-500 dark:text-slate-400 uppercase tracking-wider">Node Value</label>
                <input 
                  type="number" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                  placeholder="Insert integer..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Speed</label>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                    x{animationSpeed}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button disabled={isProcessing} onClick={handleInsert} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm">Insert</button>
                <button disabled={isProcessing} onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm">Delete</button>
                <button disabled={isProcessing} onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm">Search</button>
                <button onClick={handleClearQueue} className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm">Stop</button>
                <button disabled={isProcessing} onClick={handleClear} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400 font-semibold py-3 rounded-xl transition-all active:scale-95 col-span-2 text-sm">Clear Tree</button>
              </div>
            </div>
          </div>
          <Legend />
        </div>

        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 relative overflow-hidden transition-all" 
               ref={containerRef}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onWheel={handleWheel}
          >
            <div className="absolute top-4 left-6 z-10 flex flex-col gap-2 pointer-events-none">
              <div className={`
                px-4 py-2 rounded-full border flex items-center gap-3 transition-colors duration-500 shadow-sm
                ${isProcessing ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300' : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'}
              `}>
                {isProcessing && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>}
                <span className="text-sm font-medium">{statusMessage}</span>
              </div>
              {lastRotationType && (
                <div className="px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300 flex items-center gap-2 animate-bounce-short shadow-sm w-fit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider">Detected: {lastRotationType}</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 right-6 z-10 flex items-center gap-2">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all">
                <button 
                  onClick={() => setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')} 
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2" 
                  title="Switch Orientation"
                >
                   <svg className={`w-5 h-5 transition-transform duration-500 ${orientation === 'horizontal' ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                   </svg>
                   <span className="text-xs font-bold uppercase hidden md:inline">{orientation}</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors" title="Zoom Out">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <span className="text-xs font-mono w-12 text-center font-bold text-slate-500 dark:text-slate-400">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors" title="Zoom In">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button onClick={resetView} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors" title="Reset View">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            </div>

            <svg 
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
            >
              <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
                <g transform={orientation === 'vertical' ? `translate(${canvasSize.width / 2}, 80)` : `translate(100, ${canvasSize.height / 2})`}>
                  {treeRoot ? renderNodes(treeRoot) : (
                    <text x="0" y="0" textAnchor="middle" className="fill-slate-300 dark:fill-slate-700 font-medium italic text-lg select-none">
                      Tree is currently empty. Add values to see it grow!
                    </text>
                  )}
                </g>
              </g>
            </svg>
          </div>

          <TraversalDisplay 
            inorder={traversals.inorder} 
            preorder={traversals.preorder} 
            postorder={traversals.postorder} 
          />
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 text-center transition-all">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
          AVL Visualizer Pro &bull; High Performance Self-Balancing Visualization
        </p>
      </footer>
      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1.5s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.4)); }
          50% { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.7)); }
        }
        .animate-glow {
          animation: glow 1.2s ease-in-out infinite;
        }
        @keyframes node-entry {
          from { opacity: 0; transform: scale(0.6) translate(0, -20px); }
          to { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        .node-group {
          animation: node-entry 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes pulsate-red {
          0% { stroke-width: 3px; stroke-opacity: 1; r: 26; }
          50% { stroke-width: 10px; stroke-opacity: 0.2; r: 36; }
          100% { stroke-width: 3px; stroke-opacity: 1; r: 26; }
        }
        .animate-pulsate-red {
          animation: pulsate-red 2s ease-in-out infinite;
          fill: none;
          stroke: #f43f5e;
        }
        .dark .animate-pulsate-red {
          stroke: #fb7185;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #2563eb;
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .dark input[type='range']::-webkit-slider-thumb {
          border-color: #1e293b;
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default App;
