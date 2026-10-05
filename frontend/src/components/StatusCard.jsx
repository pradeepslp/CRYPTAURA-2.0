import React from 'react';

export default function StatusCard({
  title,
  value,
  subvalue,
  icon: Icon,
  variant = 'cyan', // cyan, emerald, amber, rose, purple
  badge,
  onClick,
}) {
  const variantStyles = {
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'from-cyan-950/20 to-slate-900/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      text: 'text-cyan-400',
    },
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'from-emerald-950/20 to-slate-900/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'from-amber-950/20 to-slate-900/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      text: 'text-amber-400',
    },
    rose: {
      border: 'border-rose-500/40',
      bg: 'from-rose-950/25 to-slate-900/40',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      text: 'text-rose-400',
    },
    purple: {
      border: 'border-purple-500/30',
      bg: 'from-purple-950/20 to-slate-900/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      text: 'text-purple-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.cyan;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl bg-gradient-to-br ${style.bg} border ${style.border} backdrop-blur-md shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-slate-600' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${style.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-extrabold font-mono tracking-tight ${style.text}`}>
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subvalue && (
        <p className="mt-1 text-xs text-slate-400 truncate font-mono">
          {subvalue}
        </p>
      )}
    </div>
  );
}
