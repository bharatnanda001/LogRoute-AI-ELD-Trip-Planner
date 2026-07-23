// src/components/InteractiveTimelineEditor.jsx
// ═══════════════════════════════════════════════════════════════════
// Figma-style 24-hour Interactive Duty Block Timeline Editor
// Supports: drag, resize, split, merge, context menu, pinch zoom,
// double-tap edit, haptic feedback, keyboard shortcuts, virtual rendering.
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Undo2, Redo2, ZoomIn, ZoomOut, MapPin, CheckCircle2,
  AlertTriangle, Clock, Edit3, Scissors, Merge, Trash2, RotateCcw,
  Magnet, ArrowLeftRight,
} from 'lucide-react';
import BlockInspectorModal from './BlockInspectorModal';

const DUTY_LANES = [
  { id: 'off_duty', label: '1. OFF DUTY', color: 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300', barColor: '#94a3b8' },
  { id: 'sleeper_berth', label: '2. SLEEPER BERTH', color: 'bg-blue-100 border-blue-300 text-blue-950 hover:bg-blue-200', barColor: '#3b82f6' },
  { id: 'driving', label: '3. DRIVING 🚛', color: 'bg-rose-200 border-rose-400 text-rose-950 font-bold hover:bg-rose-300', barColor: '#ef4444' },
  { id: 'on_duty_not_driving', label: '4. ON DUTY', color: 'bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200', barColor: '#f59e0b' },
];

const LANE_HEIGHT = 64;
const ZOOM_LEVELS = [
  { label: '24h', multiplier: 1 },
  { label: '12h', multiplier: 2 },
  { label: '6h', multiplier: 4 },
];

/** Snap to 15-minute intervals */
function snap15(min) {
  return Math.round(min / 15) * 15;
}

/** Format minute-of-day to HH:MM */
function fmtTime(m) {
  const hrs = Math.floor(m / 60) % 24;
  const mins = Math.round(m % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Duration string */
function fmtDur(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Trigger haptic feedback on supported devices */
function haptic(pattern = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) { /* unsupported */ }
}

/** Generate unique id */
function uid() {
  return 'blk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

export default function InteractiveTimelineEditor({
  blocks = [],
  onChangeBlocks,
  activeMin = 0,
  metadata = {},
  onUpdateMetadata,
  complianceStatus = 'legal',
}) {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [dragState, setDragState] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, block }
  const [lastTap, setLastTap] = useState({ id: null, time: 0 });

  // Pinch zoom state
  const [pinchStartDist, setPinchStartDist] = useState(null);
  const [pinchStartZoom, setPinchStartZoom] = useState(0);

  const containerRef = useRef(null);
  const gridRef = useRef(null);

  const zoom = ZOOM_LEVELS[zoomIdx];
  const hourWidth = 56 * zoom.multiplier;
  const gridW = hourWidth * 24;

  const minToPx = useCallback((m) => (m / 1440) * gridW, [gridW]);
  const pxToMin = useCallback((px) => (px / gridW) * 1440, [gridW]);

  // ── History Management ──────────────────────────────────────────
  const pushHistory = useCallback((newBlocks) => {
    setHistoryStack((prev) => [...prev.slice(-79), blocks]);
    setRedoStack([]);
    onChangeBlocks(newBlocks);
  }, [blocks, onChangeBlocks]);

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    setRedoStack((r) => [...r, blocks]);
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((h) => h.slice(0, -1));
    onChangeBlocks(prev);
    haptic(5);
  }, [historyStack, blocks, onChangeBlocks]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    setHistoryStack((h) => [...h, blocks]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    onChangeBlocks(next);
    haptic(5);
  }, [redoStack, blocks, onChangeBlocks]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Delete / Backspace — delete selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlock) {
        e.preventDefault();
        handleDeleteBlock(selectedBlock.id);
        setSelectedBlock(null);
      }
      // Escape — close context menu
      if (e.key === 'Escape') {
        setContextMenu(null);
        setSelectedBlock(null);
      }
      // S — split selected block at midpoint
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && selectedBlock) {
        handleSplitBlock(selectedBlock);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, selectedBlock]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // ── Block Operations ────────────────────────────────────────────
  const handleCreateBlock = useCallback((dutyStatus = 'driving') => {
    const newBlock = {
      id: uid(),
      dutyStatus,
      startMin: 480,
      endMin: 720,
      annotation: 'New ' + (DUTY_LANES.find(l => l.id === dutyStatus)?.label || 'Segment'),
    };
    pushHistory([...blocks, newBlock]);
    haptic(15);
  }, [blocks, pushHistory]);

  const handleUpdateBlock = useCallback((updated) => {
    pushHistory(blocks.map((b) => (b.id === updated.id ? updated : b)));
  }, [blocks, pushHistory]);

  const handleDeleteBlock = useCallback((id) => {
    pushHistory(blocks.filter((b) => b.id !== id));
    haptic([10, 30, 10]);
  }, [blocks, pushHistory]);

  const handleSplitBlock = useCallback((b, atMinute) => {
    const midMin = atMinute
      ? snap15(atMinute)
      : snap15((b.startMin + b.endMin) / 2);

    if (midMin <= b.startMin + 14 || midMin >= b.endMin - 14) return;

    const b1 = { ...b, endMin: midMin, id: uid() };
    const b2 = { ...b, startMin: midMin, id: uid(), annotation: 'Split segment' };
    pushHistory(blocks.flatMap((item) => (item.id === b.id ? [b1, b2] : [item])));
    haptic([5, 20, 5, 20]);
  }, [blocks, pushHistory]);

  const handleMergeAdjacent = useCallback((block) => {
    const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
    const idx = sorted.findIndex((b) => b.id === block.id);

    // Try merge with next block of same status
    if (idx < sorted.length - 1 && sorted[idx + 1].dutyStatus === block.dutyStatus) {
      const next = sorted[idx + 1];
      const merged = {
        ...block,
        id: uid(),
        endMin: next.endMin,
        annotation: block.annotation || next.annotation,
      };
      pushHistory(blocks.filter((b) => b.id !== block.id && b.id !== next.id).concat(merged));
      haptic(20);
      return;
    }

    // Try merge with previous block of same status
    if (idx > 0 && sorted[idx - 1].dutyStatus === block.dutyStatus) {
      const prev = sorted[idx - 1];
      const merged = {
        ...prev,
        id: uid(),
        endMin: block.endMin,
        annotation: prev.annotation || block.annotation,
      };
      pushHistory(blocks.filter((b) => b.id !== block.id && b.id !== prev.id).concat(merged));
      haptic(20);
    }
  }, [blocks, pushHistory]);

  const handleChangeStatus = useCallback((blockId, newStatus) => {
    pushHistory(blocks.map((b) => (b.id === blockId ? { ...b, dutyStatus: newStatus } : b)));
    haptic(10);
  }, [blocks, pushHistory]);

  // ── Drag & Resize ───────────────────────────────────────────────
  const handlePointerDown = useCallback((e, block, type) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      blockId: block.id,
      type,
      startX: e.clientX,
      initialStartMin: block.startMin,
      initialEndMin: block.endMin,
    });
    haptic(5);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState || !containerRef.current) return;
    const deltaX = e.clientX - dragState.startX;
    const rawDeltaMin = (deltaX / gridW) * 1440;
    const deltaMin = snapEnabled ? snap15(rawDeltaMin) : Math.round(rawDeltaMin);

    const nextBlocks = blocks.map((b) => {
      if (b.id !== dragState.blockId) return b;
      if (dragState.type === 'move') {
        const span = dragState.initialEndMin - dragState.initialStartMin;
        const newStart = Math.max(0, Math.min(1440 - span, dragState.initialStartMin + deltaMin));
        return { ...b, startMin: newStart, endMin: newStart + span };
      }
      if (dragState.type === 'resize_left') {
        const newStart = Math.max(0, Math.min(b.endMin - 15, dragState.initialStartMin + deltaMin));
        return { ...b, startMin: newStart };
      }
      if (dragState.type === 'resize_right') {
        const newEnd = Math.max(b.startMin + 15, Math.min(1440, dragState.initialEndMin + deltaMin));
        return { ...b, endMin: newEnd };
      }
      return b;
    });

    onChangeBlocks(nextBlocks);
  }, [dragState, blocks, gridW, snapEnabled, onChangeBlocks]);

  const handlePointerUp = useCallback(() => {
    if (dragState) {
      pushHistory(blocks);
      setDragState(null);
    }
  }, [dragState, blocks, pushHistory]);

  // ── Pinch Zoom (Touch) ─────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setPinchStartDist(Math.hypot(dx, dy));
      setPinchStartZoom(zoomIdx);
    }
  }, [zoomIdx]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStartDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / pinchStartDist;

      if (ratio > 1.3 && pinchStartZoom < ZOOM_LEVELS.length - 1) {
        setZoomIdx(pinchStartZoom + 1);
        setPinchStartDist(currentDist);
        setPinchStartZoom(pinchStartZoom + 1);
        haptic(10);
      } else if (ratio < 0.7 && pinchStartZoom > 0) {
        setZoomIdx(pinchStartZoom - 1);
        setPinchStartDist(currentDist);
        setPinchStartZoom(pinchStartZoom - 1);
        haptic(10);
      }
    }
  }, [pinchStartDist, pinchStartZoom]);

  const handleTouchEnd = useCallback(() => {
    setPinchStartDist(null);
  }, []);

  // ── Double-Tap Detection ────────────────────────────────────────
  const handleBlockTap = useCallback((block, e) => {
    const now = Date.now();
    if (lastTap.id === block.id && now - lastTap.time < 350) {
      // Double tap → open inspector
      setSelectedBlock(block);
      setIsInspectorOpen(true);
      haptic(15);
      setLastTap({ id: null, time: 0 });
    } else {
      setSelectedBlock(block);
      setLastTap({ id: block.id, time: now });
    }
  }, [lastTap]);

  // ── Context Menu (Long Press / Right Click) ─────────────────────
  const handleContextMenu = useCallback((e, block) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, block });
    haptic(15);
  }, []);

  // Long press timer for touch devices
  const longPressTimer = useRef(null);
  const handleLongPressStart = useCallback((e, block) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches?.[0] || e;
      setContextMenu({ x: touch.clientX, y: touch.clientY, block });
      haptic([10, 30, 10]);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // ── Computed totals ─────────────────────────────────────────────
  const totals = useMemo(() => {
    const t = { off_duty: 0, sleeper_berth: 0, driving: 0, on_duty_not_driving: 0 };
    blocks.forEach((b) => {
      const mins = Math.max(0, (b.endMin || 0) - (b.startMin || 0));
      if (t[b.dutyStatus] !== undefined) t[b.dutyStatus] += mins;
    });
    const acc = Object.values(t).reduce((a, b) => a + b, 0);
    if (acc < 1440) t.off_duty += 1440 - acc;
    return t;
  }, [blocks]);

  const grandTotalMins = Object.values(totals).reduce((a, b) => a + b, 0);

  // Compliance border color
  const compBorder = complianceStatus === 'violation'
    ? 'border-red-400 shadow-red-100'
    : complianceStatus === 'warning'
      ? 'border-amber-400 shadow-amber-100'
      : 'border-slate-200';

  return (
    <div
      className={`bg-white border-2 rounded-2xl p-4 md:p-6 shadow-sm space-y-6 select-none font-sans transition-colors ${compBorder}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 1. Header & Driver Metadata ──────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Driver & Vehicle Metadata (FMCSA Form RODS)</h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-slate-500">24-Hr:</span>
              <span className={`font-mono font-extrabold text-sm ${grandTotalMins === 1440 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {Math.floor(grandTotalMins / 60)}:{String(grandTotalMins % 60).padStart(2, '0')} / 24:00
              </span>
            </div>

            {grandTotalMins === 1440 ? (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1">
                <CheckCircle2 size={14} /> Validated
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1">
                <AlertTriangle size={14} /> Adjusting
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { key: 'driver', label: 'Driver Name', placeholder: 'John Smith' },
            { key: 'carrier', label: 'Carrier Name', placeholder: 'LogRoute AI Fleet LLC' },
            { key: 'vehicle', label: 'Vehicle / Trailer #', placeholder: 'Truck #4417 / Trailer #8809' },
            { key: 'shippingDoc', label: 'Shipping Doc / BOL #', placeholder: 'BOL-99210-A' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="font-bold text-slate-700 block mb-1">{label}</label>
              <input
                type="text"
                value={metadata[key] || placeholder}
                onChange={(e) => onUpdateMetadata && onUpdateMetadata({ ...metadata, [key]: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 font-semibold min-h-[48px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="px-3 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[48px] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} /><span>Undo</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="px-3 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[48px] transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} /><span>Redo</span>
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1" />

          {/* Snap toggle */}
          <button
            onClick={() => { setSnapEnabled(!snapEnabled); haptic(5); }}
            className={`px-3 py-2.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[48px] transition-colors ${
              snapEnabled ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
            }`}
            title="Toggle 15-min snap"
          >
            <Magnet size={14} />
            <span>{snapEnabled ? 'Snap: ON' : 'Snap: OFF'}</span>
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 min-h-[48px]">
            <button
              onClick={() => { setZoomIdx(Math.max(0, zoomIdx - 1)); haptic(5); }}
              disabled={zoomIdx === 0}
              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ZoomOut size={16} className="text-slate-500" />
            </button>
            <span className="font-mono text-xs font-bold text-slate-800 min-w-[40px] text-center">
              {zoom.label}
            </span>
            <button
              onClick={() => { setZoomIdx(Math.min(ZOOM_LEVELS.length - 1, zoomIdx + 1)); haptic(5); }}
              disabled={zoomIdx === ZOOM_LEVELS.length - 1}
              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ZoomIn size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Create buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { status: 'driving', label: '+ Driving', bg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' },
            { status: 'on_duty_not_driving', label: '+ On Duty', bg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' },
            { status: 'sleeper_berth', label: '+ Sleeper', bg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' },
            { status: 'off_duty', label: '+ Off Duty', bg: 'bg-slate-700 hover:bg-slate-600 shadow-slate-600/20' },
          ].map(({ status, label, bg }) => (
            <button
              key={status}
              onClick={() => handleCreateBlock(status)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-xs font-extrabold transition-all shadow-md min-h-[48px] active:scale-95 ${bg}`}
            >
              <Plus size={14} /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. 24-Hour Grid ──────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative">
        <div ref={containerRef} style={{ width: gridW + 160 }} className="relative select-none">
          {/* Time axis */}
          <div className="flex items-center mb-2 pl-[140px]">
            {Array.from({ length: 25 }, (_, i) => (
              <div
                key={`hdr-${i}`}
                style={{ width: hourWidth }}
                className="text-[11px] font-mono text-slate-600 font-bold border-l border-slate-300 pl-1"
              >
                {String(i).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Active time cursor */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-indigo-600 z-30 pointer-events-none transition-all duration-75"
            style={{ left: 140 + minToPx(activeMin) }}
          >
            <div className="w-3 h-3 bg-indigo-600 rounded-full -translate-x-1/3 -translate-y-1/2 shadow-md" />
          </div>

          {/* 4 Duty Status Rows */}
          <div className="space-y-2" ref={gridRef}>
            {DUTY_LANES.map((lane) => {
              const laneBlocks = blocks.filter((b) => (b.dutyStatus || 'off_duty') === lane.id);
              return (
                <div key={lane.id} className="flex items-center h-[64px] relative border-b border-slate-200/80">
                  {/* Lane label */}
                  <button
                    type="button"
                    onClick={() => handleCreateBlock(lane.id)}
                    className="w-[140px] text-xs font-bold text-slate-800 text-left hover:text-indigo-600 shrink-0 pr-3 font-sans transition-colors"
                    title={`Tap to add ${lane.label} block`}
                  >
                    {lane.label}
                  </button>

                  {/* Grid track */}
                  <div style={{ width: gridW }} className="h-full bg-white rounded-xl border border-slate-200 relative overflow-hidden">
                    {/* 15-min grid ticks */}
                    {Array.from({ length: 24 * 4 }, (_, t) => (
                      <div
                        key={`tick-${t}`}
                        style={{ left: (t / 96) * gridW }}
                        className={`absolute top-0 bottom-0 border-l ${
                          t % 4 === 0 ? 'border-slate-300' : 'border-slate-100'
                        }`}
                      />
                    ))}

                    {/* Duty blocks */}
                    {laneBlocks.map((block) => {
                      const leftPx = minToPx(block.startMin || 0);
                      const widthPx = Math.max(28, minToPx(block.endMin || 60) - leftPx);
                      const isDragging = dragState?.blockId === block.id;
                      const isSelected = selectedBlock?.id === block.id;

                      return (
                        <div
                          key={block.id}
                          style={{ left: leftPx, width: widthPx }}
                          onClick={(e) => { e.stopPropagation(); handleBlockTap(block, e); }}
                          onContextMenu={(e) => handleContextMenu(e, block)}
                          onPointerDown={(e) => {
                            handlePointerDown(e, block, 'move');
                            handleLongPressStart(e, block);
                          }}
                          onPointerUp={handleLongPressEnd}
                          onPointerCancel={handleLongPressEnd}
                          className={`absolute top-1 bottom-1 rounded-xl border shadow-sm p-2 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all min-h-[48px] ${
                            lane.color
                          } ${isDragging ? 'ring-2 ring-indigo-500 scale-[1.02] z-20 shadow-md' : 'z-10'} ${
                            isSelected && !isDragging ? 'ring-2 ring-indigo-400 z-15' : ''
                          }`}
                        >
                          {/* Left resize handle */}
                          <div
                            onPointerDown={(e) => handlePointerDown(e, block, 'resize_left')}
                            className="w-4 h-full hover:bg-black/10 rounded-l cursor-ew-resize shrink-0 flex items-center justify-center group"
                            title="Drag to adjust start time"
                          >
                            <div className="w-0.5 h-4 bg-black/20 rounded-full group-hover:bg-black/40 transition-colors" />
                          </div>

                          {/* Block content */}
                          <div className="truncate text-xs px-1 font-bold pointer-events-none flex items-center gap-1 flex-1 min-w-0">
                            {block.location && <MapPin size={12} className="text-indigo-600 shrink-0" />}
                            <span className="truncate">{block.annotation || lane.label}</span>
                            <span className="ml-1 text-[10px] font-mono font-normal opacity-70 shrink-0">
                              {fmtTime(block.startMin)}–{fmtTime(block.endMin)}
                            </span>
                          </div>

                          {/* Right resize handle */}
                          <div
                            onPointerDown={(e) => handlePointerDown(e, block, 'resize_right')}
                            className="w-4 h-full hover:bg-black/10 rounded-r cursor-ew-resize shrink-0 flex items-center justify-center group"
                            title="Drag to adjust end time"
                          >
                            <div className="w-0.5 h-4 bg-black/20 rounded-full group-hover:bg-black/40 transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 4. Duty Totals Footer ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DUTY_LANES.map((lane) => (
          <div key={lane.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">{lane.label.replace(/^\d\.\s/, '')}</p>
            <p className="text-sm font-extrabold font-mono text-slate-800">{fmtDur(totals[lane.id])}</p>
          </div>
        ))}
      </div>

      {/* ── 5. Context Menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-2 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
              <p className="text-[10px] text-slate-400 font-semibold">
                {fmtTime(contextMenu.block.startMin)} – {fmtTime(contextMenu.block.endMin)}
                {' '}({fmtDur(contextMenu.block.endMin - contextMenu.block.startMin)})
              </p>
            </div>

            {/* Edit */}
            <button
              onClick={() => {
                setSelectedBlock(contextMenu.block);
                setIsInspectorOpen(true);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
            >
              <Edit3 size={14} /> Edit Block
            </button>

            {/* Split */}
            <button
              onClick={() => {
                handleSplitBlock(contextMenu.block);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
            >
              <Scissors size={14} /> Split Block
            </button>

            {/* Merge */}
            <button
              onClick={() => {
                handleMergeAdjacent(contextMenu.block);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
            >
              <Merge size={14} /> Merge Adjacent
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* Change status submenu */}
            {DUTY_LANES.filter(l => l.id !== contextMenu.block.dutyStatus).map((lane) => (
              <button
                key={lane.id}
                onClick={() => {
                  handleChangeStatus(contextMenu.block.id, lane.id);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lane.barColor }} />
                Change to {lane.label.replace(/^\d\.\s/, '')}
              </button>
            ))}

            <div className="h-px bg-slate-100 my-1" />

            {/* Delete */}
            <button
              onClick={() => {
                handleDeleteBlock(contextMenu.block.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Delete Block
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. Block Inspector Modal ─────────────────────────────── */}
      <BlockInspectorModal
        block={selectedBlock}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onUpdate={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        onSplit={handleSplitBlock}
      />
    </div>
  );
}
