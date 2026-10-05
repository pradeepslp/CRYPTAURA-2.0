import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Radio,
  RotateCcw,
  Play,
  Square,
  Activity,
  Cpu,
} from 'lucide-react';

export default function Navbar({
  systemStatus,
  isConnected,
  isWebSocket,
  lastUpdated,
  demoState,
  onStartDemo,
  onStopDemo,
  onResetSystem,
}) {
  const isSecure = systemStatus === 'SECURE';
  const isWarning = systemStatus === 'WARNING';
  const isCritical = systemStatus === 'CRITICAL';

  let statusBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let StatusIcon = ShieldCheck;
  let statusGlow = 'glow-emerald';

  if (isWarning) {
    statusBg = 'bg-amber-500/10 border-amber-500/40 text-amber-400';
    StatusIcon = ShieldAlert;
    statusGlow = 'glow-amber';
  } else if (isCritical) {
    statusBg = 'bg-rose-500/15 border-rose-500/50 text-rose-400 animate-pulse';
    StatusIcon = ShieldAlert;
    statusGlow = 'glow-rose';
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f17]/90 backdrop-blur-md px-4 lg:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 radar-live-dot" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 font-mono">
                SENTINEX
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-medium tracking-widest hidden sm:inline-block">
                INTELLIGENT INTEGRITY ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Multi-Layer Sensor Anomaly Detection & Cyber-Integrity Defense
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? isWebSocket
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                    : 'bg-cyan-400 shadow-sm shadow-cyan-400'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {isConnected
                ? isWebSocket
                  ? 'WS Stream Active'
                  : 'HTTP Polling Fallback'
                : 'Connecting...'}
            </span>
          </div>

          {/* System Status Pill */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-semibold text-xs tracking-wider transition-all duration-300 ${statusBg} ${statusGlow}`}
          >
            <StatusIcon className="w-4 h-4" />
            <span>SYSTEM: {systemStatus}</span>
          </div>

          {/* Demo Mode Button */}
          {demoState && demoState.is_running ? (
            <button
              onClick={onStopDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition shadow-md shadow-rose-900/30 border border-rose-400/40"
              title="Stop automated demo sequence"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Demo</span>
            </button>
          ) : (
            <button
              onClick={onStartDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition shadow-md shadow-cyan-900/30 border border-cyan-400/30"
              title="Run 7-stage automated demonstration sequence"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Demo Mode</span>
            </button>
          )}

          {/* Reset System Button */}
          <button
            onClick={onResetSystem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700"
            title="Reset all sensors to baseline normal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset System</span>
          </button>
        </div>
      </div>
    </header>
  );
}
