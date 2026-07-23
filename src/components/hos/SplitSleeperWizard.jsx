// src/components/hos/SplitSleeperWizard.jsx
// ═══════════════════════════════════════════════════════════════════
// FMCSA §395.1(g) Split Sleeper Berth Pairings Calculation Wizard
// Calculates & visualizes 7/3 and 8/2 Sleeper Berth Pairs
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Moon, Clock, CheckCircle2, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';

export default function SplitSleeperWizard() {
  const [period1Hours, setPeriod1Hours] = useState(7.5);
  const [period1Type, setPeriod1Type] = useState('sleeper_berth'); // 'sleeper_berth' | 'off_duty'
  const [period2Hours, setPeriod2Hours] = useState(3.0);
  const [period2Type, setPeriod2Type] = useState('off_duty');

  // FMCSA §395.1(g) Split Sleeper Qualification Logic:
  // Pair 1 must be >= 7.0 hours in sleeper berth (or >= 8.0 for 8/2 split)
  // Pair 2 must be >= 2.0 hours (off-duty or sleeper berth)
  // Sum of Pair 1 + Pair 2 must be >= 10.0 hours total.
  const isPeriod1Valid = period1Hours >= 7.0 && period1Type === 'sleeper_berth';
  const isPeriod2Valid = period2Hours >= 2.0;
  const isTotalTenHours = (period1Hours + period2Hours) >= 10.0;
  const isValidSplitPair = isPeriod1Valid && isPeriod2Valid && isTotalTenHours;

  const splitType = period1Hours >= 8.0 && period2Hours >= 2.0 ? '8/2 Split Sleeper' : '7/3 Split Sleeper';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Moon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">FMCSA §395.1(g) Split Sleeper Berth Wizard</h3>
            <p className="text-xs text-slate-500">Calculate 7/3 and 8/2 split sleeper berth pairings to pause shift clock</p>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
          isValidSplitPair
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {isValidSplitPair ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
          <span>{isValidSplitPair ? `Qualifying ${splitType}` : 'Invalid Split Pair'}</span>
        </span>
      </div>

      {/* Interactive Pair Period Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Period 1 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-900">Primary Sleeper Period (Pair 1)</span>
            <span className="text-[10px] text-slate-500 font-mono">Min 7.0 Hours (Sleeper)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Duration (Hours)</label>
              <input
                type="number"
                min="0"
                max="14"
                step="0.5"
                value={period1Hours}
                onChange={(e) => setPeriod1Hours(parseFloat(e.target.value || 0))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Status Type</label>
              <select
                value={period1Type}
                onChange={(e) => setPeriod1Type(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
              >
                <option value="sleeper_berth">Sleeper Berth 🛏️</option>
                <option value="off_duty">Off Duty 🏠</option>
              </select>
            </div>
          </div>
        </div>

        {/* Period 2 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-900">Secondary Rest Period (Pair 2)</span>
            <span className="text-[10px] text-slate-500 font-mono">Min 2.0 Hours (Off Duty / Sleeper)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Duration (Hours)</label>
              <input
                type="number"
                min="0"
                max="14"
                step="0.5"
                value={period2Hours}
                onChange={(e) => setPeriod2Hours(parseFloat(e.target.value || 0))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Status Type</label>
              <select
                value={period2Type}
                onChange={(e) => setPeriod2Type(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
              >
                <option value="off_duty">Off Duty 🏠</option>
                <option value="sleeper_berth">Sleeper Berth 🛏️</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Results Card */}
      <div className={`p-4 rounded-xl border text-xs space-y-2 ${
        isValidSplitPair ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-extrabold">Split Sleeper Pair Assessment:</span>
          <span className="font-mono font-bold">Total Rest: {(period1Hours + period2Hours).toFixed(1)} hrs</span>
        </div>

        {isValidSplitPair ? (
          <p className="leading-relaxed">
            ✅ <strong>Valid {splitType} Confirmed!</strong> Neither sleeper period counts against your 14-hour shift duty window. Your shift window clock is paused for the duration of the qualifying sleeper period ({period1Hours} hrs).
          </p>
        ) : (
          <p className="leading-relaxed text-amber-900">
            ⚠️ <strong>Requirements for FMCSA Split Sleeper:</strong> Period 1 must be at least 7.0 continuous hours in Sleeper Berth, Period 2 must be at least 2.0 continuous hours (off-duty or sleeper), and total combined rest must be at least 10.0 hours.
          </p>
        )}
      </div>
    </div>
  );
}
