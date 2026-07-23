// src/components/fleet/UnidentifiedDrivingPanel.jsx
// ═══════════════════════════════════════════════════════════════════
// Unidentified Driving Management Panel (Motive / Samsara Style)
// Manages unassigned vehicle movements with fleet assignment & driver dispute workflow
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Truck, UserCheck, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

import { formatDateISO } from '../../services/timeService';

const todayIso = formatDateISO();
const MOCK_UNIDENTIFIED = [
  {
    id: 'uid_1',
    vehicleNumber: 'Truck #4417',
    startTime: `${todayIso} 05:15:00`,
    endTime: `${todayIso} 05:42:00`,
    distanceMiles: 18.4,
    location: 'Dallas, TX → Fort Worth, TX',
    status: 'unassigned',
  },
  {
    id: 'uid_2',
    vehicleNumber: 'Truck #8809',
    startTime: `${todayIso} 23:10:00`,
    endTime: `${todayIso} 23:25:00`,
    distanceMiles: 8.2,
    location: 'Houston, TX Terminal Yard',
    status: 'unassigned',
  },
];

export default function UnidentifiedDrivingPanel() {
  const [records, setRecords] = useState(MOCK_UNIDENTIFIED);
  const [selectedDriver, setSelectedDriver] = useState('John Smith');

  const handleAssign = (id) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'assigned', assignedTo: selectedDriver } : r))
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm">
          <Truck size={18} />
          <span>Unidentified Driving Records (§395.32)</span>
        </div>
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <AlertCircle size={12} /> {records.filter((r) => r.status === 'unassigned').length} Pending Assignment
        </span>
      </div>

      <div className="space-y-3">
        {records.map((rec) => (
          <div key={rec.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Truck size={14} className="text-indigo-600" />
                {rec.vehicleNumber} ({rec.distanceMiles} miles)
              </span>
              <span className="font-mono text-[11px] text-slate-500">{rec.startTime}</span>
            </div>

            <p className="text-slate-600 text-xs">
              Location: <strong>{rec.location}</strong>
            </p>

            {rec.status === 'unassigned' ? (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="John Smith">John Smith (Driver)</option>
                  <option value="Robert Davis">Robert Davis (Driver)</option>
                  <option value="Yard Move">Yard Move (Exempt)</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleAssign(rec.id)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1"
                >
                  <UserCheck size={14} /> Assign to Driver
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>Assigned to {rec.assignedTo} — Pending driver acceptance</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
