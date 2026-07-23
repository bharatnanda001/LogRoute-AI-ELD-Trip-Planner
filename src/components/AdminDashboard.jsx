// src/components/AdminDashboard.jsx
import React from 'react';
import { Shield, Building2, Key, DollarSign, Activity, Server, Plus, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard({ companies, onAddCompany }) {
  return (
    <div className="space-y-6">
      {/* Super Admin Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Managed Carriers</span>
            <Building2 size={16} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">{companies.length} Companies</div>
          <div className="text-xs text-indigo-400 font-medium mt-1">Multi-Tenant Isolated</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Active Drivers</span>
            <Activity size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">498 Drivers</div>
          <div className="text-xs text-slate-400 font-medium mt-1">Across all organizations</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Platform MRR</span>
            <DollarSign size={16} className="text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">$18,450</div>
          <div className="text-xs text-purple-300 font-medium mt-1">+14.2% this month</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>FMCSA Engine Uptime</span>
            <Server size={16} className="text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-teal-400">99.99%</div>
          <div className="text-xs text-teal-300 font-medium mt-1">Sub-second HOS Engine</div>
        </div>
      </div>

      {/* Companies Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-slate-100 font-bold text-lg">Multi-Company SaaS Tenant Directory</h3>
            <p className="text-slate-400 text-xs">Isolated databases, DOT numbers, and custom subscription tiers</p>
          </div>

          <button
            onClick={() => alert('New Company Registration Modal triggered')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus size={16} />
            <span>Add Carrier Company</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {companies.map((comp) => (
            <div key={comp.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-100 font-extrabold text-base">{comp.name}</span>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-md uppercase">
                  {comp.tier || 'Enterprise'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <div>DOT Number: <strong className="text-slate-200">{comp.dot || 'DOT-992019'}</strong></div>
                <div>Fleet Size: <strong className="text-slate-200">{comp.driversCount} Active Drivers</strong></div>
                <div>HOS Enforcement: <strong className="text-emerald-400">49 CFR Part 395</strong></div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">API Access: <strong className="text-indigo-400">Active</strong></span>
                <button className="text-indigo-400 hover:underline font-semibold">Manage Keys</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
