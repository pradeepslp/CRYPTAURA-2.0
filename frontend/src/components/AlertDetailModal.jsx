import React from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Shield,
  ShieldX,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';

export default function AlertDetailModal({
  alert,
  onClose,
  onIsolate,
  onDownweight,
  onReset,
}) {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL';
  const isResolved = alert.status === 'RESOLVED';
  const methods = alert.detection_methods || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0e1422] border border-slate-700 shadow-2xl p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
          <div
            className={`p-3 rounded-2xl border ${
              isCritical
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-400'
            }`}
          >
            {isCritical ? (
              <AlertCircle className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white">
                {alert.sensor_name} Integrity Alert
              </h3>
              <span
                className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isCritical
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {alert.severity}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
              <span>ID: {alert.alert_id}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {alert.created_at || 'Just now'}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Snapshot */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Current Telemetry
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300">
              {alert.current_value}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Sensor Trust Score
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                alert.trust_score < 30 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {alert.trust_score}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Status
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                isResolved ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {alert.status}
            </div>
          </div>
        </div>

        {/* Triggered Detection Methods */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Detection Layers Triggered</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {methods.map((method, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-medium"
              >
                ✓ {method}
              </span>
            ))}
          </div>
        </div>

        {/* Natural Language Root Cause Explanation */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 mb-4">
          <div className="text-xs font-mono uppercase text-rose-300 font-bold mb-1">
            Explainable Detection Analysis
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            "{alert.reason}"
          </p>
        </div>

        {/* Recommended Mitigation Action */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6">
          <div className="text-xs font-mono uppercase text-cyan-400 font-bold mb-1">
            Recommended Operator Action
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {alert.recommended_action}
          </p>
        </div>

        {/* Mitigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              onReset(alert.sensor_id);
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Sensor</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={() => {
                onDownweight(alert.sensor_id);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition border border-purple-400/30"
            >
              Down-Weight (25%)
            </button>
            <button
              onClick={() => {
                onIsolate(alert.sensor_id);
                onClose();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-900/40 border border-rose-400/30"
            >
              <ShieldX className="w-4 h-4" />
              <span>ISOLATE SENSOR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
