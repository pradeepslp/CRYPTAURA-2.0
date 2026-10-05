import React, { useState, useCallback } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import DemoProgressBar from './components/DemoProgressBar';
import SensorDetailModal from './components/SensorDetailModal';
import AlertDetailModal from './components/AlertDetailModal';

import DashboardView from './views/DashboardView';
import SensorsView from './views/SensorsView';
import AttackSimulatorView from './views/AttackSimulatorView';
import AlertsView from './views/AlertsView';
import SystemLogsView from './views/SystemLogsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [inspectedSensor, setInspectedSensor] = useState(null);
  const [inspectedAlert, setInspectedAlert] = useState(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Telemetry stream & mitigation controls hook
  const {
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
  } = useTelemetry(addToast);

  // Keep inspected sensor updated with live stream
  const activeInspectedSensor = inspectedSensor ? sensors[inspectedSensor.id] || inspectedSensor : null;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Navbar */}
      <Navbar
        systemStatus={systemStatus}
        isConnected={isConnected}
        isWebSocket={isWebSocket}
        lastUpdated={lastUpdated}
        demoState={demoState}
        onStartDemo={startDemo}
        onStopDemo={stopDemo}
        onResetSystem={resetAll}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1920px] mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setTab={setCurrentTab}
          activeAlertsCount={summary.active_alerts_count}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {/* Demo Stepper Banner */}
          <DemoProgressBar demoState={demoState} onStopDemo={stopDemo} />

          {/* Active View */}
          {currentTab === 'dashboard' && (
            <DashboardView
              sensors={sensors}
              systemStatus={systemStatus}
              summary={summary}
              alerts={alerts}
              onInspectSensor={setInspectedSensor}
              onInspectAlert={setInspectedAlert}
              onIsolate={isolate}
              onDownweight={downweight}
              onResetSensor={resetSensor}
            />
          )}

          {currentTab === 'sensors' && (
            <SensorsView
              sensors={sensors}
              onInspectSensor={setInspectedSensor}
              onIsolate={isolate}
              onDownweight={downweight}
              onResetSensor={resetSensor}
            />
          )}

          {currentTab === 'attack-simulator' && (
            <AttackSimulatorView
              sensors={sensors}
              onInjectAttack={injectAttack}
              onStopAttack={stopAttack}
              onResetSystem={resetAll}
              onInspectSensor={setInspectedSensor}
              onIsolate={isolate}
              onDownweight={downweight}
              onResetSensor={resetSensor}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsView
              onInspectAlert={setInspectedAlert}
              onIsolate={isolate}
              onDownweight={downweight}
              onResetSensor={resetSensor}
            />
          )}

          {currentTab === 'logs' && <SystemLogsView />}
        </main>
      </div>

      {/* Sensor Deep Dive Modal */}
      {activeInspectedSensor && (
        <SensorDetailModal
          sensor={activeInspectedSensor}
          onClose={() => setInspectedSensor(null)}
          onIsolate={isolate}
          onDownweight={downweight}
          onReset={resetSensor}
        />
      )}

      {/* Explainable Alert Modal */}
      {inspectedAlert && (
        <AlertDetailModal
          alert={inspectedAlert}
          onClose={() => setInspectedAlert(null)}
          onIsolate={isolate}
          onDownweight={downweight}
          onReset={resetSensor}
        />
      )}

      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
