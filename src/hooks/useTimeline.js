// src/hooks/useTimeline.js
// ═══════════════════════════════════════════════════════════════════
// Central timeline state hook — single source of truth for all
// duty-status blocks, undo/redo, selection, zoom, and block ops.
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useMemo } from 'react';

const MAX_UNDO_STACK = 80;

/**
 * Snap a minute value to the nearest 15-min interval.
 * Returns the raw value if snapping is disabled.
 */
export function snapTo15(min, snapEnabled = true) {
  if (!snapEnabled) return min;
  return Math.round(min / 15) * 15;
}

/** Generate a unique block id */
function uid() {
  return 'blk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/** Deep-clone a blocks array (shallow inner objects are fine because we replace, never mutate) */
function cloneBlocks(blocks) {
  return blocks.map((b) => ({ ...b, location: b.location ? { ...b.location } : null }));
}

/**
 * useTimeline — manages the Figma-style interactive timeline state.
 *
 * @param {Object[]} initialBlocks — seed blocks array
 * @returns timeline state + operations
 */
export default function useTimeline(initialBlocks = []) {
  // ── Core state ──────────────────────────────────────────────────
  const [blocks, setBlocks] = useState(() => cloneBlocks(initialBlocks));
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState('24h'); // '24h' | '12h' | '6h' | '1h'
  const [snapEnabled, setSnapEnabled] = useState(true);

  // ── Undo / Redo stacks ──────────────────────────────────────────
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  /** Push current state to undo stack before a mutation */
  const pushUndo = useCallback(() => {
    undoStack.current.push(cloneBlocks(blocks));
    if (undoStack.current.length > MAX_UNDO_STACK) {
      undoStack.current.shift();
    }
    redoStack.current = []; // any new mutation clears redo
  }, [blocks]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push(cloneBlocks(blocks));
    setBlocks(undoStack.current.pop());
  }, [blocks]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push(cloneBlocks(blocks));
    setBlocks(redoStack.current.pop());
  }, [blocks]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  // ── Sorted blocks (always render in time order) ─────────────────
  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.startMin - b.startMin),
    [blocks],
  );

  // ── Block CRUD ──────────────────────────────────────────────────

  /** Replace all blocks (used when a trip generates new segments) */
  const replaceAll = useCallback(
    (newBlocks) => {
      pushUndo();
      setBlocks(cloneBlocks(newBlocks));
    },
    [pushUndo],
  );

  /** Add a single new block */
  const addBlock = useCallback(
    (block) => {
      pushUndo();
      setBlocks((prev) => [...prev, { ...block, id: block.id || uid() }]);
    },
    [pushUndo],
  );

  /** Delete a block by id */
  const deleteBlock = useCallback(
    (blockId) => {
      pushUndo();
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      if (selectedBlockId === blockId) setSelectedBlockId(null);
    },
    [pushUndo, selectedBlockId],
  );

  /** Update one or more fields on a block */
  const updateBlock = useCallback(
    (blockId, updates) => {
      pushUndo();
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
      );
    },
    [pushUndo],
  );

  // ── Block operations ────────────────────────────────────────────

  /**
   * Move a block to a new startMin (keeping duration constant).
   * Clamps to 0–1440.
   */
  const moveBlock = useCallback(
    (blockId, newStartMin) => {
      pushUndo();
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== blockId) return b;
          const duration = b.endMin - b.startMin;
          let start = snapTo15(newStartMin, snapEnabled);
          start = Math.max(0, Math.min(1440 - duration, start));
          return { ...b, startMin: start, endMin: start + duration };
        }),
      );
    },
    [pushUndo, snapEnabled],
  );

  /**
   * Resize a block by dragging its left or right edge.
   * @param {'left'|'right'} edge
   * @param {number} newMin — the new minute position of that edge
   */
  const resizeBlock = useCallback(
    (blockId, edge, newMin) => {
      pushUndo();
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== blockId) return b;
          const snapped = snapTo15(newMin, snapEnabled);
          if (edge === 'left') {
            const start = Math.max(0, Math.min(b.endMin - 15, snapped));
            return { ...b, startMin: start };
          } else {
            const end = Math.min(1440, Math.max(b.startMin + 15, snapped));
            return { ...b, endMin: end };
          }
        }),
      );
    },
    [pushUndo, snapEnabled],
  );

  /**
   * Split a block into two at a given minute.
   * The left portion keeps the original annotation; the right gets "Split".
   */
  const splitBlock = useCallback(
    (blockId, atMinute) => {
      pushUndo();
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const block = prev[idx];
        const splitAt = snapTo15(atMinute, snapEnabled);

        if (splitAt <= block.startMin + 14 || splitAt >= block.endMin - 14) {
          return prev; // too close to edge, ignore
        }

        const left = {
          ...block,
          id: uid(),
          endMin: splitAt,
          annotation: block.annotation || '',
        };
        const right = {
          ...block,
          id: uid(),
          startMin: splitAt,
          annotation: 'Split from ' + (block.annotation || block.dutyStatus),
        };
        const next = [...prev];
        next.splice(idx, 1, left, right);
        return next;
      });
    },
    [pushUndo, snapEnabled],
  );

  /**
   * Merge two adjacent blocks with the same duty status.
   * The result keeps the first block's annotation.
   */
  const mergeBlocks = useCallback(
    (blockIdA, blockIdB) => {
      pushUndo();
      setBlocks((prev) => {
        const a = prev.find((b) => b.id === blockIdA);
        const b = prev.find((bl) => bl.id === blockIdB);
        if (!a || !b) return prev;
        if (a.dutyStatus !== b.dutyStatus) return prev;

        const merged = {
          ...a,
          id: uid(),
          startMin: Math.min(a.startMin, b.startMin),
          endMin: Math.max(a.endMin, b.endMin),
        };
        return prev
          .filter((bl) => bl.id !== blockIdA && bl.id !== blockIdB)
          .concat(merged);
      });
    },
    [pushUndo],
  );

  /**
   * Change the duty status of a block.
   */
  const changeBlockStatus = useCallback(
    (blockId, newStatus) => {
      pushUndo();
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, dutyStatus: newStatus } : b)),
      );
    },
    [pushUndo],
  );

  // ── Computed HOS totals (minutes) ───────────────────────────────
  const hosTotals = useMemo(() => {
    const totals = { off_duty: 0, sleeper_berth: 0, driving: 0, on_duty_not_driving: 0 };
    for (const b of blocks) {
      const dur = Math.max(0, b.endMin - b.startMin);
      if (totals[b.dutyStatus] !== undefined) {
        totals[b.dutyStatus] += dur;
      }
    }
    // Fill unaccounted time as off-duty
    const accounted = Object.values(totals).reduce((s, v) => s + v, 0);
    if (accounted < 1440) {
      totals.off_duty += 1440 - accounted;
    }
    return totals;
  }, [blocks]);

  // ── Formatted totals (hours:minutes strings) ────────────────────
  const hosTotalsFormatted = useMemo(() => {
    const fmt = (mins) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${h}h ${String(m).padStart(2, '0')}m`;
    };
    return {
      off_duty: fmt(hosTotals.off_duty),
      sleeper_berth: fmt(hosTotals.sleeper_berth),
      driving: fmt(hosTotals.driving),
      on_duty_not_driving: fmt(hosTotals.on_duty_not_driving),
      total: fmt(hosTotals.off_duty + hosTotals.sleeper_berth + hosTotals.driving + hosTotals.on_duty_not_driving),
    };
  }, [hosTotals]);

  return {
    // State
    blocks,
    sortedBlocks,
    selectedBlockId,
    zoomLevel,
    snapEnabled,
    canUndo,
    canRedo,
    hosTotals,
    hosTotalsFormatted,

    // Setters
    setBlocks: replaceAll,
    setSelectedBlockId,
    setZoomLevel,
    setSnapEnabled,

    // Operations
    addBlock,
    deleteBlock,
    updateBlock,
    moveBlock,
    resizeBlock,
    splitBlock,
    mergeBlocks,
    changeBlockStatus,
    undo,
    redo,
  };
}
