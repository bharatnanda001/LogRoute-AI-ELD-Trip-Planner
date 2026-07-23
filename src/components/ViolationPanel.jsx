// src/components/ViolationPanel.jsx
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { validateHOS } from '../services/hosComplianceService';

/**
 * Shows real‑time compliance status for the current logSheet.
 * Expects `logSheet` (array of duty blocks) as a prop.
 */
export default function ViolationPanel({ logSheet }) {
  const [status, setStatus] = useState('checking'); // checking | legal | warning | violation
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function runValidation() {
      setStatus('checking');
      const result = await validateHOS(logSheet);
      if (!cancelled) {
        setStatus(result.status);
        setDetails(result);
      }
    }
    runValidation();
    return () => {
      cancelled = true;
    };
  }, [logSheet]);

  const renderBadge = () => {
    switch (status) {
      case 'legal':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl">
            <CheckCircle size={14} /> Legal
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl">
            <AlertTriangle size={14} /> Warning
          </span>
        );
      case 'violation':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl">
            <XCircle size={14} /> Violation
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-500 italic">Checking…</span>
        );
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-800">Compliance Status</h3>
        {renderBadge()}
      </div>
      {status === 'warning' && details?.rule && (
        <p className="text-xs text-amber-700 mt-1">
          ⚠️ {details.rule} – approaching limit. Consider adjusting duties.
        </p>
      )}
      {status === 'violation' && details?.rule && (
        <p className="text-xs text-rose-700 mt-1">
          ❌ {details.rule} – violation! Adjust before proceeding.
        </p>
      )}
    </div>
  );
}
