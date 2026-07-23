import React, { useState, useRef, useEffect } from 'react';
import { Truck, Shield, Building2, UserCheck, Bot, Bell, Clock, Radio, AlertTriangle, ShieldAlert, CheckCircle2, FileCheck, X, LogIn, User } from 'lucide-react';
import useRealTime from '../hooks/useRealTime';
import { useAuthStore } from '../stores/useAuthStore';

export default function Navbar({
  activeRole,
  onRoleChange,
  activeCompany,
  onCompanyChange,
  companies = [],
  onOpenAiCopilot,
  onOpenAuthModal,
}) {
  const timeInfo = useRealTime();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: '30-Minute Rest Break Warning',
      message: 'You have driven 7.5 hours continuous. Mandatory 30-minute rest break required within 30 minutes.',
      type: 'warning',
      time: '10 mins ago',
      read: false,
    },
    {
      id: 'n2',
      title: 'Daily Log Certification Required',
      message: 'FMCSA requires certification for yesterday\'s log sheet (2026-07-22). Please sign & certify.',
      type: 'info',
      time: '1 hour ago',
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Truck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">LogRoute</span>
              <span className="text-blue-600 font-extrabold text-lg">AI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md">
                ELD PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">FMCSA HOS & ELD Trip Planner</p>
          </div>
        </div>

        {/* Live Real-Time & Date Clock Widget */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-700">
          <Clock size={14} className="text-blue-600 animate-pulse" />
          <span className="font-bold text-slate-900">{timeInfo.timeString}</span>
          <span className="text-[10px] text-slate-500">({timeInfo.longDateString})</span>
          <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-sans flex items-center gap-1 font-bold">
            <Radio size={10} className="animate-pulse" />
            {timeInfo.timeSource.includes('Network') ? 'NTP Synced' : 'System Clock'}
          </span>
        </div>

        {/* Center: Multi-Company Switcher */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
          <Building2 size={15} className="text-slate-500 ml-2" />
          <select
            value={activeCompany.id}
            onChange={(e) => {
              const comp = companies.find((c) => c.id === e.target.value);
              if (comp) onCompanyChange(comp);
            }}
            className="bg-transparent text-xs font-semibold text-slate-800 outline-none pr-3 cursor-pointer py-1"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="bg-white text-slate-900">
                {c.name} ({c.driversCount} Drivers)
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions: Role Selector, Account Login/Sign Up, AI Copilot, Notifications */}
        <div className="flex items-center gap-3">
          {/* Role Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {[
              { id: 'driver', label: 'Driver', icon: Truck },
              { id: 'manager', label: 'Dispatcher', icon: UserCheck },
              { id: 'admin', label: 'Admin', icon: Shield },
            ].map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account Login / Sign Up Trigger Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Sign In / Register Driver Account"
          >
            <User size={14} />
            <span className="hidden sm:inline">{isAuthenticated && user ? user.name : 'Sign In / Register'}</span>
          </button>

          {/* AI Copilot Trigger */}
          <button
            onClick={onOpenAiCopilot}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs"
          >
            <Bot size={15} className="text-indigo-600 animate-pulse" />
            <span className="hidden md:inline">LogRoute Copilot</span>
          </button>

          {/* Notifications Dropdown Container */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors relative shadow-xs"
              title="FMCSA HOS & System Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                <div className="p-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-blue-600" />
                    <span className="font-extrabold text-sm text-slate-900">HOS Alerts & Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No new notifications. All clear!
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 flex items-start gap-3 transition-colors ${
                          n.read ? 'bg-slate-50/50 text-slate-500' : 'bg-white text-slate-900'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'warning' ? (
                            <AlertTriangle size={18} className="text-amber-500" />
                          ) : n.type === 'violation' ? (
                            <ShieldAlert size={18} className="text-rose-500" />
                          ) : (
                            <FileCheck size={18} className="text-blue-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>

                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-mono">Real-Time FMCSA Alert Monitoring</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
