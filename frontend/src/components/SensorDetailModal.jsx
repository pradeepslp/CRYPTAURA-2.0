import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Activity,
  Layers,
  Clock,
  Sliders,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export default function SensorDetailModal({
  sensor,
  onClose,
  onIsolate,
  onDownweight,
  onReset,
}) {
  const [activeTab, setActiveTab] = useState('layers'); // 'layers', 'history', 'mitigation'

  if (!sensor) return null;

  const layers = sensor.layers || {};
  const isIsolated = sensor.status === 'ISOLATED';
  const isDownweighted = sensor.status === 'DOWN_WEIGHTED';
  const trust = sensor.trust_score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0e1422] border border-slate-700 shadow-2xl p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                {sensor.name}
              </h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                {sensor.id}
              </span>
              <span
                className={`font-mono text-xs px-2.5 py-1 rounded-full font-bold border ${
                  isIsolated
                    ? 'bg-slate-800 text-slate-300 border-slate-600'
                    : trust >= 90
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : trust >= 60
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                }`}
              >
                STATUS: {isIsolated ? 'ISOLATED' : sensor.trust_status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Industrial Physical Node • {sensor.description || 'Primary Sensor Telemetry'}
            </p>
          </div>

          {/* Trust Metric Pill */}
          <div className="flex items-center gap-4 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                Dynamic Trust Score
              </div>
              <div className="text-2xl font-black font-mono text-cyan-300">
                {trust}%
              </div>
            </div>
            <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  trust >= 90
                    ? 'bg-emerald-400'
                    : trust >= 60
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, trust))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 mb-4 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === 'layers'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5-Layer Detection Evidence</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Historical Telemetry & Recovery</span>
          </button>
          <button
            onClick={() => setActiveTab('mitigation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === 'mitigation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Mitigation & Controls</span>
          </button>
        </div>

        {/* TAB 1: 5-LAYER DETECTION BREAKDOWN */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            {/* Layer 1 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    LAYER 1
                  </span>
                  <h4 className="font-bold text-slate-200 text-sm">
                    Cross-Sensor Correlation
                  </h4>
                  {layers.cross_correlation?.flagged ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      DISAGREEMENT DETECTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      CONSENSUS MATCHED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {layers.cross_correlation?.explanation || 'Reading agrees with correlated cluster.'}
                </p>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-[10px] text-slate-400">Correlation Anomaly</div>
                <div className="text-sm font-bold text-cyan-300">
                  {layers.cross_correlation?.score?.toFixed(3) ?? '0.000'}
                </div>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    LAYER 2
                  </span>
                  <h4 className="font-bold text-slate-200 text-sm">
                    Statistical Analysis (Z-Score & Variance)
                  </h4>
                  {layers.statistical?.flagged ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      STATISTICAL OUTLIER
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      NORMAL VARIANCE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {layers.statistical?.explanation || 'Within normal statistical variance.'}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-2">
                  <span>Z-Score: {layers.statistical?.z_score ?? '0.0'}σ</span>
                  <span>Moving μ: {layers.statistical?.moving_avg ?? sensor.current_value}</span>
                  <span>StdDev σ: {layers.statistical?.std_dev ?? '0.0'}</span>
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-[10px] text-slate-400">Statistical Anomaly</div>
                <div className="text-sm font-bold text-blue-300">
                  {layers.statistical?.score?.toFixed(3) ?? '0.000'}
                </div>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                    LAYER 3
                  </span>
                  <h4 className="font-bold text-slate-200 text-sm">
                    Physics & Operating Bounds
                  </h4>
                  {layers.physics?.flagged ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      PHYSICS BREACH
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      PHYSICALLY SOUND
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {layers.physics?.explanation || 'Operating within valid physical bounds.'}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-2">
                  <span>Current Slew: {layers.physics?.rate_of_change ?? '0.0'}{sensor.unit}/s</span>
                  <span>Max Rate: {sensor.max_rate_of_change ?? 'N/A'}{sensor.unit}/s</span>
                  <span>Hard Max: {sensor.hard_max}{sensor.unit}</span>
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-[10px] text-slate-400">Physics Anomaly</div>
                <div className="text-sm font-bold text-indigo-300">
                  {layers.physics?.score?.toFixed(3) ?? '0.000'}
                </div>
              </div>
            </div>

            {/* Layer 4 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                    LAYER 4
                  </span>
                  <h4 className="font-bold text-slate-200 text-sm">
                    ML IsolationForest Multi-Variate Detector
                  </h4>
                  {layers.ml_isolation_forest?.flagged ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      ML ANOMALY
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      ML NOMINAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {layers.ml_isolation_forest?.explanation || 'Matches baseline multi-dimensional cluster.'}
                </p>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-[10px] text-slate-400">ML Anomaly Score</div>
                <div className="text-sm font-bold text-purple-300">
                  {layers.ml_isolation_forest?.score?.toFixed(3) ?? '0.000'}
                </div>
              </div>
            </div>

            {/* Layer 5 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-pink-950 text-pink-400 border border-pink-800">
                    LAYER 5
                  </span>
                  <h4 className="font-bold text-slate-200 text-sm">
                    Temporal Persistence Analysis
                  </h4>
                  {layers.temporal?.flagged ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      SUSTAINED ATTACK
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      STEADY STATE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {layers.temporal?.explanation || 'Temporal behavior is consistent with steady state operations.'}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-2">
                  <span>Duration: {layers.temporal?.duration_seconds ?? '0.0'}s</span>
                  <span>Consecutive Anomalies: {layers.temporal?.consecutive_ticks ?? '0'} cycles</span>
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-[10px] text-slate-400">Temporal Anomaly</div>
                <div className="text-sm font-bold text-pink-300">
                  {layers.temporal?.score?.toFixed(3) ?? '0.000'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORY GRAPH */}
        {activeTab === 'history' && (
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <h4 className="font-bold text-sm text-slate-200 mb-3">
              Telemetry Value & Trust Curve
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensor.history || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <ReferenceLine y={sensor.baseline} stroke="#64748b" strokeDasharray="3 3" label="Baseline" />
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} name="Value" />
                  <Line type="monotone" dataKey="trust_score" stroke="#10b981" strokeWidth={2} dot={false} name="Trust Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: MITIGATION & CONTROLS */}
        {activeTab === 'mitigation' && (
          <div className="space-y-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <h4 className="font-bold text-sm text-slate-200">
              Cyber-Physical Sensor Mitigation Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Down-weight */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-purple-400 text-sm mb-1">
                    DOWN-WEIGHT SENSOR
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Reduces sensor contribution to 25% in the multi-sensor voting and control loops. Allows continued observation while dampening malicious impact.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onDownweight(sensor.id);
                    onClose();
                  }}
                  disabled={isDownweighted}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition border ${
                    isDownweighted
                      ? 'bg-purple-950/40 text-purple-400 border-purple-800 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/30'
                  }`}
                >
                  {isDownweighted ? 'Already Down-Weighted' : 'Apply Down-Weight (25%)'}
                </button>
              </div>

              {/* Option 2: Isolate */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-rose-400 text-sm mb-1">
                    ISOLATE SENSOR
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Completely quarantines the sensor from all downstream decision systems. Banner alert confirms remaining trusted sensors support the system safely.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onIsolate(sensor.id);
                    onClose();
                  }}
                  disabled={isIsolated}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition border ${
                    isIsolated
                      ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400/30'
                  }`}
                >
                  {isIsolated ? 'Sensor Isolated' : 'Isolate Sensor'}
                </button>
              </div>

              {/* Option 3: Reset Sensor */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-emerald-400 text-sm mb-1">
                    RESET SENSOR
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Clears isolation or attack state. Restores sensor into active monitoring. Trust score will dynamically and gradually recover back to 95%+.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onReset(sensor.id);
                    onClose();
                  }}
                  className="mt-4 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition border border-emerald-400/30"
                >
                  Reset & Recover Trust
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
