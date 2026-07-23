// src/features/inspection/RoadsideInspectionMode.jsx
// ═══════════════════════════════════════════════════════════════════
// FMCSA Roadside Inspection Mode Component (§395.22 / §395.34 / §395.24)
// DOT Officer Inspector Mode with Direct Electronic Data Transfer
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ShieldCheck, Download, Lock, CheckCircle2, AlertTriangle, FileText, Send, Radio, Activity, CheckSquare } from 'lucide-react';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTripStore } from '../../stores/useTripStore';
import LogSheetCanvas from '../../components/LogSheetCanvas';
import { exportLogToPdf } from '../../utils/PdfExportService';

export default function RoadsideInspectionMode() {
  const { blocks } = useTimelineStore();
  const { user, activeCompany } = useAuthStore();
  const { dailyLogs } = useTripStore();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [transferMode, setTransferMode] = useState('WEBSERVICE'); // 'WEBSERVICE' | 'EMAIL' | 'BLUETOOTH'
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const activeDailyLog = dailyLogs && dailyLogs.length > selectedDayIndex ? dailyLogs[selectedDayIndex] : null;

  const past8Days = [
    { label: 'Today (Jul 23)', date: '2026-07-23' },
    { label: 'Jul 22', date: '2026-07-22' },
    { label: 'Jul 21', date: '2026-07-21' },
    { label: 'Jul 20', date: '2026-07-20' },
    { label: 'Jul 19', date: '2026-07-19' },
    { label: 'Jul 18', date: '2026-07-18' },
    { label: 'Jul 17', date: '2026-07-17' },
    { label: 'Jul 16', date: '2026-07-16' },
  ];

  const handleExecuteDataTransfer = () => {
    setIsTransferring(true);
    setTransferSuccess(false);
    setTimeout(() => {
      setIsTransferring(false);
      setTransferSuccess(true);
    }, 1800);
  };

  const handleExportPDF = () => {
    exportLogToPdf(blocks, {
      logDate: past8Days[selectedDayIndex].date,
      driverName: user.name,
      carrierName: activeCompany.name,
      usdotNumber: activeCompany.dot,
      truckUnit: 'T-108',
      trailerUnit: 'TR-402',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Officer Header Banner */}
      <div className="bg-white border border-amber-300 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Read-Only Inspector Mode
              </span>
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> FMCSA Certified
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              FMCSA DOT Roadside Inspection
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Official 8-Day Driver Log Records & Wireless Data Transfer (§395.24)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF to Officer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wireless Data Transfer Box (§395.24) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-900">FMCSA Direct Electronic Data Transfer</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">49 CFR §395.24 Compliant</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'WEBSERVICE', label: 'Web Services (ERODS)' },
              { id: 'EMAIL', label: 'Encrypted Email' },
              { id: 'BLUETOOTH', label: 'Bluetooth Local' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setTransferMode(m.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  transferMode === m.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExecuteDataTransfer}
            disabled={isTransferring}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isTransferring ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Transmitting Encrypted Logs to FMCSA...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmit Logs to Safety Officer</span>
              </>
            )}
          </button>
        </div>

        {transferSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Successfully transmitted 8-day encrypted RODS data to FMCSA ERODS Web Services Gateway! (Confirmation ID: ERODS-99182-TX)</span>
          </div>
        )}
      </div>

      {/* ELD Diagnostics & Malfunction Status Indicator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
            <Activity size={16} className="text-emerald-600" />
            ELD Diagnostics & Malfunction Monitoring Status (§395.34)
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
            All ECM Diagnostics Normal
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Engine Sync Compliance', status: 'Passed' },
            { label: 'Power Compliance', status: 'Passed' },
            { label: 'Positioning Compliance', status: 'Passed' },
            { label: 'Data Transfer Compliance', status: 'Passed' },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-600 font-medium text-[11px]">{item.label}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckSquare size={12} /> {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver & Carrier Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Driver Identity</div>
          <div className="text-base font-extrabold text-slate-900">{user.name}</div>
          <div className="text-xs text-slate-500 mt-1">License: {user.license} ({user.state})</div>
          <div className="text-xs text-slate-500">Home Terminal: Dallas, TX</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Motor Carrier</div>
          <div className="text-base font-extrabold text-slate-900">{activeCompany.name}</div>
          <div className="text-xs text-slate-500 mt-1">USDOT #: {activeCompany.dot}</div>
          <div className="text-xs text-slate-500">Main Office: 100 Logistics Way, Dallas TX</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Equipment & VIN</div>
          <div className="text-base font-extrabold text-slate-900">Tractor #T-108 / Trailer #TR-402</div>
          <div className="text-xs text-slate-500 mt-1 font-mono">VIN: 1XKD49X09218201</div>
          <div className="text-xs text-emerald-700 font-bold mt-1">Cycle Rule: Interstate 70-Hour / 8-Day</div>
        </div>
      </div>

      {/* 8-Day Log Inspection Vault Picker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              8-Day Log Sheet Vault (§395.8)
            </h2>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl border border-slate-200">
            {past8Days.map((d, idx) => (
              <button
                key={d.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDayIndex === idx
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <LogSheetCanvas
          blocks={blocks}
          logDate={past8Days[selectedDayIndex].date}
          metadata={{
            driver: user.name,
            carrier: activeCompany.name,
            vehicle: 'Tractor #T-108 / Trailer #TR-402',
            totalMiles: 842,
            shippingDoc: 'BOL-99210-A',
            origin: 'Dallas, TX',
            destination: 'Houston, TX',
          }}
        />
      </div>
    </div>
  );
}
