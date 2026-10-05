import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getWsUrl,
  fetchAllSensors,
  fetchSystemStatus,
  startAttackApi,
  stopAttackApi,
  isolateSensorApi,
  downweightSensorApi,
  resetSensorApi,
  resetSystemApi,
  startDemoApi,
  stopDemoApi,
} from '../services/api';

export function useTelemetry(addToast) {
  const [sensors, setSensors] = useState({});
  const [systemStatus, setSystemStatus] = useState('SECURE');
  const [summary, setSummary] = useState({
    active_sensors: 6,
    trusted_sensors: 6,
    suspicious_sensors: 0,
    isolated_sensors: 0,
    active_alerts_count: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [demoState, setDemoState] = useState({
    is_running: false,
    current_step: 0,
    total_steps: 7,
    step_name: 'IDLE',
    step_description: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isWebSocket, setIsWebSocket] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);
  const pollTimerRef = useRef(null);
  const prevStatusRef = useRef('SECURE');

  // Process unified telemetry packet
  const handleTelemetryData = useCallback((data, demo) => {
    if (!data) return;

    if (data.sensors) {
      setSensors(data.sensors);
    }
    if (data.system_status) {
      // Trigger notification if status escalated
      if (prevStatusRef.current !== data.system_status) {
        if (data.system_status === 'CRITICAL' && addToast) {
          addToast('CRITICAL ALERT: System integrity compromised!', 'danger');
        } else if (data.system_status === 'WARNING' && prevStatusRef.current === 'SECURE' && addToast) {
          addToast('System Warning: Sensor anomalies detected.', 'warning');
        } else if (data.system_status === 'SECURE' && prevStatusRef.current !== 'SECURE' && addToast) {
          addToast('System Secure: All sensor telemetry verified trusted.', 'success');
        }
        prevStatusRef.current = data.system_status;
      }
      setSystemStatus(data.system_status);
    }

    setSummary({
      active_sensors: data.active_sensors ?? 6,
      trusted_sensors: data.trusted_sensors ?? 6,
      suspicious_sensors: data.suspicious_sensors ?? 0,
      isolated_sensors: data.isolated_sensors ?? 0,
      active_alerts_count: data.active_alerts_count ?? (data.alerts ? data.alerts.length : 0),
    });

    if (data.alerts) {
      setAlerts(data.alerts);
    }

    if (demo) {
      setDemoState(demo);
    }

    setLastUpdated(data.timestamp || new Date().toLocaleTimeString());
    setLoading(false);
  }, [addToast]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    setIsWebSocket(false);
    console.log('[Telemetry] Activating HTTP polling fallback...');

    const poll = async () => {
      try {
        const [sensorData, statusData] = await Promise.all([
          fetchAllSensors(),
          fetchSystemStatus(),
        ]);
        handleTelemetryData({
          ...statusData,
          sensors: sensorData.sensors,
        }, statusData.demo);
        setIsConnected(true);
      } catch (err) {
        console.warn('[Telemetry] Polling error:', err);
        setIsConnected(false);
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 1500);
  }, [handleTelemetryData]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // WebSocket lifecycle
  useEffect(() => {
    let reconnectTimeout = null;
    let isUnmounted = false;

    const connectWebSocket = () => {
      try {
        const url = getWsUrl();
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          console.log('[Telemetry] WebSocket connected successfully');
          setIsConnected(true);
          setIsWebSocket(true);
          stopPolling();
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'TELEMETRY_UPDATE' || payload.type === 'INITIAL_STATE') {
              handleTelemetryData(payload.data, payload.demo);
            }
          } catch (e) {
            console.error('[Telemetry] Error parsing WS message:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[Telemetry] WebSocket error:', err);
          startPolling();
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          console.warn('[Telemetry] WebSocket closed. Retrying in 3s...');
          setIsWebSocket(false);
          startPolling();
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error('[Telemetry] Failed to initialize WebSocket:', err);
        startPolling();
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
      stopPolling();
    };
  }, [handleTelemetryData, startPolling, stopPolling]);

  // Actions
  const injectAttack = async (sensorId, attackType, targetValue, duration) => {
    try {
      const res = await startAttackApi({
        sensor_id: sensorId,
        attack_type: attackType,
        target_value: targetValue !== '' && targetValue !== undefined ? Number(targetValue) : null,
        duration: duration ? Number(duration) : 0,
      });
      if (addToast) addToast(`Injected [${attackType}] on ${sensorId}`, 'warning');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to inject attack', 'danger');
      throw err;
    }
  };

  const stopAttack = async (sensorId) => {
    try {
      const res = await stopAttackApi(sensorId);
      if (addToast) addToast(`Stopped attack on ${sensorId}`, 'info');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to stop attack', 'danger');
      throw err;
    }
  };

  const isolate = async (sensorId) => {
    try {
      const res = await isolateSensorApi(sensorId);
      if (addToast) addToast(`Sensor ${sensorId} ISOLATED from voting loop`, 'danger');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to isolate sensor', 'danger');
      throw err;
    }
  };

  const downweight = async (sensorId) => {
    try {
      const res = await downweightSensorApi(sensorId);
      if (addToast) addToast(`Sensor ${sensorId} contribution down-weighted to 25%`, 'warning');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to downweight sensor', 'danger');
      throw err;
    }
  };

  const resetSensor = async (sensorId) => {
    try {
      const res = await resetSensorApi(sensorId);
      if (addToast) addToast(`Sensor ${sensorId} reset to normal operation`, 'success');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to reset sensor', 'danger');
      throw err;
    }
  };

  const resetAll = async () => {
    try {
      const res = await resetSystemApi();
      if (addToast) addToast('Global system reset completed. Baseline restored.', 'success');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to reset system', 'danger');
      throw err;
    }
  };

  const startDemo = async () => {
    try {
      const res = await startDemoApi();
      if (addToast) addToast('Automated 7-stage demonstration started!', 'info');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to start demo', 'danger');
      throw err;
    }
  };

  const stopDemo = async () => {
    try {
      const res = await stopDemoApi();
      if (addToast) addToast('Automated demo halted.', 'info');
      return res;
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to stop demo', 'danger');
      throw err;
    }
  };

  return {
    sensors,
    systemStatus,
    summary,
    alerts,
    demoState,
    isConnected,
    isWebSocket,
    lastUpdated,
    loading,
    injectAttack,
    stopAttack,
    isolate,
    downweight,
    resetSensor,
    resetAll,
    startDemo,
    stopDemo,
  };
}
