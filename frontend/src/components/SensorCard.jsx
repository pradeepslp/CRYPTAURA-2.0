import React from 'react';
import {
  Thermometer,
  Gauge,
  Activity,
  Navigation,
  Zap,
  RotateCw,
  Shield,
  ShieldAlert,
  ShieldX,
  Sliders,
  RotateCcw,
  Eye,
} from 'lucide-react';

const iconMap = {
  TEMP_01: Thermometer,
  PRES_01: Gauge,
  VIBR_01: Activity,
  GPS_01: Navigation,
  VOLT_01: Zap,
  RPM_01: RotateCw,
};

export default function SensorCard({
  sensor,
  onInspect,
  onIsolate,
  onDownweight,
  onReset,
}) {
  if (!sensor) return null;

  const Icon = iconMap[sensor.id] || Activity;
  const isIsolated = sensor.status === 'ISOLATED';
  const isDownweighted = sensor.status === 'DOWN_WEIGHTED';
  const trust = sensor.trust_score;

  // Trust score color mapping
  let trustColor = 'text-emerald-400';
  let trustBarColor = 'bg-emerald-500';
  let statusBadgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  let statusText = 'TRUSTED';
  let cardBorder = 'border-slate-800 hover:border-slate-700';

  if (isIsolated) {
    statusText = 'ISOLATED';
    statusBadgeClass = 'bg-slate-800 border-slate-600 text-slate-300';
    trustColor = 'text-slate-400';
    trustBarColor = 'bg-slate-600';
    cardBorder = 'border-slate-700/60 opacity-80';
  } else if (isDownweighted) {
    statusText = 'DOWN-WEIGHTED';
    statusBadgeClass = 'bg-purple-500/15 border-purple-500/40 text-purple-300';
    cardBorder = 'border-purple-500/30';
  } else if (trust < 30) {
    statusText = 'CRITICAL';
    trustColor = 'text-rose-400';
    trustBarColor = 'bg-rose-500';
    statusBadgeClass = 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse';
    cardBorder = 'border-rose-500/50 glow-rose';
  } else if (trust < 60) {
    statusText = 'SUSPICIOUS';
    trustColor = 'text-orange-400';
    trustBarColor = 'bg-orange-500';
    statusBadgeClass = 'bg-orange-500/20 border-orange-500/40 text-orange-400';
    cardBorder = 'border-orange-500/40 glow-amber';
  } else if (trust < 90) {
    statusText = 'WARNING';
    trustColor = 'text-amber-400';
    trustBarColor = 'bg-amber-500';
    statusBadgeClass = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    cardBorder = 'border-amber-500/30';
  }

  return (
    <div
      className={`rounded-2xl bg-[#0e1524]/90 backdrop-blur-md p-4 border transition-all duration-300 shadow-lg flex flex-col justify-between ${cardBorder}`}
    >
      {/* Header: Name, ID, Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-100 text-sm tracking-wide">
                  {sensor.name}
                </h4>
                <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                  {sensor.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Range: {sensor.min_normal} - {sensor.max_normal} {sensor.unit}
              </p>
            </div>
          </div>

          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}
          >
            {statusText}
          </span>
        </div>

        {/* Current Telemetry Reading */}
        <div className="my-3 flex items-baseline justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Live Value
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
              <span>{sensor.current_value}</span>
              <span className="text-sm font-normal text-cyan-400">
                {sensor.unit}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Anomaly Score
            </div>
            <div
              className={`text-sm font-mono font-bold ${
                sensor.anomaly_score > 0.4 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {sensor.anomaly_score.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Trust Score Progress Gauge */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Trust Score</span>
            <span className={`font-bold ${trustColor}`}>{trust}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${trustBarColor}`}
              style={{ width: `${Math.min(100, Math.max(0, trust))}%` }}
            />
          </div>
        </div>

        {/* Attack indicator pill */}
        {sensor.attack_active && (
          <div className="mb-3 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-[11px] font-mono flex items-center justify-between animate-pulse">
            <span>ATTACK ACTIVE:</span>
            <span className="font-bold truncate ml-1">{sensor.attack_type}</span>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
        <button
          onClick={() => onInspect(sensor)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
          title="Inspect 5-layer detection breakdown"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Inspect</span>
        </button>

        {isIsolated ? (
          <button
            onClick={() => onReset(sensor.id)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-medium transition border border-emerald-500/40"
            title="Restore sensor to normal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onDownweight(sensor.id)}
              disabled={isDownweighted}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border ${
                isDownweighted
                  ? 'bg-purple-950/40 text-purple-400 border-purple-800 cursor-not-allowed'
                  : 'bg-slate-800/80 hover:bg-purple-950/40 text-slate-300 hover:text-purple-300 border-slate-700 hover:border-purple-600/50'
              }`}
              title="Down-weight sensor vote to 25%"
            >
              Down-wt
            </button>
            <button
              onClick={() => onIsolate(sensor.id)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium transition border border-rose-500/40"
              title="Isolate sensor completely from voting"
            >
              <ShieldX className="w-3.5 h-3.5" />
              <span>Isolate</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
