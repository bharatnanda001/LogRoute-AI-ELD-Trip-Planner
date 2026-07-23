// src/components/FleetManagerDashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// Dispatcher Fleet Portal — Admin Driver Creation & Live Fleet Monitoring
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, Search, Filter, Download, ExternalLink, Truck, CheckCircle2, Clock } from 'lucide-react';
import UnidentifiedDrivingPanel from './fleet/UnidentifiedDrivingPanel';
import AdminDriverProvisioning from './fleet/AdminDriverProvisioning';

export default function FleetManagerDashboard({ activeCompany, onSelectDriverLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
    <div className="space-y-6 font-sans">
      {/* Fleet Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Active Drivers</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{activeCompany.driversCount || 500}</div>
          <div className="text-xs text-emerald-700 font-bold mt-1">98% Active Compliance</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Currently Driving</span>
            <Truck size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">342</div>
          <div className="text-xs text-slate-500 font-medium mt-1">On Active Routes</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>HOS Warnings</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">14</div>
          <div className="text-xs text-amber-700 font-bold mt-1">Approaching 11h/14h Limit</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Carrier USDOT</span>
            <ShieldCheck size={16} className="text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">{activeCompany.dot}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">{activeCompany.name}</div>
        </div>
      </div>

      {/* Fleet Admin Driver Provisioning & Employee Management Panel */}
      <AdminDriverProvisioning onSelectDriverLog={onSelectDriverLog} />

      {/* FMCSA Unidentified Driving Events Control Panel */}
      <UnidentifiedDrivingPanel />

      {/* Live Fleet Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Live Fleet Driver Roster</h3>
            <p className="text-xs text-slate-500">Real-time HOS duty statuses and active driver countdowns</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search driver or truck..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRIVING">Driving</option>
              <option value="ON_DUTY">On Duty</option>
              <option value="SLEEPER">Sleeper</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="p-3">Driver</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Duty Status</th>
                <th className="p-3">Drive Left</th>
                <th className="p-3">Cycle Left</th>
                <th className="p-3">Current Location</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-extrabold text-slate-900">{driver.name}</td>
                  <td className="p-3 font-mono text-slate-600">{driver.vehicle}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        driver.status === 'DRIVING'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : driver.status === 'ON_DUTY'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : driver.status === 'SLEEPER'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {driver.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{driver.remainingDrive}</td>
                  <td className="p-3 font-mono text-slate-700">{driver.remainingCycle}</td>
                  <td className="p-3 text-slate-600">{driver.location}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectDriverLog && onSelectDriverLog(driver)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition"
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
    </div>
  );
}
