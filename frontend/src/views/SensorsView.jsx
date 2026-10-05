import React, { useState } from 'react';
import {
  Cpu,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  ShieldX,
  Layers,
  Eye,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import SensorCard from '../components/SensorCard';

export default function SensorsView({
  sensors,
  onInspectSensor,
  onIsolate,
  onDownweight,
  onResetSensor,
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const sensorList = Object.values(sensors || {});

  const filteredSensors = sensorList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ISOLATED') return s.status === 'ISOLATED';
    if (filterStatus === 'DOWN_WEIGHTED') return s.status === 'DOWN_WEIGHTED';
    if (filterStatus === 'TRUSTED') return s.trust_score >= 90 && s.status === 'ACTIVE';
    if (filterStatus === 'WARNING') return s.trust_score >= 60 && s.trust_score < 90 && s.status === 'ACTIVE';
    if (filterStatus === 'SUSPICIOUS') return s.trust_score >= 30 && s.trust_score < 60 && s.status === 'ACTIVE';
    if (filterStatus === 'CRITICAL') return s.trust_score < 30 && s.status === 'ACTIVE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1524]/90 border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Industrial Sensor Fleet</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous cross-correlation, thermodynamic boundary validation, and real-time trust monitoring.
          </p>
        </div>

        {/* Filter buttons and Search bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sensor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 w-36 sm:w-48"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="TRUSTED">Trusted (≥90%)</option>
            <option value="WARNING">Warning (60-89%)</option>
            <option value="SUSPICIOUS">Suspicious (30-59%)</option>
            <option value="CRITICAL">Critical (&lt;30%)</option>
            <option value="ISOLATED">Isolated</option>
            <option value="DOWN_WEIGHTED">Down-Weighted</option>
          </select>

          {/* Grid / Table toggle */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded transition ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition ${
                viewMode === 'table' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              onInspect={onInspectSensor}
              onIsolate={onIsolate}
              onDownweight={onDownweight}
              onReset={onResetSensor}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-[#0e1524]/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sensor Node</th>
                  <th className="py-3 px-4">Live Reading</th>
                  <th className="py-3 px-4">Normal Envelope</th>
                  <th className="py-3 px-4">Trust Score</th>
                  <th className="py-3 px-4">Anomaly Score</th>
                  <th className="py-3 px-4">Mitigation State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredSensors.map((s) => {
                  const isIso = s.status === 'ISOLATED';
                  const trust = s.trust_score;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-900/60 transition cursor-pointer"
                      onClick={() => onInspectSensor(s)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{s.name}</span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {s.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-300 font-bold text-sm">
                        {s.current_value} {s.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {s.min_normal} - {s.max_normal} {s.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isIso
                                ? 'text-slate-400'
                                : trust >= 90
                                ? 'text-emerald-400'
                                : trust >= 60
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {trust}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span
                          className={
                            s.anomaly_score > 0.4 ? 'text-rose-400' : 'text-slate-300'
                          }
                        >
                          {s.anomaly_score.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isIso
                              ? 'bg-slate-800 text-slate-300 border-slate-600'
                              : s.status === 'DOWN_WEIGHTED'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : trust >= 90
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {isIso ? 'ISOLATED' : s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectSensor(s);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-medium transition border border-slate-700"
                        >
                          Decompose
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
