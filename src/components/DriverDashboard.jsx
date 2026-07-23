// src/components/DriverDashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// Driver Overview Dashboard — Enterprise Commercial ELD (Samsara/Motive Grade)
// Personal Conveyance, Yard Moves, HOS Exceptions, & Violations Center
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Clock, ShieldCheck, Coffee, Compass, Download, Truck, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, Radio, FileText, Lock, Users, Activity, AlertTriangle,
  Zap, ShieldAlert, CheckSquare, Settings, Navigation, AlertOctagon, HelpCircle, X
} from 'lucide-react';
import useRealTime from '../hooks/useRealTime';
import LogSheetCanvas from './LogSheetCanvas';
import { useTimelineStore } from '../stores/useTimelineStore';

export default function DriverDashboard({
  driverName = 'John Smith',
  currentStatus = 'driving',
  onStatusChange,
  activeTrip = null,
  onNavigateTab,
  onExportPdf,
  onAcceptAiBreak,
  clocks = {},
  violations = [],
  warnings = [],
  complianceStatus = 'legal',
  timelineBlocks = null,
}) {
  const realTime = useRealTime();
  const [dayOffset, setDayOffset] = useState(0);
  const [showAiSuggestion, setShowAiSuggestion] = useState(true);
  const [coDriverName, setCoDriverName] = useState('Robert Davis (DL-88210-TX)');
  const [isEditingCoDriver, setIsEditingCoDriver] = useState(false);

  // Special Category Modal State
  const [pcYmModalType, setPcYmModalType] = useState(null); // 'personal_conveyance' | 'yard_move'
  const [pcYmReason, setPcYmReason] = useState('');

  // Store timeline blocks & enterprise HOS exception store
  const {
    blocks: storeBlocks,
    ruleSet,
    setRuleSet,
    activeExceptions,
    toggleException,
    unidentifiedEvents,
    assignUnidentifiedEvent,
    updateDutyStatus,
  } = useTimelineStore();

  const activeBlocks = timelineBlocks && timelineBlocks.length > 0 ? timelineBlocks : storeBlocks;

  const displayDateObj = new Date(realTime.date.getTime() + dayOffset * 86400000);
  const dateIso = displayDateObj.toISOString().split('T')[0];
  const displayLongDate = displayDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const isToday = dayOffset === 0;

  const dayStart = new Date(`${dateIso}T00:00:00Z`);
  const logSegments = activeBlocks.map((b) => ({
    dutyStatus: b.dutyStatus,
    start: new Date(dayStart.getTime() + (b.startMin || 0) * 60000),
    end: new Date(dayStart.getTime() + (b.endMin || 1440) * 60000),
    startMin: b.startMin,
    endMin: b.endMin,
    location: b.location,
    annotation: b.annotation,
    bracketed: b.bracketed,
  }));

  const formatMin = (mins) => {
    if (mins === undefined || mins === null) return '0m';
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.round(Math.abs(mins) % 60);
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} mins`;
  };

  const hosClocks = [
    {
      id: 'drive',
      title: 'Drive Remaining',
      limit: `${clocks.baseDriveLimitHours || 11}h 00m`,
      remaining: formatMin(clocks.driveRemaining),
      percent: Math.min(100, Math.round(((clocks.driveRemaining || 0) / ((clocks.baseDriveLimitHours || 11) * 60)) * 100)),
      color: (clocks.driveRemaining || 0) <= 60 ? 'bg-red-500' : 'bg-emerald-500',
      textColor: (clocks.driveRemaining || 0) <= 60 ? 'text-red-600' : 'text-slate-900',
      badge: exceptionsBadgeText('Drive Limit'),
      warning: (clocks.driveRemaining || 0) <= 60,
    },
    {
      id: 'window',
      title: 'Shift Window',
      limit: `${clocks.baseWindowLimitHours || 14}h 00m`,
      remaining: formatMin(clocks.shiftRemaining),
      percent: Math.min(100, Math.round(((clocks.shiftRemaining || 0) / ((clocks.baseWindowLimitHours || 14) * 60)) * 100)),
      color: (clocks.shiftRemaining || 0) <= 60 ? 'bg-red-500' : 'bg-blue-600',
      textColor: (clocks.shiftRemaining || 0) <= 60 ? 'text-red-600' : 'text-slate-900',
      badge: exceptionsBadgeText('Shift Window'),
      warning: (clocks.shiftRemaining || 0) <= 60,
    },
    {
      id: 'break',
      title: 'Next Break In',
      limit: '8h 00m',
      remaining: activeExceptions.shortHaulExemption ? 'Exempt' : formatMin(clocks.breakCountdown),
      percent: activeExceptions.shortHaulExemption ? 100 : Math.min(100, Math.round(((clocks.breakCountdown || 0) / 480) * 100)),
      color: (clocks.breakCountdown || 0) <= 45 ? 'bg-red-500' : 'bg-amber-500',
      textColor: (clocks.breakCountdown || 0) <= 45 ? 'text-red-600' : 'text-slate-900',
      badge: activeExceptions.shortHaulExemption ? '150-Mile Exempt' : '30-Min Rest',
      warning: (clocks.breakCountdown || 0) <= 45 && !activeExceptions.shortHaulExemption,
    },
    {
      id: 'cycle',
      title: '70-Hr Cycle Left',
      limit: '70h 00m',
      remaining: formatMin(clocks.cycleRemaining),
      percent: Math.min(100, Math.round(((clocks.cycleRemaining || 0) / 4200) * 100)),
      color: (clocks.cycleRemaining || 0) <= 120 ? 'bg-red-500' : 'bg-purple-600',
      textColor: (clocks.cycleRemaining || 0) <= 120 ? 'text-red-600' : 'text-slate-900',
      badge: '8-Day Cycle',
      warning: (clocks.cycleRemaining || 0) <= 120,
    },
  ];

  function exceptionsBadgeText(defaultText) {
    if (activeExceptions.adverseDriving) return 'Adverse +2h';
    if (activeExceptions.sixteenHourException) return '16-Hr Window';
    return defaultText;
  }

  const handleConfirmPcYm = () => {
    if (!pcYmModalType || !pcYmReason.trim()) return;
    updateDutyStatus(
      pcYmModalType === 'personal_conveyance' ? 'off_duty' : 'on_duty_not_driving',
      null,
      null,
      pcYmModalType,
      pcYmReason
    );
    setPcYmModalType(null);
    setPcYmReason('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Rule Set & Exception Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-700">HOS Rule Set:</span>
          </div>

          <select
            value={ruleSet}
            onChange={(e) => setRuleSet(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
          >
            <option value="interstate_70_8">Interstate 70-Hr / 8-Day (§395.3)</option>
            <option value="interstate_60_7">Interstate 60-Hr / 7-Day (§395.3)</option>
            <option value="intrastate_tx">Intrastate Texas (12h Drive / 15h Shift)</option>
            <option value="intrastate_ca">Intrastate California (12h Drive / 16h Shift)</option>
          </select>
        </div>

        {/* Exception Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toggleException('adverseDriving')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeExceptions.adverseDriving
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Claim +2h driving and shift window for unexpected adverse weather/road closures (§395.1(b)(1))"
          >
            ⚡ Adverse Driving (+2h)
          </button>

          <button
            onClick={() => toggleException('sixteenHourException')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeExceptions.sixteenHourException
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Claim 16-hour short-haul duty window extension (1x / 7 days per §395.1(o))"
          >
            ⏱️ 16-Hr Window Extension
          </button>

          <button
            onClick={() => toggleException('shortHaulExemption')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeExceptions.shortHaulExemption
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="150 Air-Mile Short Haul Exemption (§395.1(e))"
          >
            📍 150 Air-Mile Exempt
          </button>
        </div>
      </div>

      {/* Top Date Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDayOffset((prev) => prev - 1)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors"
            title="Previous Day Log"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base">{displayLongDate}</span>
              {isToday && (
                <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/60">
                  Today
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <Clock size={12} className="text-blue-600" />
              <span>{realTime.timeString}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold font-sans">
                <Radio size={10} className="animate-pulse" />
                {realTime.timeSource}
              </span>
            </div>
          </div>

          <button
            onClick={() => setDayOffset((prev) => prev + 1)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors"
            title="Next Day Log"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => setDayOffset(0)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              Return to Today
            </button>
          )}
          {complianceStatus === 'legal' ? (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>FMCSA Legal (No Violations)</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>HOS Limit Attention Required</span>
            </span>
          )}
        </div>
      </div>

      {/* Unidentified Driving Alerts Card */}
      {unidentifiedEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
              <AlertOctagon size={16} className="text-amber-600" />
              <span>Unidentified Vehicle Driving Events Detected ({unidentifiedEvents.length})</span>
            </div>
            <span className="text-[10px] text-amber-700 font-semibold font-mono">FMCSA §395.32 Mandatory Claim</span>
          </div>

          {unidentifiedEvents.map((evt) => (
            <div key={evt.id} className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900">{evt.date} at {evt.startTime}</span> — <span className="text-amber-800 font-mono">{evt.durationMins} mins ({evt.miles} miles)</span>
                <p className="text-[11px] text-slate-500">Unassigned truck movement detected while logged off.</p>
              </div>
              <button
                onClick={() => assignUnidentifiedEvent(evt.id, driverName)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all"
              >
                Claim & Assign to My Log
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Driver Welcome Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>Active ELD Synchronized</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome back, <span className="text-blue-600">{driverName}</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Active Route: <strong className="text-slate-800">{activeTrip ? `${activeTrip.origin} → ${activeTrip.destination}` : 'Dallas, TX → Houston, TX'}</strong>
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('trip_planner')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs active:scale-95"
        >
          <Compass size={16} />
          <span>Create Trip Plan</span>
        </button>
      </div>

      {/* 4 HOS Gauge Clocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hosClocks.map((clk) => (
          <div
            key={clk.id}
            className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
              clk.warning ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold">{clk.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${clk.warning ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                {clk.badge}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-extrabold font-mono ${clk.textColor}`}>{clk.remaining}</span>
              <span className="text-xs text-slate-400">Max {clk.limit}</span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden border border-slate-200/60">
              <div
                className={`h-full rounded-full ${clk.color} transition-all duration-500`}
                style={{ width: `${clk.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Duty Status Switcher + Special Categories (Personal Conveyance & Yard Move) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-slate-900 font-extrabold text-sm">Active Duty Status Switcher</span>
          <span className="text-xs text-blue-600 font-mono font-bold uppercase flex items-center gap-1.5">
            <Activity size={14} className="animate-pulse" />
            Current: {currentStatus.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onStatusChange('off_duty')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              currentStatus === 'off_duty' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Off Duty 🏠
          </button>
          <button
            onClick={() => onStatusChange('sleeper_berth')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              currentStatus === 'sleeper_berth' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Sleeper Berth 🛏️
          </button>
          <button
            onClick={() => onStatusChange('driving')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              currentStatus === 'driving' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Driving 🚛
          </button>
          <button
            onClick={() => onStatusChange('on_duty_not_driving')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              currentStatus === 'on_duty_not_driving' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            On Duty 🛠️
          </button>
        </div>

        {/* Special Duty Categories (§395.28) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Special Duty Conditions (§395.28):</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPcYmModalType('personal_conveyance')}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Navigation size={14} className="text-emerald-600" />
              <span>Personal Conveyance (PC)</span>
            </button>

            <button
              onClick={() => setPcYmModalType('yard_move')}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Truck size={14} className="text-amber-600" />
              <span>Yard Move (YM)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Special Duty Category Driver Reason Modal */}
      {pcYmModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Enable {pcYmModalType === 'personal_conveyance' ? 'Personal Conveyance (PC)' : 'Yard Move (YM)'}
              </h3>
              <button onClick={() => setPcYmModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              FMCSA §395.28 requires a mandatory driver annotation for special driving categories before activation.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Enter Driver Reason / Note:</label>
              <input
                type="text"
                required
                value={pcYmReason}
                onChange={(e) => setPcYmReason(e.target.value)}
                placeholder={pcYmModalType === 'personal_conveyance' ? 'e.g. Driving truck to motel for rest' : 'e.g. Moving trailer within terminal yard'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPcYmModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={!pcYmReason.trim()}
                onClick={handleConfirmPcYm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Confirm & Set Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Real-Time Driver Log Book Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Real-Time Driver Log Book (RODS)
                </h2>
                <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Lock size={10} className="text-emerald-700" /> Read-Only Live Record
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official FMCSA Form 395.8 Record of Duty Status — Live Driver Log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl">
              <Users size={14} className="text-blue-600" />
              <span className="font-semibold text-slate-500">Co-Driver:</span>
              {isEditingCoDriver ? (
                <input
                  type="text"
                  value={coDriverName}
                  onChange={(e) => setCoDriverName(e.target.value)}
                  onBlur={() => setIsEditingCoDriver(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingCoDriver(false)}
                  className="bg-white text-slate-900 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold outline-none"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => setIsEditingCoDriver(true)}
                  className="font-bold text-slate-900 cursor-pointer hover:underline"
                  title="Click to edit co-driver"
                >
                  {coDriverName}
                </span>
              )}
            </div>

            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                <Download size={14} />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Real-Time LogSheetCanvas */}
        <div className="overflow-x-auto bg-slate-50 border border-slate-200 rounded-xl p-3 relative select-none">
          <LogSheetCanvas
            logDate={dateIso}
            segments={logSegments}
            metadata={{
              driver: driverName,
              coDriver: coDriverName,
              carrier: 'ABC Logistics LLC',
              vehicle: 'Tractor #T-108 / Trailer #TR-402',
              totalMiles: 842,
              shippingDoc: 'BOL-99210-A',
              origin: activeTrip?.origin || 'Dallas, TX',
              destination: activeTrip?.destination || 'Houston, TX',
            }}
          />
        </div>
      </div>
    </div>
  );
}
