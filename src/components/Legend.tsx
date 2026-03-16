
import React from 'react';

const Legend: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Tree Legend & Mechanics</h3>
      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Standard Node (Balanced)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-amber-400"></div>
            <span>Processing / Search Target</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-400"></div>
            <span>Imbalanced (BF &gt; 1 or BF &lt; -1)</span>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Balance Factor (BF) Ranges:</p>
          <ul className="space-y-1 pl-1">
            <li className="flex justify-between">
              {/* Fixed: Replaced invalid comma operator JSX expression {-1, 0, 1} with plain text to avoid syntax errors */}
              <span className="text-emerald-600 dark:text-emerald-400">-1, 0, 1</span>
              <span>Balanced</span>
            </li>
            <li className="flex justify-between">
              <span className="text-rose-500 font-bold">&gt; 1</span>
              <span>Left Heavy (Needs R-Rotate)</span>
            </li>
            <li className="flex justify-between">
              <span className="text-rose-500 font-bold">&lt; -1</span>
              <span>Right Heavy (Needs L-Rotate)</span>
            </li>
          </ul>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Rotation Cases:</p>
          <div className="space-y-2 font-mono text-[10px]">
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-blue-600 dark:text-blue-400">LL:</span> Node is left-heavy, and its left child is also left-heavy or balanced. <span className="italic">(1 Right Rotate)</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-blue-600 dark:text-blue-400">RR:</span> Node is right-heavy, and its right child is also right-heavy or balanced. <span className="italic">(1 Left Rotate)</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-blue-600 dark:text-blue-400">LR:</span> Node is left-heavy, but its left child is right-heavy. <span className="italic">(Left-Rotate child, then Right-Rotate node)</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-blue-600 dark:text-blue-400">RL:</span> Node is right-heavy, but its right child is left-heavy. <span className="italic">(Right-Rotate child, then Left-Rotate node)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legend;