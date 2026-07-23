// src/components/timeline/EditHistoryPanel.jsx
// ═══════════════════════════════════════════════════════════════════
// Immutable Audit Trail & Log Edit History Component
// Displays FMCSA-compliant change history with mandatory edit reasons
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { History, User, Clock, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

import { formatDateISO } from '../../services/timeService';

const todayIso = formatDateISO();
const MOCK_EDITS = [
  {
    id: 'ed_1',
    fieldName: 'Duty Status Segment (06:00 - 07:00)',
    oldValue: 'OFF DUTY',
    newValue: 'ON DUTY (Pre-Trip Inspection)',
    editedBy: 'John Smith (Driver)',
    editedAt: `${todayIso} 07:05:12`,
    reason: 'Correction — Pre-trip inspection completed prior to departure.',
    editType: 'amendment',
  },
  {
    id: 'ed_2',
    fieldName: '30-Minute Rest Break (12:45 - 13:15)',
    oldValue: 'DRIVING',
    newValue: 'OFF DUTY (Fuel & Meal Break)',
    editedBy: 'John Smith (Driver)',
    editedAt: `${todayIso} 13:20:00`,
    reason: 'Driver insertion of mandatory 30-min break per §395.3(a)(3)(ii).',
    editType: 'amendment',
  },
];

export default function EditHistoryPanel({ history = MOCK_EDITS }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm">
          <History size={18} />
          <span>FMCSA Immutable Audit Trail & Edit History</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
          §395.8 Audit Log
        </span>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No edits recorded. Original log intact.</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{item.fieldName}</span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> {item.editedAt}
                </span>
              </div>

              {/* Diff view */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold line-through">
                  {item.oldValue}
                </span>
                <ArrowRight size={14} className="text-slate-400" />
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                  {item.newValue}
                </span>
              </div>

              {/* Reason & User */}
              <div className="pt-1 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 mt-2">
                <div className="flex items-center gap-1">
                  <FileText size={12} className="text-indigo-600" />
                  <span><strong>Reason:</strong> {item.reason}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <User size={12} />
                  <span>{item.editedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
