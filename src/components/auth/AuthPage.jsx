// src/components/auth/AuthPage.jsx
// ═══════════════════════════════════════════════════════════════════
// Dedicated Full-Screen Authentication Page — Sign In & Sign Up
// Stripe × Linear American SaaS Design System v2.0
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Truck, Shield, Building2, User, Key, Mail, UserPlus, LogIn, Lock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AuthPage({ onLoginSuccess }) {
  const { login, registerDriver, setActiveRole } = useAuthStore();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register_driver' | 'register_admin'
  const [selectedRole, setSelectedRole] = useState('driver'); // 'driver' | 'manager' | 'admin'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    license: '',
    state: 'TX',
    carrierName: '',
    usdotNumber: '',
    truckerId: '',
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) return;
    login(formData.email, formData.password, selectedRole);
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleRegisterDriverSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    registerDriver({
      name: formData.name,
      email: formData.email,
      license: formData.license || 'DL-9918201',
      state: formData.state || 'TX',
      carrier: formData.carrierName || 'Independent Driver',
      truckerId: formData.truckerId || `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleRegisterAdminSubmit = (e) => {
    e.preventDefault();
    if (!formData.carrierName || !formData.email) return;
    login(formData.email, formData.password, 'manager');
    setActiveRole('manager');
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Top Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/30">
            <Truck size={26} />
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="font-extrabold text-slate-900 text-2xl tracking-tight">LogRoute</span>
            <span className="text-blue-600 font-extrabold text-2xl">AI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md">
              ELD PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            FMCSA 49 CFR Part 395 Compliant Commercial ELD & HOS Portal
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Driver Sign Up vs Fleet Admin */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              authMode === 'login' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthMode('register_driver')}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              authMode === 'register_driver' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Sign Up
          </button>
          <button
            onClick={() => setAuthMode('register_admin')}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              authMode === 'register_admin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carrier Admin
          </button>
        </div>

        {/* Mode 1: SIGN IN */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Role Portal:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'driver', label: 'Truck Driver', icon: Truck },
                  { id: 'manager', label: 'Fleet Admin / Dispatcher', icon: Shield },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSel = selectedRole === r.id || (selectedRole === 'admin' && r.id === 'manager');
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        isSel
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} className={isSel ? 'text-blue-600' : 'text-slate-500'} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address or Trucker ID</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@abclogistics.com or TRK-1001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <LogIn size={16} />
              <span>Sign In to ELD Portal</span>
            </button>

            {/* Pre-configured Demo Accounts Helper */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demo Accounts Quick Login:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    login('john@abclogistics.com', 'password123', 'driver');
                    if (onLoginSuccess) onLoginSuccess();
                  }}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 text-left"
                >
                  🚚 Driver Demo (John)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('admin@abclogistics.com', 'admin123', 'manager');
                    if (onLoginSuccess) onLoginSuccess();
                  }}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 text-left"
                >
                  🏢 Admin Demo (Carrier)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Mode 2: DRIVER SIGN UP */}
        {authMode === 'register_driver' && (
          <form onSubmit={handleRegisterDriverSubmit} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Register Individual Truck Driver Account & Issue Custom Trucker ID.</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Driver Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="driver@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Commercial DL #</label>
                  <input
                    type="text"
                    required
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                    placeholder="DL-9948201"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Custom Trucker ID</label>
                  <input
                    type="text"
                    value={formData.truckerId}
                    onChange={(e) => setFormData({ ...formData, truckerId: e.target.value })}
                    placeholder="TRK-1001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <UserPlus size={16} />
              <span>Create Driver Account & Open Portal</span>
            </button>
          </form>
        )}

        {/* Mode 3: FLEET CARRIER ADMIN SIGN UP */}
        {authMode === 'register_admin' && (
          <form onSubmit={handleRegisterAdminSubmit} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2 font-medium">
              <Building2 size={16} className="text-indigo-600 shrink-0" />
              <span>Register Motor Carrier Fleet Account (Manage & Provision Employee Drivers).</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Carrier Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.carrierName}
                  onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                  placeholder="ABC Logistics LLC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">USDOT Number</label>
                  <input
                    type="text"
                    required
                    value={formData.usdotNumber}
                    onChange={(e) => setFormData({ ...formData, usdotNumber: e.target.value })}
                    placeholder="DOT-889102"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@abclogistics.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Building2 size={16} />
              <span>Create Carrier Account & Open Fleet Portal</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
