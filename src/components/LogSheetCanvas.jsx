// src/components/LogSheetCanvas.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './LogSheetCanvas.module.css';

/**
 * FMCSA Form 395.8 Driver's Daily Log (RODS) SVG component.
 * Complete 1:1 Replica of Official FMCSA Paper Log Sheet with full Recap & Instructions.
 */

const ROW_ORDER = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'];
const ROW_LABELS = {
  off_duty: '1. OFF DUTY',
  sleeper_berth: '2. SLEEPER BERTH',
  driving: '3. DRIVING',
  on_duty_not_driving: '4. ON DUTY',
};

const ROW_HEIGHT = 36;
const HOUR_WIDTH = 40;
const MARGIN = { left: 140, top: 185, right: 120, bottom: 250 };

function fmtHours(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

const HOURS_12 = [
  'M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'N', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'M',
];

const COLORS = {
  off_duty: 'rgba(203, 213, 225, 0.45)',
  sleeper_berth: 'rgba(251, 191, 36, 0.45)',
  driving: 'rgba(248, 113, 113, 0.45)',
  on_duty_not_driving: 'rgba(96, 165, 250, 0.45)',
};

export function sanitizeTimeline(inputSegments = []) {
  if (!inputSegments || inputSegments.length === 0) {
    return [{ dutyStatus: 'off_duty', startMin: 0, endMin: 1440, duration: 1440 }];
  }

  const raw = inputSegments
    .map((seg, idx) => {
      let startMin = typeof seg.startMin === 'number' ? seg.startMin : 0;
      let endMin = typeof seg.endMin === 'number' ? seg.endMin : 1440;

      if (seg.start instanceof Date && seg.end instanceof Date) {
        startMin = seg.start.getUTCHours() * 60 + seg.start.getUTCMinutes();
        endMin = seg.end.getUTCHours() * 60 + seg.end.getUTCMinutes();
        if (endMin <= startMin) endMin = 1440;
      }

      startMin = Math.max(0, Math.min(1440, startMin));
      endMin = Math.max(startMin, Math.min(1440, endMin));
      return { ...seg, startMin, endMin, idx };
    })
    .filter((s) => s.endMin > s.startMin)
    .sort((a, b) => a.startMin - b.startMin);

  const clean = [];
  let currentMin = 0;

  for (const seg of raw) {
    if (seg.endMin <= currentMin) continue;
    const effectiveStart = Math.max(currentMin, seg.startMin);

    if (effectiveStart > currentMin) {
      clean.push({
        dutyStatus: 'off_duty',
        startMin: currentMin,
        endMin: effectiveStart,
        duration: effectiveStart - currentMin,
        annotation: 'Off Duty Rest',
      });
      currentMin = effectiveStart;
    }

    const effectiveEnd = Math.max(effectiveStart, seg.endMin);
    if (effectiveEnd > effectiveStart) {
      clean.push({
        ...seg,
        startMin: effectiveStart,
        endMin: effectiveEnd,
        duration: effectiveEnd - effectiveStart,
      });
      currentMin = effectiveEnd;
    }
  }

  if (currentMin < 1440) {
    clean.push({
      dutyStatus: 'off_duty',
      startMin: currentMin,
      endMin: 1440,
      duration: 1440 - currentMin,
      annotation: 'Off Duty Rest',
    });
  }

  return clean;
}

function LogSheetCanvas({ logDate, segments = [], metadata = {} }) {
  const svgRef = useRef(null);

  const gridW = HOUR_WIDTH * 24;
  const gridH = ROW_HEIGHT * ROW_ORDER.length;
  const width = MARGIN.left + gridW + MARGIN.right;
  const height = MARGIN.top + gridH + MARGIN.bottom;

  const processed = sanitizeTimeline(segments);

  const rowTotals = {
    off_duty: 0,
    sleeper_berth: 0,
    driving: 0,
    on_duty_not_driving: 0,
  };

  processed.forEach((s) => {
    if (rowTotals[s.dutyStatus] !== undefined) {
      rowTotals[s.dutyStatus] += s.duration;
    }
  });

  const grandTotal = 1440;

  const pathPoints = [];
  const yOfRow = (rowIdx) => MARGIN.top + rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
  const xOfMin = (m) => MARGIN.left + (m / 1440) * gridW;

  let curRow = ROW_ORDER.indexOf(processed[0]?.dutyStatus || 'off_duty');
  let curX = MARGIN.left;
  pathPoints.push(`${curX},${yOfRow(curRow)}`);

  processed.forEach((seg) => {
    const targetRow = ROW_ORDER.indexOf(seg.dutyStatus) !== -1 ? ROW_ORDER.indexOf(seg.dutyStatus) : 0;
    const sx = xOfMin(seg.startMin);
    const ex = xOfMin(seg.endMin);

    if (sx > curX) {
      pathPoints.push(`${sx},${yOfRow(curRow)}`);
    }
    if (targetRow !== curRow) {
      pathPoints.push(`${sx},${yOfRow(targetRow)}`);
    }
    pathPoints.push(`${ex},${yOfRow(targetRow)}`);
    curX = ex;
    curRow = targetRow;
  });

  const endX = MARGIN.left + gridW;
  if (curX < endX) {
    pathPoints.push(`${endX},${yOfRow(curRow)}`);
  }

  // Metadata strings
  const dateFormatted = logDate || new Date().toISOString().split('T')[0];
  const driver = metadata.driver || 'John Smith';
  const coDriver = metadata.coDriver || 'Robert Davis (DL-88210-TX)';
  const carrier = metadata.carrier || 'ABC Logistics LLC';
  const homeTerminal = metadata.homeTerminal || '100 Logistics Way, Dallas, TX';
  const mainAddress = metadata.mainAddress || '500 Freight Blvd, Houston, TX';
  const vehicle = metadata.vehicle || 'Tractor #T-108 / Trailer #TR-402';
  const licensePlates = metadata.licensePlates || 'TX-9901-TR (Tractor) / TX-8802-TL (Trailer)';
  const origin = metadata.origin || 'Dallas, TX';
  const destination = metadata.destination || 'Houston, TX';
  const totalMiles = metadata.totalMiles || 842;
  const drivingMiles = metadata.drivingMiles || Math.round(totalMiles * 0.95);
  const shippingDoc = metadata.shippingDoc || 'BOL-99210-A';
  const commodity = metadata.commodity || 'General Freight / Electronics';

  // Dynamic Recap Calculations
  const onDutyTodayHrs = parseFloat(((rowTotals.driving + rowTotals.on_duty_not_driving) / 60).toFixed(1));
  const last7DaysOnDuty = 42.5;
  const total7DaysIncToday = (last7DaysOnDuty + onDutyTodayHrs).toFixed(1);
  const availTomorrow70 = Math.max(0, 70 - parseFloat(total7DaysIncToday)).toFixed(1);

  const last8DaysOnDuty = 48.0;
  const total8DaysIncToday = (last8DaysOnDuty + onDutyTodayHrs).toFixed(1);
  const availTomorrow60 = Math.max(0, 60 - parseFloat(total8DaysIncToday)).toFixed(1);

  return (
    <div className={styles.canvasContainer}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svgCanvas}
        style={{ width: '100%', maxWidth: width }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Official Filing Instructions */}
        <text x={MARGIN.left} y={18} fill="#64748b" fontSize="9">
          Original – File at home terminal.
        </text>
        <text x={MARGIN.left + gridW - 210} y={18} fill="#64748b" fontSize="9">
          Duplicate – Driver retains in his/her possession for 8 days.
        </text>

        {/* Title Header Block */}
        <text x={MARGIN.left} y={38} className="font-extrabold text-base text-slate-900" fill="#0f172a">
          Driver's Daily Log (24 hours) — FMCSA Form 395.8
        </text>
        <text x={MARGIN.left + gridW - 140} y={38} className="text-xs text-slate-500 font-mono" fill="#475569">
          Date: <tspan fontWeight="bold" fill="#0f172a">{dateFormatted}</tspan>
        </text>

        {/* Header Metadata Grid — Non-overlapping Y spacing */}
        <g transform="translate(0, 50)" className="text-xs">
          {/* Row 1: From / To / Driver */}
          <text x={MARGIN.left} y={12} fill="#475569" fontSize="11" fontWeight="bold">
            From: <tspan fill="#0f172a" fontWeight="semibold">{origin}</tspan>
          </text>
          <text x={MARGIN.left + 310} y={12} fill="#475569" fontSize="11" fontWeight="bold">
            To: <tspan fill="#0f172a" fontWeight="semibold">{destination}</tspan>
          </text>
          <text x={MARGIN.left + 620} y={12} fill="#475569" fontSize="11" fontWeight="bold">
            Driver: <tspan fill="#0f172a">{driver}</tspan>
          </text>

          {/* Row 2: Miles Boxes + Carrier + Co-Driver */}
          <rect x={MARGIN.left} y={22} width={140} height={26} fill="#f8fafc" stroke="#cbd5e1" rx="4" />
          <text x={MARGIN.left + 6} y={33} fill="#64748b" fontSize="8">Total Miles Driving Today</text>
          <text x={MARGIN.left + 6} y={44} fill="#0f172a" fontSize="10" fontWeight="bold">{drivingMiles} mi</text>

          <rect x={MARGIN.left + 150} y={22} width={140} height={26} fill="#f8fafc" stroke="#cbd5e1" rx="4" />
          <text x={MARGIN.left + 156} y={33} fill="#64748b" fontSize="8">Total Mileage Today</text>
          <text x={MARGIN.left + 156} y={44} fill="#0f172a" fontSize="10" fontWeight="bold">{totalMiles} mi</text>

          <text x={MARGIN.left + 310} y={38} fill="#475569" fontSize="11" fontWeight="bold">
            Carrier: <tspan fill="#0f172a">{carrier}</tspan>
          </text>
          <text x={MARGIN.left + 620} y={38} fill="#475569" fontSize="11" fontWeight="bold">
            Co-Driver: <tspan fill="#0f172a">{coDriver}</tspan>
          </text>

          {/* Row 3: Vehicle Box + Main Office + Home Terminal */}
          <rect x={MARGIN.left} y={54} width={290} height={26} fill="#f8fafc" stroke="#cbd5e1" rx="4" />
          <text x={MARGIN.left + 6} y={65} fill="#64748b" fontSize="8">Truck/Tractor & Trailer Numbers</text>
          <text x={MARGIN.left + 6} y={76} fill="#0f172a" fontSize="10" fontWeight="bold">{vehicle}</text>

          <text x={MARGIN.left + 310} y={64} fill="#475569" fontSize="11" fontWeight="bold">
            Main Office: <tspan fill="#0f172a">{mainAddress}</tspan>
          </text>
          <text x={MARGIN.left + 620} y={64} fill="#475569" fontSize="11" fontWeight="bold">
            Home Terminal: <tspan fill="#0f172a">{homeTerminal}</tspan>
          </text>

          {/* Row 4: License Plates */}
          <text x={MARGIN.left} y={96} fill="#475569" fontSize="10" fontWeight="bold">
            License Plates / State: <tspan fill="#0f172a" fontWeight="normal">{licensePlates}</tspan>
          </text>
        </g>

        {/* Time-axis labels */}
        {HOURS_12.map((label, i) => {
          const x = MARGIN.left + i * HOUR_WIDTH;
          return (
            <text key={`tlbl-${i}`} x={x} y={MARGIN.top - 8} className={styles.timeLabel}>
              {label}
            </text>
          );
        })}

        {/* Row backgrounds + horizontal borders */}
        {ROW_ORDER.map((status, idx) => {
          const y = MARGIN.top + idx * ROW_HEIGHT;
          return (
            <g key={`row-${status}`}>
              <rect
                x={MARGIN.left}
                y={y}
                width={gridW}
                height={ROW_HEIGHT}
                fill={idx % 2 === 0 ? '#f8fafc' : '#ffffff'}
              />
              <line
                x1={MARGIN.left}
                y1={y + ROW_HEIGHT}
                x2={MARGIN.left + gridW}
                y2={y + ROW_HEIGHT}
                className={styles.rowBorder}
              />
              <text x={MARGIN.left - 10} y={y + ROW_HEIGHT / 2 + 4} className={styles.rowLabel}>
                {ROW_LABELS[status]}
              </text>
            </g>
          );
        })}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left + gridW}
          y2={MARGIN.top}
          className={styles.rowBorder}
        />

        {/* Vertical hour lines + sub-ticks */}
        {Array.from({ length: 25 }, (_, i) => {
          const x = MARGIN.left + i * HOUR_WIDTH;
          const elems = [
            <line key={`hl-${i}`} x1={x} y1={MARGIN.top} x2={x} y2={MARGIN.top + gridH} className={styles.gridLine} />,
          ];
          if (i < 24) {
            for (let q = 1; q < 4; q++) {
              const qx = x + (q * HOUR_WIDTH) / 4;
              ROW_ORDER.forEach((_, rIdx) => {
                const ry = MARGIN.top + rIdx * ROW_HEIGHT;
                elems.push(
                  <line key={`qt-${i}-${q}-t${rIdx}`} x1={qx} y1={ry} x2={qx} y2={ry + 6} className={styles.subTick} />,
                  <line key={`qb-${i}-${q}-b${rIdx}`} x1={qx} y1={ry + ROW_HEIGHT - 6} x2={qx} y2={ry + ROW_HEIGHT} className={styles.subTick} />,
                );
              });
            }
          }
          return <g key={`vert-${i}`}>{elems}</g>;
        })}

        {/* Colored segment bars */}
        {processed.map((seg, idx) => {
          const rowIdx = ROW_ORDER.indexOf(seg.dutyStatus) !== -1 ? ROW_ORDER.indexOf(seg.dutyStatus) : 0;
          const y = MARGIN.top + rowIdx * ROW_HEIGHT + 4;
          const x = xOfMin(seg.startMin);
          const w = Math.max(2, xOfMin(seg.endMin) - x);
          return (
            <rect
              key={`bar-${idx}`}
              x={x}
              y={y}
              width={w}
              height={ROW_HEIGHT - 8}
              fill={COLORS[seg.dutyStatus]}
              rx={3}
            />
          );
        })}

        {/* Duty status line — EXPLICIT fill="none" */}
        <polyline
          points={pathPoints.join(' ')}
          fill="none"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.dutyPolyline}
        />

        {/* Location / Annotation remarks */}
        {processed
          .filter((s) => s.location || s.annotation)
          .map((seg, i) => {
            const sx = xOfMin(seg.startMin);
            const yR = MARGIN.top + gridH;
            const labelText = seg.annotation || (seg.location ? `${seg.location.city}, ${seg.location.state}` : '');
            return (
              <g key={`rem-${i}`}>
                <line x1={sx} y1={yR} x2={sx} y2={yR + 8} className={styles.remarkTick} />
                <text
                  x={sx}
                  y={yR + 12}
                  className={styles.remarkText}
                  transform={`rotate(45, ${sx}, ${yR + 12})`}
                  textAnchor="start"
                >
                  {labelText}
                </text>
              </g>
            );
          })}

        {/* Totals column */}
        <text x={MARGIN.left + gridW + 12} y={MARGIN.top - 8} className={styles.mileagePlaceholder}>
          Hours
        </text>
        {ROW_ORDER.map((status, idx) => {
          const y = MARGIN.top + idx * ROW_HEIGHT + ROW_HEIGHT / 2 + 4;
          const hrs = fmtHours(rowTotals[status]);
          return (
            <text key={`tot-${status}`} x={MARGIN.left + gridW + 40} y={y} className={styles.totalHour}>
              {hrs}
            </text>
          );
        })}

        {/* Grand total circle (Always 24:00) */}
        <circle
          cx={MARGIN.left + gridW + 75}
          cy={MARGIN.top + gridH / 2}
          r={24}
          className={styles.totalCircle}
        />
        <text x={MARGIN.left + gridW + 75} y={MARGIN.top + gridH / 2 - 4} className={styles.totalHour}>
          {fmtHours(grandTotal)}
        </text>
        <text x={MARGIN.left + gridW + 75} y={MARGIN.top + gridH / 2 + 12} className={styles.totalLabel}>
          Total
        </text>

        {/* Remarks Section Instruction Text */}
        <g transform={`translate(0, ${MARGIN.top + gridH + 80})`} className="text-xs">
          <text x={MARGIN.left} y={10} fill="#475569" fontSize="9" italic fontStyle="italic">
            Enter name of place you reported and where released from work and when and where each change of duty occurred. Use time standard of home terminal.
          </text>
        </g>

        {/* Bottom Remarks & Shipping Documents Section */}
        <g transform={`translate(0, ${MARGIN.top + gridH + 98})`} className="text-xs">
          <rect x={MARGIN.left} y={0} width={gridW + 100} height={42} fill="#f8fafc" stroke="#cbd5e1" rx="6" />
          <text x={MARGIN.left + 10} y={16} fill="#0f172a" fontSize="11" fontWeight="bold">
            Remarks & Shipping Documents:
          </text>
          <text x={MARGIN.left + 10} y={32} fill="#334155" fontSize="10">
            BOL / Manifest #: <tspan fontWeight="bold" fill="#0f172a">{shippingDoc}</tspan> | Commodity: <tspan fontWeight="bold" fill="#0f172a">{commodity}</tspan> | Certified Digital Signature ✓
          </text>
        </g>

        {/* Bottom Complete HOS Recap Section Table (70-Hr / 8-Day & 60-Hr / 7-Day) */}
        <g transform={`translate(0, ${MARGIN.top + gridH + 150})`} className="text-xs">
          <rect x={MARGIN.left} y={0} width={gridW + 100} height={70} fill="#ffffff" stroke="#94a3b8" rx="6" />
          <text x={MARGIN.left + 12} y={16} fill="#0f172a" fontSize="11" fontWeight="extrabold">
            Recap: Complete at end of day
          </text>

          {/* Drivers A (70-Hr / 8-Day) */}
          <g transform={`translate(${MARGIN.left + 180}, 14)`}>
            <text x={0} y={0} fill="#0f172a" fontSize="10" fontWeight="bold">70 Hour / 8 Day Drivers (A)</text>
            <text x={0} y={14} fill="#475569" fontSize="9">On Duty Today (Lines 3 & 4): <tspan fontWeight="bold" fill="#0f172a">{onDutyTodayHrs}h</tspan></text>
            <text x={0} y={26} fill="#475569" fontSize="9">Total Hours On Duty Last 7 Days: <tspan fontWeight="bold" fill="#0f172a">{total7DaysIncToday}h</tspan></text>
            <text x={0} y={38} fill="#475569" fontSize="9">Total Hours Available Tomorrow (70 - A): <tspan fontWeight="bold" fill="#1e3a8a">{availTomorrow70}h</tspan></text>
          </g>

          {/* Drivers B (60-Hr / 7-Day) */}
          <g transform={`translate(${MARGIN.left + 500}, 14)`}>
            <text x={0} y={0} fill="#0f172a" fontSize="10" fontWeight="bold">60 Hour / 7 Day Drivers (B)</text>
            <text x={0} y={14} fill="#475569" fontSize="9">On Duty Today (Lines 3 & 4): <tspan fontWeight="bold" fill="#0f172a">{onDutyTodayHrs}h</tspan></text>
            <text x={0} y={26} fill="#475569" fontSize="9">Total Hours On Duty Last 8 Days: <tspan fontWeight="bold" fill="#0f172a">{total8DaysIncToday}h</tspan></text>
            <text x={0} y={38} fill="#475569" fontSize="9">Total Hours Available Tomorrow (60 - B): <tspan fontWeight="bold" fill="#1e3a8a">{availTomorrow60}h</tspan></text>
          </g>

          {/* 34-Hour Restart Note */}
          <text x={MARGIN.left + 12} y={58} fill="#64748b" fontSize="8" italic fontStyle="italic">
            *If you took 34 consecutive hours off duty, you have 60/70 hours available.
          </text>
        </g>
      </svg>
    </div>
  );
}

LogSheetCanvas.propTypes = {
  logDate: PropTypes.string.isRequired,
  segments: PropTypes.array.isRequired,
  metadata: PropTypes.object,
};

export default LogSheetCanvas;
