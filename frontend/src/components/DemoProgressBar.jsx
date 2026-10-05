import React from 'react';
import { Play, Check, AlertOctagon, ShieldAlert, Cpu, ArrowRight, X } from 'lucide-react';

export default function DemoProgressBar({ demoState, onStopDemo }) {
  if (!demoState || !demoState.is_running) return null;

  const steps = [
    { num: 1, title: 'Normal Baseline', desc: 'All sensors trusted' },
    { num: 2, title: 'Attack Injected', desc: 'FDI 120°C on Temp' },
    { num: 3, title: 'Detection Flagged', desc: 'Correlation & Physics' },
    { num: 4, title: 'Trust Dropped', desc: 'Score drops to < 30' },
    { num: 5, title: 'Explainable Alert', desc: 'Root cause published' },
    { num: 6, title: 'Sensor Isolated', desc: 'Excluded from voting' },
    { num: 7, title: 'Trust Recovery', desc: 'Restores to SECURE' },
  ];

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-cyan-500/40 shadow-xl shadow-cyan-950/40 relative overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-bold">
            AUTOMATED DEMONSTRATION TOUR IN PROGRESS
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-mono">
            Step {demoState.current_step} of {demoState.total_steps}
          </span>
        </div>
        <button
          onClick={onStopDemo}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300 transition px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700/50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Demo</span>
        </button>
      </div>

      {/* Stepper timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 my-3">
        {steps.map((st) => {
          const isDone = st.num < demoState.current_step;
          const isCurrent = st.num === demoState.current_step;

          let stepBoxClass = 'bg-slate-900/60 border-slate-800 text-slate-500';
          let badgeClass = 'bg-slate-800 text-slate-400';

          if (isDone) {
            stepBoxClass = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300';
            badgeClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
          } else if (isCurrent) {
            stepBoxClass = 'bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-900/40 scale-[1.02]';
            badgeClass = 'bg-cyan-500 text-slate-950 font-bold';
          }

          return (
            <div
              key={st.num}
              className={`p-2.5 rounded-xl border text-xs transition-all duration-300 ${stepBoxClass}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${badgeClass}`}>
                  {isDone ? <Check className="w-3 h-3" /> : st.num}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-mono text-cyan-300 animate-pulse font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="font-semibold truncate text-[11px]">{st.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{st.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Step description commentary */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 font-mono">
        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-cyan-200 font-medium">Stage Commentary:</span>
        <span className="text-slate-300">{demoState.step_description}</span>
      </div>
    </div>
  );
}
