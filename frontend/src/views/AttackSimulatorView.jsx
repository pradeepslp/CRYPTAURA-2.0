import React, { useState } from 'react';
import {
  Crosshair,
  Zap,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  Flame,
  Radio,
  Sliders,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import SensorCard from '../components/SensorCard';

const ATTACK_TYPES = [
  {
    id: 'False Data Injection',
    label: 'False Data Injection (FDI)',
    description: 'Forces sensor telemetry directly to an unauthorized spoofed target value.',
    defaultTarget: 120.0,
  },
  {
    id: 'Sudden Value Manipulation',
    label: 'Sudden Value Manipulation (Spike/Drop)',
    description: 'Instantaneous anomalous step change violating mechanical slew inertia.',
    defaultTarget: 135.0,
  },
  {
    id: 'Sensor Drift',
    label: 'Sensor Drift (Stealth Bias)',
    description: 'Continuous creeping offset bias that progressively walks away from baseline.',
    defaultTarget: 1.5,
  },
  {
    id: 'Noise Injection',
    label: 'Noise Injection (Jitter Variance)',
    description: 'Chaotic high-amplitude Gaussian noise disrupting statistical stability.',
    defaultTarget: 10.0,
  },
  {
    id: 'Sensor Failure',
    label: 'Sensor Failure (Flatline / Freeze / Zero)',
    description: 'Sensor freeze causing total statistical variance collapse or dead zero.',
    defaultTarget: 0.0,
  },
];

export default function AttackSimulatorView({
  sensors,
  onInjectAttack,
  onStopAttack,
  onResetSystem,
  onInspectSensor,
  onIsolate,
  onDownweight,
  onResetSensor,
}) {
  const [selectedSensor, setSelectedSensor] = useState('TEMP_01');
  const [selectedAttackType, setSelectedAttackType] = useState('False Data Injection');
  const [targetValue, setTargetValue] = useState('120');
  const [duration, setDuration] = useState('0'); // 0 = indefinite until stopped
  const [submitting, setSubmitting] = useState(false);

  const sensorKeys = Object.keys(sensors || {});
  const currentSensor = sensors[selectedSensor];

  const handleAttackTypeChange = (atype) => {
    setSelectedAttackType(atype);
    if (atype === 'False Data Injection') {
      if (selectedSensor === 'TEMP_01') setTargetValue('120');
      else if (selectedSensor === 'PRES_01') setTargetValue('55');
      else if (selectedSensor === 'RPM_01') setTargetValue('2500');
      else if (selectedSensor === 'VIBR_01') setTargetValue('4.8');
      else setTargetValue('100');
    } else if (atype === 'Sensor Failure') {
      setTargetValue('0');
    } else if (atype === 'Sensor Drift') {
      setTargetValue('1.5');
    } else if (atype === 'Noise Injection') {
      setTargetValue('5.0');
    } else {
      setTargetValue('130');
    }
  };

  const handleApplyPreset = (sensorId, attackType, val, dur = 0) => {
    setSelectedSensor(sensorId);
    setSelectedAttackType(attackType);
    setTargetValue(String(val));
    setDuration(String(dur));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onInjectAttack(
        selectedSensor,
        selectedAttackType,
        targetValue !== '' ? Number(targetValue) : null,
        duration !== '' ? Number(duration) : 0
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleHaltAttack = async () => {
    setSubmitting(true);
    try {
      await onStopAttack(selectedSensor);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulator Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#180a0f] via-slate-900 to-[#180a0f] border border-rose-500/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <Crosshair className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-xl font-extrabold text-white">
                Adversarial Attack Simulation Chamber
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Inject synthetic cyber-attacks and physical telemetry corruption into active sensors.
              Observe how SENTINEX's 5-layer detection engine identifies anomalies, degrades trust scores,
              generates explainable operator alerts, and recommends mitigation.
            </p>
          </div>

          <button
            onClick={onResetSystem}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset System Baseline</span>
          </button>
        </div>
      </div>

      {/* Preset Quick-Inject Scenarios */}
      <div className="p-5 rounded-2xl bg-[#0e1524]/90 border border-slate-800">
        <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Quick Attack Presets (Judge & Demo Ready)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleApplyPreset('TEMP_01', 'False Data Injection', 120)}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-300 transition flex items-center justify-between">
              <span>Turbine Overheat FDI</span>
              <span className="text-[10px] font-mono text-cyan-400">TEMP_01</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Inject 120.0°C false telemetry (Normal: 65 - 85°C).
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('PRES_01', 'Sudden Value Manipulation', 52.5)}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-300 transition flex items-center justify-between">
              <span>Hydraulic Spike Surge</span>
              <span className="text-[10px] font-mono text-cyan-400">PRES_01</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sharp pressure spike to 52.5 PSI (Slew limit breach).
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('VIBR_01', 'Noise Injection', 8.0)}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-300 transition flex items-center justify-between">
              <span>Erratic Shaft Vibration</span>
              <span className="text-[10px] font-mono text-cyan-400">VIBR_01</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Chaotic noise jitter contradicting turbine RPM.
            </p>
          </button>
        </div>
      </div>

      {/* Main Simulator Controls & Live Target Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e1524]/90 border border-slate-800 shadow-xl">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Attack Parameter Configuration</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sensor Selection */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-semibold">
                1. Target Physical Sensor
              </label>
              <select
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                {sensorKeys.map((sid) => (
                  <option key={sid} value={sid}>
                    {sensors[sid].name} ({sid}) — Normal: {sensors[sid].min_normal}-{sensors[sid].max_normal} {sensors[sid].unit} (Current: {sensors[sid].current_value} {sensors[sid].unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Attack Type Selection */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-semibold">
                2. Cyber-Physical Attack Vector
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ATTACK_TYPES.map((atype) => (
                  <button
                    key={atype.id}
                    type="button"
                    onClick={() => handleAttackTypeChange(atype.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedAttackType === atype.id
                        ? 'bg-rose-950/50 border-rose-500 text-white shadow-md shadow-rose-950'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100 mb-1">
                      {atype.label}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug">
                      {atype.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manipulated Value & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-semibold">
                  3. Injected Target Value ({currentSensor?.unit || 'unit'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 120"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Normal baseline is ~{currentSensor?.baseline} {currentSensor?.unit}.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-semibold">
                  4. Duration (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0 = continuous until stopped"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Set 0 to sustain attack continuously until "Stop Attack".
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm transition shadow-lg shadow-rose-950/60 border border-rose-400/40"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Inject Attack</span>
              </button>

              <button
                type="button"
                onClick={handleHaltAttack}
                disabled={submitting || !currentSensor?.attack_active}
                className={`py-3 px-5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border ${
                  currentSensor?.attack_active
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Attack</span>
              </button>

              <button
                type="button"
                onClick={() => onResetSensor(selectedSensor)}
                className="py-3 px-5 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 font-medium text-sm transition border border-slate-700 hover:border-emerald-600/40 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Sensor</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Target Sensor Response Column (1 col) */}
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="text-xs font-mono uppercase text-slate-300 font-bold mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Target Node Live Status</span>
            </h4>
            {currentSensor && (
              <SensorCard
                sensor={currentSensor}
                onInspect={onInspectSensor}
                onIsolate={onIsolate}
                onDownweight={onDownweight}
                onReset={onResetSensor}
              />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 font-mono text-slate-400">
            <div className="text-slate-300 font-bold text-[11px] uppercase">
              Demonstration Verification Checklist:
            </div>
            <p className="flex items-center gap-2 text-slate-300">
              <span className="text-cyan-400">1.</span> Sensor value spikes to manipulated target.
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <span className="text-cyan-400">2.</span> Anomaly score jumps towards 1.000.
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <span className="text-cyan-400">3.</span> Dynamic trust score drops rapidly.
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <span className="text-cyan-400">4.</span> Explainable alert generated.
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <span className="text-cyan-400">5.</span> Operator can down-weight or isolate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
