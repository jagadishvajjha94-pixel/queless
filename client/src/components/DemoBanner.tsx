import React from 'react';
import { Info, RotateCcw } from 'lucide-react';
import { resetDemoData } from '../demo/mockApi';

const DemoBanner: React.FC = () => {
  const handleReset = () => {
    if (!window.confirm('Reset all demo shops, accounts and queues back to the starting data?')) return;
    resetDemoData();
    window.location.href = '/';
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Demo version:</strong> all shops, accounts and queues are dummy data saved only in your browser.
          </span>
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 font-semibold whitespace-nowrap hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset demo
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
