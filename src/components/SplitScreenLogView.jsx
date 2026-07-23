// src/components/SplitScreenLogView.jsx
import React, { useState } from 'react';
import InteractiveTimelineEditor from './InteractiveTimelineEditor';
import LogSheetCanvas from './LogSheetCanvas';
import PlaybackControls from './PlaybackControls';
import { ShieldCheck, AlertTriangle, Download, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { exportLogToPdf } from '../utils/PdfExportService';
import { formatDateISO } from '../services/timeService';

export default function SplitScreenLogView({
  blocks = [],
  onChangeBlocks,
  metadata = {},
  complianceStatus = 'legal', // 'legal' | 'warning' | 'violation'
  activeMin = 0,
  setActiveMin,
  isPlaying = false,
  setIsPlaying,
  playbackSpeed = 1,
  setPlaybackSpeed,
}) {
  const [isMuted, setIsMuted] = useState(false);

  const todayIso = metadata.date || formatDateISO();
  const dayStart = new Date(`${todayIso}T00:00:00Z`);

  // Convert timeline blocks into Date & minute-based segments for LogSheetCanvas
  const logSegments = blocks.map((b) => ({
    dutyStatus: b.dutyStatus,
    start: new Date(dayStart.getTime() + (b.startMin || 0) * 60000),
    end: new Date(dayStart.getTime() + (b.endMin || 1440) * 60000),
    startMin: b.startMin,
    endMin: b.endMin,
    location: b.location,
    annotation: b.annotation,
    bracketed: b.bracketed,
  }));

  return (
    <div className="space-y-6">
      {/* Playback Control Bar */}
      <PlaybackControls
        isPlaying={isPlaying}
        onTogglePlay={setIsPlaying}
        activeMin={activeMin}
        onChangeMin={setActiveMin}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        isMuted={isMuted}
        onToggleMute={setIsMuted}
      />

      {/* Main Container: Interactive 24-Hour Timeline Editor + Clean FMCSA Log Sheet Canvas */}
      <div className="space-y-6">
        {/* TOP SECTION: Interactive Timeline Editor Grid */}
        <div
          className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4 transition-all ${
            complianceStatus === 'violation'
              ? 'ring-2 ring-rose-500'
              : complianceStatus === 'warning'
              ? 'ring-2 ring-amber-500'
              : 'ring-1 ring-emerald-500/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 text-base">Interactive 24-Hour Timeline Editor</h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {complianceStatus === 'legal' && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-lg flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>FMCSA Compliant ✓</span>
                </span>
              )}

              {complianceStatus === 'warning' && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-lg flex items-center gap-1">
                  <AlertTriangle size={14} />
                  <span>HOS Warning</span>
                </span>
              )}

              {complianceStatus === 'violation' && (
                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg flex items-center gap-1">
                  <AlertTriangle size={14} />
                  <span>HOS Violation</span>
                </span>
              )}
            </div>
          </div>

          <InteractiveTimelineEditor
            blocks={blocks}
            onChangeBlocks={onChangeBlocks}
            activeMin={activeMin}
            metadata={metadata}
            complianceStatus={complianceStatus}
          />
        </div>

        {/* BOTTOM SECTION: Official FMCSA Paper Log Live Preview directly UNDER the Timeline Editor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Official FMCSA Paper Log Live Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Updates instantly in real-time as you drag or edit timeline blocks above
                </p>
              </div>
            </div>

            <button
              onClick={() => exportLogToPdf(blocks, metadata)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Download size={14} />
              <span>Export PDF</span>
            </button>
          </div>

          {/* Render clean, white SVG LogSheetCanvas with exact 24:00 total and Co-Driver metadata */}
          <div className="overflow-x-auto bg-slate-50 border border-slate-200 rounded-xl p-3">
            <LogSheetCanvas
              logDate={todayIso}
              segments={logSegments}
              metadata={{
                driver: metadata.driver || 'John Smith',
                coDriver: metadata.coDriver || 'Robert Davis (DL-88210-TX)',
                carrier: metadata.carrier || 'ABC Logistics LLC',
                vehicle: metadata.vehicle || 'Tractor #T-108 / Trailer #TR-402',
                totalMiles: metadata.totalMiles || 842,
                shippingDoc: metadata.shippingDoc || 'BOL-99210-A',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
