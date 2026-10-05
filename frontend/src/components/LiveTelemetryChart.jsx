import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { Activity, Layers, Maximize2 } from 'lucide-react';

export default function LiveTelemetryChart({ sensors, selectedSensorId, onSelectSensor }) {
  const [chartType, setChartType] = useState('single'); // 'single' or 'multi'

  const sensorKeys = Object.keys(sensors || {});
  const activeSensorId = selectedSensorId || (sensorKeys.length > 0 ? sensorKeys[0] : null);
  const activeSensor = sensors[activeSensorId];

  // Colors for multi-sensor visualization
  const sensorColors = {
    TEMP_01: '#06b6d4', // cyan
    PRES_01: '#3b82f6', // blue
    VIBR_01: '#a855f7', // purple
    GPS_01: '#10b981',  // emerald
    VOLT_01: '#f59e0b', // amber
    RPM_01: '#ec4899',  // pink
  };

  // Build chart dataset
  let chartData = [];

  if (chartType === 'single' && activeSensor && activeSensor.history) {
    chartData = activeSensor.history.map((pt) => ({
      timestamp: pt.timestamp,
      value: pt.value,
      trust_score: pt.trust_score,
      anomaly_score: pt.anomaly_score,
    }));
  } else if (chartType === 'multi' && sensorKeys.length > 0) {
    // Merge timestamps across sensors
    const sampleSensor = sensors[sensorKeys[0]];
    const historyLen = sampleSensor?.history?.length || 0;

    for (let i = 0; i < historyLen; i++) {
      const entry = {
        timestamp: sampleSensor.history[i]?.timestamp || `${i}`,
      };
      sensorKeys.forEach((sid) => {
        const s = sensors[sid];
        if (s && s.history && s.history[i]) {
          // Normalize to percentage of baseline so all sensors can be compared on same graph
          const baseline = s.baseline || 1;
          entry[sid] = Number(((s.history[i].value / baseline) * 100).toFixed(1));
          entry[`${sid}_raw`] = s.history[i].value;
        }
      });
      chartData.push(entry);
    }
  }

  // Fallback if data is still generating
  if (chartData.length === 0) {
    chartData = [
      { timestamp: '00:00:00', value: activeSensor?.baseline || 50, trust_score: 98 },
    ];
  }

  return (
    <div className="rounded-2xl bg-[#0e1524]/90 backdrop-blur-md p-5 border border-slate-800 shadow-xl">
      {/* Chart Top Header & Sensor Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm md:text-base flex items-center gap-2">
              <span>Real-Time Sensor Telemetry Stream</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {chartType === 'single'
                ? `Monitoring ${activeSensor?.name || 'Sensor'} with normal operating envelope`
                : 'Comparative multi-sensor telemetry normalized against baseline (%)'}
            </p>
          </div>
        </div>

        {/* View Toggle & Selector */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Single vs Multi Toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setChartType('single')}
              className={`px-2.5 py-1 rounded-md transition ${
                chartType === 'single'
                  ? 'bg-cyan-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Sensor
            </button>
            <button
              onClick={() => setChartType('multi')}
              className={`px-2.5 py-1 rounded-md transition ${
                chartType === 'multi'
                  ? 'bg-cyan-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Normalized
            </button>
          </div>

          {/* Sensor Select Dropdown (for Single view) */}
          {chartType === 'single' && (
            <select
              value={activeSensorId || ''}
              onChange={(e) => onSelectSensor(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {sensorKeys.map((sid) => (
                <option key={sid} value={sid}>
                  {sensors[sid].name} ({sid})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'single' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sensorValueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="timestamp"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(val, name) => [
                  `${val} ${activeSensor?.unit || ''}`,
                  activeSensor?.name || name,
                ]}
              />

              {/* Reference boundaries for Normal Range */}
              {activeSensor && (
                <>
                  <ReferenceLine
                    y={activeSensor.max_normal}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Max Normal: ${activeSensor.max_normal}`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <ReferenceLine
                    y={activeSensor.min_normal}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Min Normal: ${activeSensor.min_normal}`,
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'bottom',
                    }}
                  />
                </>
              )}

              <Area
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#sensorValueGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="timestamp"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                domain={[50, 180]}
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              />
              <ReferenceLine y={100} stroke="#64748b" strokeDasharray="3 3" />
              {sensorKeys.map((sid) => (
                <Line
                  key={sid}
                  type="monotone"
                  dataKey={sid}
                  name={sensors[sid].name}
                  stroke={sensorColors[sid] || '#06b6d4'}
                  strokeWidth={sid === selectedSensorId ? 3 : 1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center flex-wrap gap-4 font-mono text-[11px]">
          {chartType === 'single' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Live Observation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-amber-400 rounded" />
                <span>Upper Normal Limit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-emerald-400 rounded" />
                <span>Lower Normal Limit</span>
              </div>
            </>
          ) : (
            sensorKeys.map((sid) => (
              <div
                key={sid}
                onClick={() => {
                  onSelectSensor(sid);
                  setChartType('single');
                }}
                className="flex items-center gap-1.5 cursor-pointer hover:text-white transition"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: sensorColors[sid] || '#06b6d4' }}
                />
                <span>{sensors[sid].name}</span>
              </div>
            ))
          )}
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Auto-refreshing (1.0s tick)
        </div>
      </div>
    </div>
  );
}
