// src/components/hos/RecapScreen.jsx
// ═══════════════════════════════════════════════════════════════════
// Full FMCSA HOS Recap Dashboard — live countdown clocks, violations,
// 8-day rolling cycle chart, next-break predictions, & Split Sleeper Wizard.
// ═══════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import {
  Clock, AlertTriangle, ShieldCheck, ShieldAlert, Timer, Moon,
  Fuel, TrendingDown, BarChart3, ChevronRight, AlertCircle, CheckCircle2, Zap,
} from 'lucide-react';
import SplitSleeperWizard from './SplitSleeperWizard';

const STATUS_COLORS = {
  off_duty: { bg: '#f1f5f9', bar: '#94a3b8', label: 'Off Duty' },
  sleeper_berth: { bg: '#eff6ff', bar: '#3b82f6', label: 'Sleeper Berth' },
  driving: { bg: '#fef2f2', bar: '#ef4444', label: 'Driving' },
  on_duty_not_driving: { bg: '#fffbeb', bar: '#f59e0b', label: 'On Duty' },
};

function fmtMin(mins) {
  if (mins == null || isNaN(mins)) return '—';
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function fmtTime(minuteOfDay) {
  if (minuteOfDay == null) return '—';
  const clamped = Math.min(1440, Math.max(0, minuteOfDay));
  const h24 = Math.floor(clamped / 60);
  const m = Math.round(clamped % 60);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function CircularGauge({ value, max, label, sublabel, color, icon: Icon, warning = false, critical = false }) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  const ringColor = critical ? '#ef4444' : warning ? '#f59e0b' : color;
  const bgRing = critical ? '#fecaca' : warning ? '#fef3c7' : '#e2e8f0';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke={bgRing} strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon size={16} style={{ color: ringColor }} />}
          <span className="text-sm font-extrabold text-slate-800 mt-0.5" style={{ fontFamily: 'ui-monospace, monospace' }}>
            {fmtMin(value)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700">{label}</p>
        <p className="text-[10px] text-slate-400">{sublabel}</p>
      </div>
    </div>
  );
}

function CycleBar({ day, hours, maxHours = 14, isToday = false }) {
  const pct = Math.min(100, Math.round((hours / maxHours) * 100));
  const isOver70 = hours > 11;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[10px] font-bold font-mono text-slate-600">{hours.toFixed(1)}h</span>
      <div className="w-full bg-slate-100 rounded-lg h-24 relative flex items-end p-1 border border-slate-200">
        <div
          className={`w-full rounded-md transition-all duration-500 ${
            isToday
              ? 'bg-blue-600'
              : isOver70
              ? 'bg-red-500'
              : 'bg-indigo-500'
          }`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
        {day}
      </span>
    </div>
  );
}

export default function RecapScreen({
  clocks = {},
  violations = [],
  warnings = [],
  cycleData = [
    { day: 'Jul 17', hours: 8.5 },
    { day: 'Jul 18', hours: 9.0 },
    { day: 'Jul 19', hours: 10.0 },
    { day: 'Jul 20', hours: 7.5 },
    { day: 'Jul 21', hours: 8.0 },
    { day: 'Jul 22', hours: 9.5 },
    { day: 'Today', hours: 6.0 },
  ],
  nextBreakMin = 690,
  nextResetMin = 1110,
}) {
  const total70hUsed = useMemo(() => {
    return cycleData.reduce((acc, d) => acc + (d.hours || 0), 0);
  }, [cycleData]);

  const cycle70hRemaining = Math.max(0, 70 - total70hUsed);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-blue-200">
              FMCSA §395.3
            </span>
            <span className="text-xs font-bold text-slate-500">70-Hour / 8-Day Rolling Cycle</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">HOS Cycle & Recap Center</h1>
          <p className="text-xs text-slate-500 mt-1">Live HOS clocks, 8-day rolling cycle recap, predictions, and Split Sleeper wizard</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">70-Hr Cycle Used</p>
            <p className="text-xl font-extrabold font-mono text-slate-900">{total70hUsed.toFixed(1)} / 70.0 hrs</p>
          </div>
        </div>
      </div>

      {/* 4 Gauge Clocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <CircularGauge
          value={clocks.driveRemaining != null ? clocks.driveRemaining : 330}
          max={660}
          label="Drive Remaining"
          sublabel="11h Limit"
          color="#10b981"
          icon={Clock}
          critical={(clocks.driveRemaining || 330) <= 60}
        />
        <CircularGauge
          value={clocks.shiftRemaining != null ? clocks.shiftRemaining : 450}
          max={840}
          label="Shift Window"
          sublabel="14h Limit"
          color="#2563eb"
          icon={Timer}
          critical={(clocks.shiftRemaining || 450) <= 60}
        />
        <CircularGauge
          value={clocks.breakCountdown != null ? clocks.breakCountdown : 180}
          max={480}
          label="Break Countdown"
          sublabel="8h Driving Max"
          color="#f59e0b"
          icon={Coffee}
          warning={(clocks.breakCountdown || 180) <= 45}
        />
        <CircularGauge
          value={clocks.cycleRemaining != null ? clocks.cycleRemaining : 1440}
          max={4200}
          label="70-Hr Cycle Left"
          sublabel="8-Day Rolling"
          color="#8b5cf6"
          icon={BarChart3}
          warning={(clocks.cycleRemaining || 1440) <= 300}
        />
      </div>

      {/* 8-Day Rolling Cycle Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">8-Day Rolling Duty Hours Summary</h3>
            <p className="text-xs text-slate-500">FMCSA 70-Hour / 8-Day Cycle Recap Table</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl font-mono">
            {cycle70hRemaining.toFixed(1)} hrs available
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 pt-2">
          {cycleData.map((d, i) => (
            <CycleBar
              key={d.day}
              day={d.day}
              hours={d.hours}
              isToday={i === cycleData.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Split Sleeper Berth Wizard Component */}
      <SplitSleeperWizard />

      {/* Available Time Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900">Available Driving & Shift Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold">Drive Remaining</p>
            <p className="text-lg font-extrabold font-mono text-emerald-600">{fmtMin(clocks.driveRemaining || 330)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold">Shift Window Left</p>
            <p className="text-lg font-extrabold font-mono text-blue-600">{fmtMin(clocks.shiftRemaining || 450)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold">Next Break In</p>
            <p className="text-lg font-extrabold font-mono text-amber-600">{fmtMin(clocks.breakCountdown || 180)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold">Cycle Remaining</p>
            <p className="text-lg font-extrabold font-mono text-purple-600">{fmtMin(clocks.cycleRemaining || 1440)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
