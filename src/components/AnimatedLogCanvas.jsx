// src/components/AnimatedLogCanvas.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, CheckCircle2, ZoomIn, ZoomOut, Truck, MapPin, Fuel, Coffee, Bed, PackageCheck } from 'lucide-react';
import { playPencilScratch } from '../utils/soundEffects';
import { exportLogToPdf } from '../utils/PdfExportService';

const ROW_ORDER = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'];
const ROW_LABELS = {
  off_duty: '1. OFF DUTY',
  sleeper_berth: '2. SLEEPER BERTH',
  driving: '3. DRIVING',
  on_duty_not_driving: '4. ON DUTY',
};

const ROW_HEIGHT = 42;
const HOUR_WIDTH = 44;
const MARGIN = { left: 140, top: 80, right: 140, bottom: 120 };

const HOURS_12 = [
  'M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'N', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'M',
];

const COLORS = {
  off_duty: '#94a3b8',
  sleeper_berth: '#f59e0b',
  driving: '#ef4444',
  on_duty_not_driving: '#3b82f6',
};

const STOP_ICONS = {
  Pickup: MapPin,
  'Pre-trip inspection': CheckCircle2,
  'Fuel stop': Fuel,
  '30-min rest break': Coffee,
  '10-hr sleeper reset': Bed,
  'Drop-off': PackageCheck,
};

export default function AnimatedLogCanvas({
  logSheet = null,
  metadata = {},
  autoPlay = true,
  speed = 1,
  onComplete,
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  const requestRef = useRef(null);
  const lastTimeRef = useRef(null);

  const gridW = HOUR_WIDTH * 24;
  const gridH = ROW_HEIGHT * ROW_ORDER.length;
  const width = MARGIN.left + gridW + MARGIN.right;
  const height = MARGIN.top + gridH + MARGIN.bottom;

  const segments = logSheet?.segments || [];
  const logDate = logSheet?.logDate || formatDateISO();
  const totals = logSheet?.totals || { off_duty: 1440, sleeper_berth: 0, driving: 0, on_duty_not_driving: 0 };

  // Calculate polyline points & total path length
  const yOfRow = (rowIdx) => MARGIN.top + rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
  const xOfMin = (m) => MARGIN.left + (m / 1440) * gridW;

  const pathPoints = [];
  let curRow = ROW_ORDER.indexOf('off_duty');
  let curX = MARGIN.left;
  pathPoints.push({ x: curX, y: yOfRow(curRow), min: 0 });

  segments.forEach(seg => {
    const targetRow = ROW_ORDER.indexOf(seg.dutyStatus);
    const sx = xOfMin(seg.startMin || 0);
    const ex = xOfMin(seg.endMin || 1440);

    if (sx > curX) {
      pathPoints.push({ x: sx, y: yOfRow(curRow), min: seg.startMin });
    }
    if (targetRow !== curRow) {
      pathPoints.push({ x: sx, y: yOfRow(targetRow), min: seg.startMin });
    }
    pathPoints.push({ x: ex, y: yOfRow(targetRow), min: seg.endMin });
    curX = ex;
    curRow = targetRow;
  });

  if (curX < MARGIN.left + gridW) {
    const offIdx = ROW_ORDER.indexOf('off_duty');
    pathPoints.push({ x: MARGIN.left + gridW, y: yOfRow(curRow), min: 1440 });
    if (curRow !== offIdx) {
      pathPoints.push({ x: MARGIN.left + gridW, y: yOfRow(offIdx), min: 1440 });
    }
  }

  // Animation frame loop
  const animate = (time) => {
    if (lastTimeRef.current !== null && isPlaying && !isComplete) {
      const delta = time - lastTimeRef.current;
      const durationMs = 8000 / speed; // Base 8 seconds to draw whole log
      setProgress((prev) => {
        const next = prev + delta / durationMs;
        if (next >= 1) {
          setIsComplete(true);
          setIsPlaying(false);
          return 1;
        }
        playPencilScratch(isMuted);
        return next;
      });
    }
    lastTimeRef.current = time;
    if (isPlaying && !isComplete) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying && !isComplete) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, speed, isComplete, isMuted]);

  const handleRestart = () => {
    setProgress(0);
    setIsComplete(false);
    setIsPlaying(true);
  };

  // Interpolate truck position & current hour from progress
  const currentMin = progress * 1440;
  const currentHour = Math.floor(currentMin / 60);

  // Compute interpolated truck position along polyline
  let truckPos = { x: MARGIN.left, y: yOfRow(0) };
  if (pathPoints.length > 0) {
    const targetIdx = pathPoints.findIndex((p) => p.min >= currentMin);
    if (targetIdx <= 0) {
      truckPos = pathPoints[0];
    } else {
      const pPrev = pathPoints[targetIdx - 1];
      const pNext = pathPoints[targetIdx];
      const span = pNext.min - pPrev.min || 1;
      const ratio = Math.max(0, Math.min(1, (currentMin - pPrev.min) / span));
      truckPos = {
        x: pPrev.x + (pNext.x - pPrev.x) * ratio,
        y: pPrev.y + (pNext.y - pPrev.y) * ratio,
      };
    }
  }

  // Generate SVG path string clipped to current progress
  const visiblePoints = [];
  for (let i = 0; i < pathPoints.length; i++) {
    const pt = pathPoints[i];
    if (pt.min <= currentMin) {
      visiblePoints.push(`${pt.x},${pt.y}`);
    } else {
      visiblePoints.push(`${truckPos.x},${truckPos.y}`);
      break;
    }
  }

  const polylineD = visiblePoints.length > 0 ? visiblePoints.join(' ') : `${MARGIN.left},${yOfRow(0)}`;

  // Animated numbers calculation
  const animatedTotals = {
    off_duty: Math.round((totals.off_duty || 0) * progress),
    sleeper_berth: Math.round((totals.sleeper_berth || 0) * progress),
    driving: Math.round((totals.driving || 0) * progress),
    on_duty_not_driving: Math.round((totals.on_duty_not_driving || 0) * progress),
  };

  const grandTotalMins = Object.values(animatedTotals).reduce((a, b) => a + b, 0);

  const fmtHours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl space-y-6">
      {/* Control Bar & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Pause' : 'Play Drawing'}</span>
          </button>

          <button
            onClick={handleRestart}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Replay Animation"
          >
            <RotateCcw size={18} />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  speed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute pencil sound' : 'Mute sound'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Live animated progress and compliance indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300 font-mono">
            <span className="text-slate-500">Timeline:</span>
            <span className="text-indigo-400 font-bold">{String(currentHour).padStart(2, '0')}:00 HRS</span>
          </div>

          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold"
            >
              <CheckCircle2 size={16} />
              <span>FMCSA Compliant Log</span>
            </motion.div>
          )}

          <button
            onClick={() => exportLogToPdf(logSheet, metadata)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main SVG Paper Log Container with Touch Pinch/Zoom */}
      <div className={`relative overflow-x-auto rounded-xl bg-slate-950 p-2 md:p-6 border border-slate-800 transition-all ${isZoomed ? 'scale-110 z-20' : ''}`}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-225 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="drivingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="onDutyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* 1. Header Metadata Section (Animated Slide-up) */}
          <g className="font-sans">
            <text x={MARGIN.left} y={28} className="fill-slate-100 font-bold text-lg">
              DRIVER'S DAILY LOG — {logDate}
            </text>

            <text x={MARGIN.left} y={48} className="fill-slate-400 text-xs">
              Driver: <tspan className="fill-indigo-300 font-semibold">{metadata.driver || 'John Smith'}</tspan>
            </text>
            <text x={MARGIN.left + 220} y={48} className="fill-slate-400 text-xs">
              Carrier: <tspan className="fill-slate-200 font-semibold">{metadata.carrier || 'LogRoute AI Fleet'}</tspan>
            </text>
            <text x={MARGIN.left + 460} y={48} className="fill-slate-400 text-xs">
              Vehicle: <tspan className="fill-slate-200 font-semibold">{metadata.vehicle || 'Truck #4417'}</tspan>
            </text>
            <text x={MARGIN.left + 680} y={48} className="fill-slate-400 text-xs">
              Miles: <tspan className="fill-emerald-400 font-bold">{metadata.totalMiles || '842'} mi</tspan>
            </text>
          </g>

          {/* 2. Top Time-Axis Hour Labels (Highlight active hour) */}
          {HOURS_12.map((label, i) => {
            const x = MARGIN.left + i * HOUR_WIDTH;
            const isActive = i === currentHour;
            return (
              <g key={`tlabel-${i}`}>
                <text
                  x={x}
                  y={MARGIN.top - 12}
                  textAnchor="middle"
                  className={`text-xs font-mono transition-colors ${
                    isActive ? 'fill-indigo-400 font-bold text-sm' : 'fill-slate-400'
                  }`}
                >
                  {label}
                </text>
                {isActive && (
                  <circle cx={x} cy={MARGIN.top - 4} r={3} fill="#6366f1" />
                )}
              </g>
            );
          })}

          {/* 3. Grid Background & Row Rows */}
          {ROW_ORDER.map((status, idx) => {
            const y = MARGIN.top + idx * ROW_HEIGHT;
            return (
              <g key={`row-${status}`}>
                {/* Row alternating background */}
                <rect
                  x={MARGIN.left}
                  y={y}
                  width={gridW}
                  height={ROW_HEIGHT}
                  fill={idx % 2 === 0 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(15, 23, 42, 0.4)'}
                />
                {/* Bottom row line */}
                <line
                  x1={MARGIN.left}
                  y1={y + ROW_HEIGHT}
                  x2={MARGIN.left + gridW}
                  y2={y + ROW_HEIGHT}
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Row Label (Left) */}
                <text
                  x={MARGIN.left - 15}
                  y={y + ROW_HEIGHT / 2 + 4}
                  textAnchor="end"
                  className="fill-slate-300 text-xs font-semibold"
                >
                  {ROW_LABELS[status]}
                </text>
              </g>
            );
          })}
          {/* Grid Top Border */}
          <line
            x1={MARGIN.left}
            y1={MARGIN.top}
            x2={MARGIN.left + gridW}
            y2={MARGIN.top}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* 4. Vertical Hour Lines & 15-Minute Sub-ticks */}
          {Array.from({ length: 25 }, (_, i) => {
            const x = MARGIN.left + i * HOUR_WIDTH;
            return (
              <g key={`vline-${i}`}>
                <line
                  x1={x}
                  y1={MARGIN.top}
                  x2={x}
                  y2={MARGIN.top + gridH}
                  stroke="#334155"
                  strokeWidth={i % 6 === 0 ? '1.5' : '0.5'}
                  strokeDasharray={i % 6 === 0 ? '' : '2 2'}
                />
                {/* 15-min sub ticks inside rows */}
                {i < 24 &&
                  [1, 2, 3].map((q) => {
                    const qx = x + (q * HOUR_WIDTH) / 4;
                    return ROW_ORDER.map((_, rIdx) => {
                      const ry = MARGIN.top + rIdx * ROW_HEIGHT;
                      return (
                        <line
                          key={`sub-${i}-${q}-${rIdx}`}
                          x1={qx}
                          y1={ry}
                          x2={qx}
                          y2={ry + 5}
                          stroke="#475569"
                          strokeWidth="0.5"
                        />
                      );
                    });
                  })}
              </g>
            );
          })}

          {/* 5. Animated Duty Status Background Color Bands */}
          {segments.map((seg, idx) => {
            const segStartMin = seg.startMin || 0;
            const segEndMin = seg.endMin || 1440;

            if (segStartMin >= currentMin) return null; // Not reached yet

            const activeEndMin = Math.min(segEndMin, currentMin);
            const rowIdx = ROW_ORDER.indexOf(seg.dutyStatus);
            const yBase = MARGIN.top + rowIdx * ROW_HEIGHT;
            const sx = xOfMin(segStartMin);
            const widthPx = Math.max(0, xOfMin(activeEndMin) - sx);

            return (
              <g key={`fill-${idx}`}>
                <rect
                  x={sx}
                  y={yBase + 2}
                  width={widthPx}
                  height={ROW_HEIGHT - 4}
                  fill={COLORS[seg.dutyStatus]}
                  fillOpacity="0.25"
                  rx="2"
                />
              </g>
            );
          })}

          {/* 6. Main Animated Polyline (Simulates ruler pen drawing) */}
          <polyline
            points={polylineD}
            fill="none"
            stroke="#818cf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 7. Stop Waypoint Labels (Pop in when pen reaches them) */}
          {segments.filter((s) => s.annotation).map((seg, i) => {
            const segMin = seg.startMin || 0;
            if (currentMin < segMin) return null;

            const sx = xOfMin(segMin);
            const yR = MARGIN.top + gridH + 15;
            const loc = seg.location ? ` (${seg.location.city || ''}, ${seg.location.state || ''})` : '';

            return (
              <g key={`waypoint-${i}`} className="animate-bounce-short">
                <line
                  x1={sx}
                  y1={MARGIN.top + gridH}
                  x2={sx}
                  y2={yR}
                  stroke="#a5b4fc"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <circle cx={sx} cy={yR} r="4" fill="#6366f1" />
                <text
                  x={sx + 6}
                  y={yR + 14}
                  transform={`rotate(40, ${sx}, ${yR + 14})`}
                  className="fill-indigo-200 text-[10px] font-semibold"
                >
                  📍 {seg.annotation}{loc}
                </text>
              </g>
            );
          })}

          {/* 8. Moving Truck Icon 🚛 following the drawing tip */}
          {!isComplete && (
            <g transform={`translate(${truckPos.x - 14}, ${truckPos.y - 14})`}>
              <circle cx="14" cy="14" r="16" fill="#6366f1" fillOpacity="0.3" className="animate-ping" />
              <rect x="2" y="2" width="24" height="24" rx="12" fill="#4f46e5" stroke="#818cf8" strokeWidth="2" />
              <text x="14" y="18" textAnchor="middle" className="text-xs select-none">
                🚛
              </text>
            </g>
          )}

          {/* 9. Right-Side Summary Hours Column */}
          <g>
            <text x={MARGIN.left + gridW + 20} y={MARGIN.top - 12} className="fill-slate-400 font-bold text-xs">
              HOURS
            </text>

            {ROW_ORDER.map((status, idx) => {
              const y = MARGIN.top + idx * ROW_HEIGHT + ROW_HEIGHT / 2 + 4;
              return (
                <text
                  key={`tot-${status}`}
                  x={MARGIN.left + gridW + 35}
                  y={y}
                  className="fill-indigo-300 font-mono font-bold text-xs"
                >
                  {fmtHours(animatedTotals[status])}
                </text>
              );
            })}

            {/* 24-Hour Circular Total Indicator */}
            <g transform={`translate(${MARGIN.left + gridW + 80}, ${MARGIN.top + gridH / 2})`}>
              <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#334155" strokeWidth="3" />
              <circle
                cx="0"
                cy="0"
                r="28"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeDasharray={175}
                strokeDashoffset={175 * (1 - progress)}
                transform="rotate(-90)"
              />
              <text x="0" y="-2" textAnchor="middle" className="fill-slate-100 font-bold text-xs font-mono">
                {fmtHours(grandTotalMins)}
              </text>
              <text x="0" y="12" textAnchor="middle" className="fill-slate-400 text-[9px] uppercase font-bold">
                TOTAL
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Bottom Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {ROW_ORDER.map((s) => (
          <div key={s} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[s] }} />
            <div>
              <div className="text-slate-400 text-xs font-medium">{ROW_LABELS[s]}</div>
              <div className="text-slate-100 font-bold font-mono text-sm">
                {fmtHours(totals[s] || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
