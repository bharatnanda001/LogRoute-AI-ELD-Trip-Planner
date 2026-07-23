// src/components/BlockInspectorModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, FileText, Scissors, Trash2, Check, ArrowRightLeft } from 'lucide-react';

const STATUS_OPTIONS = [
  { id: 'off_duty', label: 'Off Duty', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { id: 'sleeper_berth', label: 'Sleeper Berth', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  { id: 'driving', label: 'Driving 🚛', color: 'bg-rose-50 border-rose-300 text-rose-800 font-bold' },
  { id: 'on_duty_not_driving', label: 'On Duty (Not Driving)', color: 'bg-amber-50 border-amber-300 text-amber-800' },
];

export default function BlockInspectorModal({ block, isOpen, onClose, onUpdate, onDelete, onSplit }) {
  if (!isOpen || !block) return null;

  const [dutyStatus, setDutyStatus] = useState(block.dutyStatus || 'driving');
  const [startMin, setStartMin] = useState(block.startMin || 0);
  const [endMin, setEndMin] = useState(block.endMin || 60);
  const [location, setLocation] = useState(block.location?.city ? `${block.location.city}, ${block.location.state}` : '');
  const [notes, setNotes] = useState(block.annotation || '');

  useEffect(() => {
    if (block) {
      setDutyStatus(block.dutyStatus || 'driving');
      setStartMin(block.startMin || 0);
      setEndMin(block.endMin || 60);
      setLocation(block.location?.city ? `${block.location.city}, ${block.location.state}` : '');
      setNotes(block.annotation || '');
    }
  }, [block]);

  const minToTimeStr = (m) => {
    const hrs = Math.floor(m / 60) % 24;
    const mins = Math.round(m % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const timeStrToMin = (str) => {
    const [h, m] = str.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleSave = () => {
    onUpdate({
      ...block,
      dutyStatus,
      startMin,
      endMin,
      annotation: notes,
      location: location ? { city: location.split(',')[0]?.trim(), state: location.split(',')[1]?.trim() || 'US' } : null,
    });
    onClose();
  };

  const durationHrs = Math.max(0, (endMin - startMin) / 60).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              F
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Duty Block Inspector</h3>
              <p className="text-[11px] text-slate-500">Duration: <strong className="text-slate-700 font-mono">{durationHrs} hours</strong> ({minToTimeStr(startMin)} → {minToTimeStr(endMin)})</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-5 space-y-4 text-xs">
          {/* Duty Status Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Duty Status Category</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setDutyStatus(st.id)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    dutyStatus === st.id
                      ? 'ring-2 ring-indigo-500 shadow-sm ' + st.color
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start & End Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Time</label>
              <input
                type="time"
                step="900" // 15-min intervals
                value={minToTimeStr(startMin)}
                onChange={(e) => setStartMin(timeStrToMin(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-indigo-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">End Time</label>
              <input
                type="time"
                step="900"
                value={minToTimeStr(endMin)}
                onChange={(e) => setEndMin(timeStrToMin(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-indigo-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Location & Remarks */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Location Name</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chicago, IL"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes & Remarks</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pre-trip inspection / Fueling at Loves #402"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { onDelete(block.id); onClose(); }}
              className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
              title="Delete Block"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => { onSplit(block); onClose(); }}
              className="px-3 py-2 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Split Block in Half"
            >
              <Scissors size={14} />
              <span>Split</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Check size={16} />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
