// src/components/FleetManagerDashboard.jsx
import React, { useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, Search, Filter, Download, ExternalLink, Truck, CheckCircle2, Clock } from 'lucide-react';
import UnidentifiedDrivingPanel from './fleet/UnidentifiedDrivingPanel';

export default function FleetManagerDashboard({ activeCompany, onSelectDriverLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Simulated 500+ Driver Fleet Database
  const mockDrivers = [
    { id: 'd1', name: 'John Smith', vehicle: 'Truck #4417', status: 'DRIVING', remainingDrive: '8h 15m', remainingCycle: '21h 00m', location: 'Dallas, TX', violation: null },
    { id: 'd2', name: 'Sarah Jenkins', vehicle: 'Truck #2209', status: 'ON_DUTY', remainingDrive: '6h 40m', remainingCycle: '18h 30m', location: 'Memphis, TN', violation: '30m Break Due in 15m' },
    { id: 'd3', name: 'Michael Rodriguez', vehicle: 'Truck #1104', status: 'DRIVING', remainingDrive: '1h 10m', remainingCycle: '9h 15m', location: 'Atlanta, GA', violation: '11h Limit Nearing' },
    { id: 'd4', name: 'David Kim', vehicle: 'Truck #3388', status: 'SLEEPER', remainingDrive: '11h 00m', remainingCycle: '54h 00m', location: 'Denver, CO', violation: null },
    { id: 'd5', name: 'Robert Taylor', vehicle: 'Truck #5562', status: 'OFF_DUTY', remainingDrive: '11h 00m', remainingCycle: '68h 00m', location: 'Chicago, IL', violation: null },
    { id: 'd6', name: 'Emily Davis', vehicle: 'Truck #7721', status: 'DRIVING', remainingDrive: '4h 50m', remainingCycle: '32h 10m', location: 'Kansas City, MO', violation: null },
  ];

  const filtered = mockDrivers.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Fleet Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Fleet Drivers</span>
            <Users size={16} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">{activeCompany.driversCount || 500}</div>
          <div className="text-xs text-emerald-400 font-medium mt-1">98% Active Compliance</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Currently Driving</span>
            <Truck size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">342</div>
          <div className="text-xs text-slate-400 font-medium mt-1">On Active Routes</div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>HOS Warnings</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">2</div>
          <div className="text-xs text-amber-300 font-medium mt-1">Requires Dispatch Action</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Sleeper / Off Duty</span>
            <Clock size={16} className="text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">156</div>
          <div className="text-xs text-slate-400 font-medium mt-1">Mandatory Resetting</div>
        </div>
      </div>

      {/* Driver Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by driver name or vehicle unit #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {['ALL', 'DRIVING', 'ON_DUTY', 'SLEEPER'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors">
          <Download size={16} />
          <span>Export Fleet RODS Audit</span>
        </button>
      </div>

      {/* Driver Monitoring Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Driver Name</th>
                <th className="p-4">Vehicle Unit</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Drive Time Left</th>
                <th className="p-4">Cycle Left</th>
                <th className="p-4">Current Location</th>
                <th className="p-4">HOS Compliance</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-100">{d.name}</td>
                  <td className="p-4 text-slate-300 font-mono">{d.vehicle}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        d.status === 'DRIVING'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : d.status === 'ON_DUTY'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-200">{d.remainingDrive}</td>
                  <td className="p-4 font-mono text-purple-300">{d.remainingCycle}</td>
                  <td className="p-4 text-slate-400">{d.location}</td>
                  <td className="p-4">
                    {d.violation ? (
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                        <AlertTriangle size={14} />
                        <span>{d.violation}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 size={14} />
                        <span>Compliant</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onSelectDriverLog(d)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Inspect Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Unidentified Driving Panel (§395.32) */}
      <UnidentifiedDrivingPanel />
    </div>
  );
}
