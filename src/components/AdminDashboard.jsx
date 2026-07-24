// src/components/AdminDashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// Super Admin Directory & Carrier Provisioning Dashboard
// Stripe × Linear American SaaS Aesthetic (Design System v2.0)
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Shield, Building2, Key, DollarSign, Activity, Server, Plus, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export default function AdminDashboard() {
  const { companies, setActiveCompany } = useAuthStore();
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dot: '',
    driversCount: 25,
    tier: 'Enterprise',
  });

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dot) return;

    const newCompany = {
      id: `c_${Date.now()}`,
      name: formData.name,
      dot: formData.dot,
      driversCount: parseInt(formData.driversCount, 10) || 25,
      tier: formData.tier,
    };

    useAuthStore.setState((state) => ({
      companies: [...state.companies, newCompany],
    }));

    setFormData({ name: '', dot: '', driversCount: 25, tier: 'Enterprise' });
    setShowAddCompanyModal(false);
    alert(`Carrier Company "${newCompany.name}" Successfully Provisioned!`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Super Admin Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Managed Carriers</span>
            <Building2 size={16} className="text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{companies.length} Companies</div>
          <div className="text-xs text-blue-600 font-bold mt-1">Multi-Tenant Isolated</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Active Drivers</span>
            <Activity size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">498 Drivers</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Across all organizations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Platform MRR</span>
            <DollarSign size={16} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600">$18,450</div>
          <div className="text-xs text-indigo-700 font-bold mt-1">+14.2% this month</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>FMCSA Engine Uptime</span>
            <Server size={16} className="text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-teal-600">99.99%</div>
          <div className="text-xs text-teal-700 font-bold mt-1">Sub-second HOS Engine</div>
        </div>
      </div>

      {/* Companies Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-slate-900 font-extrabold text-lg">Multi-Company SaaS Tenant Directory</h3>
            <p className="text-slate-500 text-xs">Isolated carrier databases, USDOT numbers, and subscription tiers</p>
          </div>

          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Add Carrier Company</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {companies.map((comp) => (
            <div key={comp.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-900 font-extrabold text-base">{comp.name}</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md uppercase">
                  {comp.tier || 'Enterprise'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div>USDOT Number: <strong className="text-slate-900 font-mono">{comp.dot || 'DOT-992019'}</strong></div>
                <div>Fleet Capacity: <strong className="text-slate-900">{comp.driversCount} Active Drivers</strong></div>
                <div>HOS Engine: <strong className="text-emerald-700 font-bold">FMCSA 49 CFR §395</strong></div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active Subscription
                </span>
                <button
                  onClick={() => setActiveCompany(comp)}
                  className="text-blue-600 hover:underline font-bold text-[11px]"
                >
                  Manage Fleet →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Carrier Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                Register New Motor Carrier
              </h3>
              <button onClick={() => setShowAddCompanyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Freight Lines"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">USDOT Number</label>
                <input
                  type="text"
                  required
                  value={formData.dot}
                  onChange={(e) => setFormData({ ...formData, dot: e.target.value })}
                  placeholder="DOT-771802"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fleet Drivers Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.driversCount}
                    onChange={(e) => setFormData({ ...formData, driversCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subscription Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="Pro">Pro Plan</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
                >
                  Provision Carrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
