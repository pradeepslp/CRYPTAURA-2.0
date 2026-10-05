import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, Filter, Search, Shield, Clock } from 'lucide-react';
import { fetchSystemLogs } from '../services/api';

export default function SystemLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        log.message.toLowerCase().includes(q) ||
        log.event_type.toLowerCase().includes(q) ||
        (log.sensor_id && log.sensor_id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0e1524]/90 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white">
              System Audit Logs & Security Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological record of attack injections, detection triggers, and mitigation actions.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs message or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 w-52 sm:w-72"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Levels</option>
          <option value="INFO">INFO Only</option>
          <option value="WARNING">WARNING Only</option>
          <option value="CRITICAL">CRITICAL Only</option>
        </select>
      </div>

      {/* Logs Table / Terminal View */}
      <div className="rounded-2xl bg-[#090d16] border border-slate-800 font-mono text-xs overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-slate-300 font-bold">SENTINEX SECURITY AUDIT TERMINAL</span>
          </div>
          <span>{filteredLogs.length} events logged</span>
        </div>

        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-850 p-2">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No audit records found matching query.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isCrit = log.level === 'CRITICAL';
              const isWarn = log.level === 'WARNING';

              let levelBadge = 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
              if (isCrit) levelBadge = 'text-rose-400 bg-rose-950/60 border-rose-800 animate-pulse font-bold';
              else if (isWarn) levelBadge = 'text-amber-400 bg-amber-950/60 border-amber-800';

              return (
                <div
                  key={log.id}
                  className="p-2.5 hover:bg-slate-900/50 rounded-lg transition flex flex-col md:flex-row md:items-start gap-2.5"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {log.timestamp.split('T')[1] || log.timestamp}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${levelBadge}`}
                    >
                      {log.level}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {log.event_type}
                    </span>
                  </div>

                  <div className="flex-1 text-slate-200">
                    {log.sensor_id && (
                      <span className="font-bold text-cyan-300 mr-2">
                        [{log.sensor_id}]
                      </span>
                    )}
                    <span>{log.message}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
