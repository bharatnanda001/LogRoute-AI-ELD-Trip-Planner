// src/components/auth/AuthModal.jsx
// ═══════════════════════════════════════════════════════════════════
// Full Authentication Screen — Sign In & Driver / Fleet Admin Registration
// Stripe × Linear American SaaS UI Design (Design System v2.0)
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Truck, Shield, Building2, User, Key, Mail, UserPlus, LogIn, Lock, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AuthModal({ isOpen, onClose }) {
  const { login, registerDriver, isAuthenticated, logout } = useAuthStore();

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

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) return;
    login(formData.email, formData.password, selectedRole);
    if (onClose) onClose();
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
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden font-sans">
        
        {/* Close Button if already authenticated */}
        {isAuthenticated && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/30">
            <Truck size={26} />
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="font-extrabold text-slate-900 text-xl tracking-tight">LogRoute</span>
            <span className="text-blue-600 font-extrabold text-xl">AI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
              ELD PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            FMCSA 49 CFR Part 395 Compliant Commercial ELD & HOS Portal
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register Driver vs Register Fleet Admin */}
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
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'driver', label: 'Driver', icon: Truck },
                  { id: 'manager', label: 'Dispatcher', icon: User },
                  { id: 'admin', label: 'Admin', icon: Shield },
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        selectedRole === r.id
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={16} className={selectedRole === r.id ? 'text-blue-600' : 'text-slate-500'} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address / Trucker ID</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="driver@abclogistics.com or TRK-1001"
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <LogIn size={16} />
              <span>Sign In to ELD Portal</span>
            </button>
          </form>
        )}

        {/* Mode 2: DRIVER SIGN UP */}
        {authMode === 'register_driver' && (
          <form onSubmit={handleRegisterDriverSubmit} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Register individual Commercial Driver Account with unique FMCSA Trucker ID.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="john@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Commercial Driver License (CDL #)</label>
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Custom Trucker ID (Optional)</label>
                <input
                  type="text"
                  value={formData.truckerId}
                  onChange={(e) => setFormData({ ...formData, truckerId: e.target.value })}
                  placeholder="TRK-1001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <UserPlus size={16} />
              <span>Create Individual Trucker Profile & Sign In</span>
            </button>
          </form>
        )}

        {/* Mode 3: FLEET ADMIN SIGN UP */}
        {authMode === 'register_admin' && (
          <form onSubmit={handleRegisterDriverSubmit} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2 font-medium">
              <Building2 size={16} className="text-indigo-600 shrink-0" />
              <span>Register Motor Carrier Fleet Account (Manage & Provision Employee Drivers).</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Carrier Name</label>
                <input
                  type="text"
                  required
                  value={formData.carrierName}
                  onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                  placeholder="ABC Logistics LLC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
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
