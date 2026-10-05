/**
 * API Service for SENTINEX
 * Handles REST endpoints and WebSocket URL derivation.
 */

const API_BASE = '/api';

export const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/sensors`;
};

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/system-status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchAllSensors() {
  const res = await fetch(`${API_BASE}/sensors`);
  if (!res.ok) throw new Error('Failed to fetch sensors');
  return res.json();
}

export async function fetchSensorDetails(sensorId) {
  const res = await fetch(`${API_BASE}/sensors/${sensorId}`);
  if (!res.ok) throw new Error(`Failed to fetch sensor ${sensorId}`);
  return res.json();
}

export async function fetchAlerts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.severity) searchParams.append('severity', params.severity);
  if (params.sensorId) searchParams.append('sensor_id', params.sensorId);
  if (params.status) searchParams.append('status', params.status);
  if (params.limit) searchParams.append('limit', params.limit);

  const res = await fetch(`${API_BASE}/alerts?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function fetchSystemLogs(limit = 60) {
  const res = await fetch(`${API_BASE}/logs?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch system logs');
  return res.json();
}

export async function startAttackApi(payload) {
  const res = await fetch(`${API_BASE}/attack/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to inject attack');
  }
  return res.json();
}

export async function stopAttackApi(sensorId) {
  const res = await fetch(`${API_BASE}/attack/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sensor_id: sensorId }),
  });
  if (!res.ok) throw new Error('Failed to stop attack');
  return res.json();
}

export async function isolateSensorApi(sensorId) {
  const res = await fetch(`${API_BASE}/sensors/${sensorId}/isolate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to isolate sensor');
  return res.json();
}

export async function downweightSensorApi(sensorId) {
  const res = await fetch(`${API_BASE}/sensors/${sensorId}/downweight`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to downweight sensor');
  return res.json();
}

export async function resetSensorApi(sensorId) {
  const res = await fetch(`${API_BASE}/sensors/${sensorId}/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset sensor');
  return res.json();
}

export async function resetSystemApi() {
  const res = await fetch(`${API_BASE}/system/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset system');
  return res.json();
}

export async function startDemoApi() {
  const res = await fetch(`${API_BASE}/demo/start`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start demo');
  return res.json();
}

export async function stopDemoApi() {
  const res = await fetch(`${API_BASE}/demo/stop`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to stop demo');
  return res.json();
}
