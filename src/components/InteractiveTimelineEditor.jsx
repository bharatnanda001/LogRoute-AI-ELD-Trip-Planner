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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, selectedBlock]);

  // Close context menu on outside click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // ── Block Mutations ─────────────────────────────────────────────
  const handleUpdateBlock = useCallback((updated) => {
    const nextBlocks = blocks.map((b) => (b.id === updated.id ? updated : b));
    pushHistory(nextBlocks);
    setSelectedBlock(updated);
  }, [blocks, pushHistory]);

  const handleDeleteBlock = useCallback((blockId) => {
    const nextBlocks = blocks.filter((b) => b.id !== blockId);
    pushHistory(nextBlocks);
    haptic([10, 30, 10]);
  }, [blocks, pushHistory]);

  const handleCreateBlock = useCallback((dutyStatus = 'driving') => {
    const newBlock = {
      id: uid(),
      dutyStatus,
      startMin: activeMin > 0 ? activeMin : 480,
      endMin: Math.min(1440, (activeMin > 0 ? activeMin : 480) + 60),
      annotation: `New ${dutyStatus.replace('_', ' ')} block`,
      location: null,
    };
    pushHistory([...blocks, newBlock]);
    setSelectedBlock(newBlock);
    setIsInspectorOpen(true);
    haptic(15);
  }, [activeMin, blocks, pushHistory]);

  const handleSplitBlock = useCallback((block, splitMin) => {
    const minToUse = splitMin ?? Math.round((block.startMin + block.endMin) / 2);
    if (minToUse <= block.startMin || minToUse >= block.endMin) return;

    const b1 = { ...block, id: uid(), endMin: minToUse };
    const b2 = { ...block, id: uid(), startMin: minToUse, annotation: `${block.annotation || 'Segment'} (Pt 2)` };

    const nextBlocks = blocks.flatMap((b) => (b.id === block.id ? [b1, b2] : [b]));
    pushHistory(nextBlocks);
    haptic([10, 20]);
  }, [blocks, pushHistory]);

  const handleMergeAdjacent = useCallback((block) => {
    const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
    const idx = sorted.findIndex((b) => b.id === block.id);
    if (idx === -1) return;

    const nextBlock = sorted[idx + 1];
    if (nextBlock && nextBlock.dutyStatus === block.dutyStatus) {
      const merged = { ...block, endMin: nextBlock.endMin };
      const nextBlocks = blocks.filter((b) => b.id !== nextBlock.id).map((b) => (b.id === block.id ? merged : b));
      pushHistory(nextBlocks);
      haptic(15);
    }
  }, [blocks, pushHistory]);

  // ── Drag & Resize Pointer Handlers ──────────────────────────────
  const handlePointerDown = (e, block, mode = 'move') => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDragState({
      blockId: block.id,
      mode, // 'move' | 'resize_left' | 'resize_right'
      startX: e.clientX,
      initialStartMin: block.startMin,
      initialEndMin: block.endMin,
      pointerId: e.pointerId,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    const deltaPx = e.clientX - dragState.startX;
    const deltaMin = pxToMin(deltaPx);

    const block = blocks.find((b) => b.id === dragState.blockId);
    if (!block) return;

    let newStart = dragState.initialStartMin;
    let newEnd = dragState.initialEndMin;
    const duration = dragState.initialEndMin - dragState.initialStartMin;

    if (dragState.mode === 'move') {
      newStart = Math.max(0, Math.min(1440 - duration, dragState.initialStartMin + deltaMin));
      newEnd = newStart + duration;
    } else if (dragState.mode === 'resize_left') {
      newStart = Math.max(0, Math.min(dragState.initialEndMin - 15, dragState.initialStartMin + deltaMin));
    } else if (dragState.mode === 'resize_right') {
      newEnd = Math.max(dragState.initialStartMin + 15, Math.min(1440, dragState.initialEndMin + deltaMin));
    }

    if (snapEnabled) {
      newStart = snap15(newStart);
      newEnd = snap15(newEnd);
    }

    const updated = { ...block, startMin: newStart, endMin: newEnd };
    const nextBlocks = blocks.map((b) => (b.id === block.id ? updated : b));
    onChangeBlocks(nextBlocks);
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;
    try {
      e.target.releasePointerCapture(dragState.pointerId);
    } catch (_) { /* ignore */ }
    setDragState(null);
    haptic(8);
  };

  // ── Context Menu & Double-Tap ────────────────────────────────────
  const handleContextMenu = (e, block) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, block });
    setSelectedBlock(block);
    haptic(20);
  };

  const handleBlockTap = (block, e) => {
    const now = Date.now();
    if (lastTap.id === block.id && now - lastTap.time < 300) {
      // Double tap -> Open Inspector
      setSelectedBlock(block);
      setIsInspectorOpen(true);
      haptic([10, 20]);
    } else {
      setSelectedBlock(block);
    }
    setLastTap({ id: block.id, time: now });
  };

  // Touch Long-Press for mobile context menu
  const longPressTimer = useRef(null);
  const handleLongPressStart = (e, block) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY, block });
      haptic([30, 50]);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Pinch Zoom gesture handling for mobile touchscreens
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStartDist(dist);
      setPinchStartZoom(zoomIdx);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDist;
      if (ratio > 1.25 && pinchStartZoom < ZOOM_LEVELS.length - 1) {
        setZoomIdx(pinchStartZoom + 1);
        setPinchStartDist(dist);
        haptic(10);
      } else if (ratio < 0.75 && pinchStartZoom > 0) {
        setZoomIdx(pinchStartZoom - 1);
        setPinchStartDist(dist);
        haptic(10);
      }
    }
  };

  const handleTouchEnd = () => {
    setPinchStartDist(null);
  };

  // ── Totals Calculation per Duty Lane ─────────────────────────────
  const totals = useMemo(() => {
    const res = { off_duty: 0, sleeper_berth: 0, driving: 0, on_duty_not_driving: 0 };
    for (const b of blocks) {
      const dur = Math.max(0, (b.endMin || 0) - (b.startMin || 0));
      const st = b.dutyStatus || 'off_duty';
      if (res[st] !== undefined) res[st] += dur;
    }
    return res;
  }, [blocks]);

  return (
    <div
      className="space-y-4 font-sans select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 1. Metadata Quick Editor Bar ─────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Driver & Carrier Metadata (FMCSA §395.8)
          </span>
          <span className="text-[10px] font-bold text-slate-500 font-mono">
            {metadata.date || '2026-07-23'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Driver', key: 'driver', placeholder: 'John Smith' },
            { label: 'Carrier', key: 'carrier', placeholder: 'ABC Logistics LLC' },
            { label: 'Vehicle #', key: 'vehicle', placeholder: 'Tractor #T-108' },
            { label: 'Shipping Doc #', key: 'shippingDoc', placeholder: 'BOL #88410' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="font-bold text-slate-700 block mb-1">{label}</label>
              <input
                type="text"
                value={metadata[key] || placeholder}
                onChange={(e) => onUpdateMetadata && onUpdateMetadata({ ...metadata, [key]: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 font-semibold min-h-12"
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
            className="px-3 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-12 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} /><span>Undo</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="px-3 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-12 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} /><span>Redo</span>
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1" />

          {/* Snap toggle */}
          <button
            onClick={() => { setSnapEnabled(!snapEnabled); haptic(5); }}
            className={`px-3 py-2.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-12 transition-colors ${
              snapEnabled ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
            }`}
            title="Toggle 15-min snap"
          >
            <Magnet size={14} />
            <span>{snapEnabled ? 'Snap: ON' : 'Snap: OFF'}</span>
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 min-h-12">
            <button
              onClick={() => { setZoomIdx(Math.max(0, zoomIdx - 1)); haptic(5); }}
              disabled={zoomIdx === 0}
              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ZoomOut size={16} className="text-slate-500" />
            </button>
            <span className="font-mono text-xs font-bold text-slate-800 min-w-10 text-center">
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
              className={`flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-xs font-extrabold transition-all shadow-md min-h-12 active:scale-95 ${bg}`}
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
          <div className="flex items-center mb-2 pl-35">
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
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 z-30 pointer-events-none transition-all duration-75"
            style={{ left: 140 + minToPx(activeMin) }}
          >
            <div className="w-3 h-3 bg-indigo-600 rounded-full -translate-x-1/3 -translate-y-1/2 shadow-md" />
          </div>

          {/* 4 Duty Status Rows */}
          <div className="space-y-2" ref={gridRef}>
            {DUTY_LANES.map((lane) => {
              const laneBlocks = blocks.filter((b) => (b.dutyStatus || 'off_duty') === lane.id);
              return (
                <div key={lane.id} className="flex items-center h-16 relative border-b border-slate-200/80">
                  {/* Lane label */}
                  <button
                    type="button"
                    onClick={() => handleCreateBlock(lane.id)}
                    className="w-35 text-xs font-bold text-slate-800 text-left hover:text-indigo-600 shrink-0 pr-3 font-sans transition-colors"
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
                          className={`absolute top-1 bottom-1 rounded-xl border shadow-sm p-2 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all min-h-12 ${
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
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-2 min-w-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
              <p className="text-[10px] text-slate-400 font-semibold">
                {fmtTime(contextMenu.block.startMin)} – {fmtTime(contextMenu.block.endMin)}
                {' '}({fmtDur(contextMenu.block.endMin - contextMenu.block.startMin)})
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedBlock(contextMenu.block);
                setIsInspectorOpen(true);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Edit3 size={14} className="text-indigo-600" />
              <span>Inspect & Edit Details</span>
            </button>

            <button
              onClick={() => {
                handleSplitBlock(contextMenu.block);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Scissors size={14} className="text-amber-600" />
              <span>Split Segment in Half</span>
            </button>

            <button
              onClick={() => {
                handleMergeAdjacent(contextMenu.block);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Merge size={14} className="text-blue-600" />
              <span>Merge with Next Block</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                handleDeleteBlock(contextMenu.block.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
            >
              <Trash2 size={14} />
              <span>Delete Segment</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. Block Inspector Modal ─────────────────────────────── */}
      <BlockInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        block={selectedBlock}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
      />
    </div>
  );
}
