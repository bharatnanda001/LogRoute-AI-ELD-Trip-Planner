// src/components/PlaybackControls.jsx
import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { playPencilScratch } from '../utils/soundEffects';

export default function PlaybackControls({
  isPlaying,
  onTogglePlay,
  activeMin,
  onChangeMin,
  playbackSpeed,
  onChangeSpeed,
  isMuted,
  onToggleMute,
}) {
  const reqRef = useRef(null);
  const lastTimeRef = useRef(null);

  const minToTimeStr = (m) => {
    const safeM = typeof m === 'number' && !isNaN(m) ? Math.max(0, Math.min(1440, m)) : 0;
    const hrs = Math.floor(safeM / 60) % 24;
    const mins = Math.round(safeM % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isPlaying) {
      const animate = (time) => {
        if (lastTimeRef.current !== null) {
          const delta = time - lastTimeRef.current;
          // Speed 1x = 24 seconds for full day; 10x = 2.4 seconds
          const advanceMins = (delta / 1000) * (60 / (24 / playbackSpeed));
          onChangeMin((prev) => {
            const next = prev + advanceMins;
            if (next >= 1440) {
              onTogglePlay(false);
              return 1440;
            }
            playPencilScratch(isMuted);
            return next;
          });
        }
        lastTimeRef.current = time;
        reqRef.current = requestAnimationFrame(animate);
      };
      reqRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(reqRef.current);
      lastTimeRef.current = null;
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPlaying, playbackSpeed, isMuted]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Play / Pause / Step Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChangeMin(0)}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          title="Reset to 00:00 MIDNIGHT"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={() => onChangeMin(Math.max(0, activeMin - 60))}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          title="-1 Hour"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={() => onTogglePlay(!isPlaying)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span>{isPlaying ? 'Pause Playback' : 'Play Day Playback'}</span>
        </button>

        <button
          onClick={() => onChangeMin(Math.min(1440, activeMin + 60))}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          title="+1 Hour"
        >
          <SkipForward size={16} />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-2">
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                playbackSpeed === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Live Time Range Slider */}
      <div className="flex-1 min-w-[240px] flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
          {minToTimeStr(activeMin)} HRS
        </span>

        <input
          type="range"
          min="0"
          max="1440"
          step="15"
          value={activeMin}
          onChange={(e) => onChangeMin(Number(e.target.value))}
          className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
        />

        <span className="text-xs text-slate-400 font-mono">24:00</span>
      </div>
    </div>
  );
}
