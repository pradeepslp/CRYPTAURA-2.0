import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Crosshair,
  AlertTriangle,
  Terminal,
  Activity,
  Layers,
  Info,
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, activeAlertsCount }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sensors',
      label: 'Sensors',
      icon: Cpu,
      badge: null,
    },
    {
      id: 'attack-simulator',
      label: 'Attack Simulator',
      icon: Crosshair,
      badge: null,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: activeAlertsCount > 0 ? 'bg-rose-500 text-white' : '',
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: Terminal,
      badge: null,
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 border-r border-slate-800 bg-[#0e1422]/90 flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            NAVIGATION
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-sm ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Multi-Layer Detection Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-semibold mb-2 uppercase tracking-wide">
            <Layers className="w-3.5 h-3.5" />
            <span>Detection Layers</span>
          </div>
          <ul className="space-y-1.5 text-slate-400 text-[11px]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>1. Cross-Sensor Correlation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>2. Statistical (Z-Score)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>3. Physics & Slew Limits</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>4. ML IsolationForest</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>5. Temporal Persistence</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Engine Status Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Engine Status:</span>
          <span className="text-emerald-400 font-medium">ONLINE (1.0s)</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Simulation Mode:</span>
          <span className="text-cyan-400">PHYSICS COUPLED</span>
        </div>
        <div className="text-[10px] text-slate-400 text-center pt-2">
          SENTINEX • Security Operations
        </div>
      </div>
    </aside>
  );
}
