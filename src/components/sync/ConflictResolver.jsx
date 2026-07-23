// src/components/sync/ConflictResolver.jsx
// ═══════════════════════════════════════════════════════════════════
// Versioned Offline Conflict Resolution Modal — Side-by-Side Diff
// Prevents "Last Write Wins" data loss during offline sync
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, RefreshCw, Smartphone, Server } from 'lucide-react';

export default function ConflictResolver({ conflict, onResolve, onClose }) {
  if (!conflict) return null;

  const { queueItem, conflictData } = conflict;
  const { clientData, serverData } = conflictData;

  const handleChoose = (strategy, data) => {
    if (onResolve) {
      onResolve(strategy, data);
    }
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Sync Conflict Detected</h3>
              <p className="text-xs text-slate-500">
                Log changes were made offline and online simultaneously. Choose which version to keep.
              </p>
            </div>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Offline Client Version */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Smartphone size={16} />
                <span>Your Offline Version (Driver)</span>
              </div>
              <pre className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto text-slate-700 max-h-48">
                {JSON.stringify(clientData, null, 2)}
              </pre>
              <button
                onClick={() => handleChoose('client_wins', clientData)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-sm transition-all"
              >
                Keep Driver Version
              </button>
            </div>

            {/* Server Version */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Server size={16} />
                <span>Cloud Server Version (Fleet/Dispatch)</span>
              </div>
              <pre className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto text-slate-700 max-h-48">
                {JSON.stringify(serverData, null, 2)}
              </pre>
              <button
                onClick={() => handleChoose('server_wins', serverData)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl shadow-sm transition-all"
              >
                Keep Fleet Version
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <RefreshCw size={12} className="animate-spin text-slate-400" />
            <span>Version-controlled conflict resolution per FMCSA audit compliance requirements</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
