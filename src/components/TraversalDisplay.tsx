
import React from 'react';

interface TraversalDisplayProps {
  inorder: number[];
  preorder: number[];
  postorder: number[];
}

const TraversalDisplay: React.FC<TraversalDisplayProps> = ({ inorder, preorder, postorder }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Inorder Traversal</h4>
        <div className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">
          {inorder.length > 0 ? inorder.join(' → ') : 'Empty'}
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Preorder Traversal</h4>
        <div className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">
          {preorder.length > 0 ? preorder.join(' → ') : 'Empty'}
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Postorder Traversal</h4>
        <div className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">
          {postorder.length > 0 ? postorder.join(' → ') : 'Empty'}
        </div>
      </div>
    </div>
  );
};

export default TraversalDisplay;
