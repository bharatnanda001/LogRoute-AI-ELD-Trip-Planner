// src/components/fleet/AdminDriverProvisioning.jsx
// ═══════════════════════════════════════════════════════════════════
// Fleet Admin Driver Provisioning & Employee Management Panel
// Admins can create individual Trucker Accounts for fleet drivers
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { UserPlus, Users, Truck, CheckCircle2, Shield, Search, Mail, Key, Trash2, Eye } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AdminDriverProvisioning({ onSelectDriverLog }) {
  const { registeredDrivers, createDriverByAdmin, activeCompany } = useAuthStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    license: '',
    state: 'TX',
    truckerId: '',
  });

  const handleCreateDriver = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    createDriverByAdmin({
      name: formData.name,
      email: formData.email,
      license: formData.license || 'DL-9948102',
      state: formData.state || 'TX',
      truckerId: formData.truckerId || `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setFormData({ name: '', email: '', license: '', state: 'TX', truckerId: '' });
    setShowAddForm(false);
    alert('New Employee Trucker Account Successfully Created & Provisioned!');
  };

  const filteredDrivers = registeredDrivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.truckerId && d.truckerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border border-blue-200">
              Fleet Admin Operations
            </span>
            <span className="text-xs font-bold text-slate-500">{activeCompany.name} ({activeCompany.dot})</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Driver & Employee Management</h2>
          <p className="text-xs text-slate-500">Provision individual Trucker Accounts, assign Trucker IDs, and inspect driver logs</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <UserPlus size={16} />
          <span>Provision New Employee Driver</span>
        </button>
      </div>

      {/* Admin Add Driver Form */}
      {showAddForm && (
        <form onSubmit={handleCreateDriver} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <UserPlus size={14} className="text-blue-600" />
              Create & Issue New Employee Trucker Account
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Assigned to: {activeCompany.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Employee Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Michael Vance"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Driver Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="michael@abclogistics.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Commercial DL #</label>
              <input
                type="text"
                required
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                placeholder="DL-889102"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Trucker ID #</label>
              <input
                type="text"
                value={formData.truckerId}
                onChange={(e) => setFormData({ ...formData, truckerId: e.target.value })}
                placeholder="TRK-1003"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
            >
              Issue Credentials & Save Driver
            </button>
          </div>
        </form>
      )}

      {/* Driver Search & Fleet Roster Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search driver by name or Trucker ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <span className="text-xs font-bold text-slate-500 font-mono">
            Total Active Fleet Drivers: {filteredDrivers.length}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="p-3">Trucker ID</th>
                <th className="p-3">Driver Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">CDL License</th>
                <th className="p-3">Assigned Carrier</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600">{driver.truckerId || 'TRK-1001'}</td>
                  <td className="p-3 font-extrabold text-slate-900">{driver.name}</td>
                  <td className="p-3 text-slate-600">{driver.email}</td>
                  <td className="p-3 font-mono text-slate-700">{driver.license} ({driver.state || 'TX'})</td>
                  <td className="p-3 text-slate-600">{driver.carrier}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectDriverLog && onSelectDriverLog(driver)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 ml-auto"
                    >
                      <Eye size={13} />
                      <span>Inspect Driver Logs</span>
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
