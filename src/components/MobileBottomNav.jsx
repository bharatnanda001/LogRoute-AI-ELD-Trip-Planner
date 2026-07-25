// src/components/MobileBottomNav.jsx
import React from 'react';
import { LayoutDashboard, Compass, FileText, Map, User } from 'lucide-react';

export default function MobileBottomNav({ activeTab, onTabChange, onSelectTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'trip_planner', label: 'Trips', icon: Compass },
    { id: 'daily_log', label: 'Logs', icon: FileText },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'history', label: 'History', icon: User },
  ];

  const handleTabSelect = onSelectTab || onTabChange;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect && handleTabSelect(tab.id)}
              className={`flex flex-col items-center gap-1 min-w-14 min-h-11 justify-center rounded-xl transition-all ${
                isActive ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'scale-110 transition-transform' : ''} />
              <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
