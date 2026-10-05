import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  AlertTriangle,
  Activity,
  Layers,
  CheckCircle,
  Eye,
  ShieldX,
  ExternalLink,
} from 'lucide-react';
import StatusCard from '../components/StatusCard';
import SensorCard from '../components/SensorCard';
import LiveTelemetryChart from '../components/LiveTelemetryChart';

export default function DashboardView({
  sensors,
  systemStatus,
  summary,
  alerts,
  onInspectSensor,
  onInspectAlert,
  onIsolate,
  onDownweight,
  onResetSensor,
}) {
  const [selectedChartSensor, setSelectedChartSensor] = useState('TEMP_01');

  const sensorKeys = Object.keys(sensors || {});
  const isolatedSensors = Object.values(sensors || {}).filter((s) => s.status === 'ISOLATED');

  return (
    <div className="space-y-6">
      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatusCard
          title="System Status"
          value={systemStatus}
          subvalue={
            systemStatus === 'SECURE'
              ? 'All sensors nominal'
              : systemStatus === 'WARNING'
              ? 'Moderate anomalies detected'
              : 'Integrity compromised'
          }
          icon={systemStatus === 'SECURE' ? ShieldCheck : ShieldAlert}
          variant={
            systemStatus === 'SECURE'
              ? 'emerald'
              : systemStatus === 'WARNING'
              ? 'amber'
              : 'rose'
          }
        />

        <StatusCard
          title="Active Sensors"
          value={`${summary.active_sensors} / ${sensorKeys.length}`}
          subvalue={`${summary.isolated_sensors} isolated nodes`}
          icon={Cpu}
          variant="cyan"
        />

        <StatusCard
          title="Trusted Sensors"
          value={summary.trusted_sensors}
          subvalue="Trust score ≥ 90%"
          icon={CheckCircle}
          variant="emerald"
        />

        <StatusCard
          title="Suspicious Sensors"
          value={summary.suspicious_sensors}
          subvalue="Trust score < 60%"
          icon={AlertTriangle}
          variant={summary.suspicious_sensors > 0 ? 'rose' : 'purple'}
        />

        <StatusCard
          title="Active Alerts"
          value={summary.active_alerts_count}
          subvalue="Explainable security notices"
          icon={ShieldAlert}
          variant={summary.active_alerts_count > 0 ? 'rose' : 'amber'}
        />
      </div>

      {/* Sensor Isolated Mitigation Notice Banner */}
      {isolatedSensors.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/50 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <ShieldX className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200 text-sm">
                Sensor Isolation Active ({isolatedSensors.map((s) => s.name).join(', ')})
              </h4>
              <p className="text-xs text-slate-300">
                Sensor isolated. Trusted sensors continue supporting the system without compromised telemetry contamination.
              </p>
            </div>
          </div>
          <button
            onClick={() => onResetSensor(isolatedSensors[0].id)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 transition"
          >
            Reset Sensor
          </button>
        </div>
      )}

      {/* Real-Time Sensor Graph */}
      <LiveTelemetryChart
        sensors={sensors}
        selectedSensorId={selectedChartSensor}
        onSelectSensor={setSelectedChartSensor}
      />

      {/* 6 Core Sensor Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-base">
              Core Telemetry Nodes
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ({sensorKeys.length} physically coupled channels)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Click "Inspect" for 5-layer anomaly decomposition
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensorKeys.map((sid) => (
            <SensorCard
              key={sid}
              sensor={sensors[sid]}
              onInspect={onInspectSensor}
              onIsolate={onIsolate}
              onDownweight={onDownweight}
              onReset={onResetSensor}
            />
          ))}
        </div>
      </div>

      {/* Recent Alerts Feed Table */}
      <div className="p-5 rounded-2xl bg-[#0e1524]/90 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-base">
              Recent Integrity Alerts & Explainable Root Causes
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {alerts.length} alerts on record
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-200">
              All Sensors Operating With High Integrity
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Zero active integrity breaches or multi-sensor voting conflicts detected.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((alt) => (
              <div
                key={alt.id || alt.alert_id}
                onClick={() => onInspectAlert(alt)}
                className="group p-3.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      alt.severity === 'CRITICAL' ? 'bg-rose-500 glow-rose' : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-xs md:text-sm">
                        {alt.sensor_name} ({alt.sensor_id})
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          alt.severity === 'CRITICAL'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {alt.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {alt.alert_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 mt-1 group-hover:text-cyan-200 transition">
                      "{alt.reason}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-400">Trust Score</div>
                    <div
                      className={`font-bold ${
                        alt.trust_score < 30 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {alt.trust_score}%
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition">
                    <span>Inspect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
