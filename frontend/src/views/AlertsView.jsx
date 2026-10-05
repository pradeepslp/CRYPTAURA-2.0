import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Filter,
  Search,
  Clock,
  Layers,
  ExternalLink,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { fetchAlerts } from '../services/api';

export default function AlertsView({
  onInspectAlert,
  onIsolate,
  onDownweight,
  onResetSensor,
}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL'); // ALL, CRITICAL, WARNING
  const [statusFilter, setStatusFilter] = useState('ALL');     // ALL, ACTIVE, RESOLVED
  const [sensorFilter, setSensorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchAlerts({ limit: 100 });
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (sensorFilter !== 'ALL' && a.sensor_id !== sensorFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.alert_id.toLowerCase().includes(q) ||
        a.sensor_name.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.sensor_id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING' && a.status === 'ACTIVE').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header and Filter Row */}
      <div className="p-5 rounded-2xl bg-[#0e1524]/90 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-extrabold text-white">
              Explainable Anomaly & Integrity Alert Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-sensor inconsistency reports with verifiable diagnostic evidence.
          </p>
        </div>

        {/* Severity Quick Tabs */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-mono">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              severityFilter === 'ALL'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              severityFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-rose-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setSeverityFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              severityFilter === 'WARNING'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-amber-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Warning ({warningCount})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert reason, sensor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 w-44 sm:w-64"
            />
          </div>

          {/* Sensor Filter */}
          <select
            value={sensorFilter}
            onChange={(e) => setSensorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Sensors</option>
            <option value="TEMP_01">Temperature (TEMP_01)</option>
            <option value="PRES_01">Pressure (PRES_01)</option>
            <option value="VIBR_01">Vibration (VIBR_01)</option>
            <option value="GPS_01">GPS Velocity (GPS_01)</option>
            <option value="VOLT_01">Voltage (VOLT_01)</option>
            <option value="RPM_01">RPM (RPM_01)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All States</option>
            <option value="ACTIVE">Active Alerts Only</option>
            <option value="RESOLVED">Resolved Only ({resolvedCount})</option>
          </select>
        </div>

        <button
          onClick={loadAlerts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0e1524]/60 border border-slate-800">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-white">No Matching Alerts</h3>
            <p className="text-xs text-slate-400 mt-1">
              No anomalies found for the selected filter parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isCrit = alt.severity === 'CRITICAL';
            const isRes = alt.status === 'RESOLVED';
            const methods = alt.detection_methods || [];

            return (
              <div
                key={alt.id || alt.alert_id}
                onClick={() => onInspectAlert(alt)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md ${
                  isRes
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
                    : isCrit
                    ? 'bg-[#180a0f]/80 border-rose-500/50 hover:border-rose-400 shadow-rose-950/20'
                    : 'bg-[#181308]/80 border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        isRes
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : isCrit
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {isRes ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : isCrit ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {alt.sensor_name}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {alt.sensor_id}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isRes
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isCrit
                              ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {alt.status === 'RESOLVED' ? 'RESOLVED' : alt.severity}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {alt.alert_id}
                        </span>
                      </div>

                      {/* Explainable Text */}
                      <p className="text-xs text-slate-200 mt-2 font-sans leading-relaxed">
                        "{alt.reason}"
                      </p>

                      {/* Triggered Method Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {methods.map((m, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300"
                          >
                            ✓ {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side telemetry & inspect button */}
                  <div className="flex items-center md:flex-col items-end justify-between md:justify-center gap-2 font-mono shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Current Telemetry
                      </div>
                      <div className="text-sm font-bold text-cyan-300">
                        {alt.current_value}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Trust Score
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          alt.trust_score < 30 ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {alt.trust_score}%
                      </div>
                    </div>
                    <button className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition mt-1">
                      <span>View Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
