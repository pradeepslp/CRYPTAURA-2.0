"""
FastAPI Main Application for SENTINEX - Intelligent Sensor Integrity Engine.
Provides RESTful APIs, WebSocket live telemetry streaming, and mitigation control.
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.config import SENSOR_DEFINITIONS
from backend.database import (
    init_db,
    get_alerts,
    get_system_logs,
    add_system_log,
    record_sensor_event,
)
from backend.sensors.simulator import SensorSimulator
from backend.detection.engine import DetectionEngine
from backend.demo_runner import DemoRunner

# Shared Engine Instances
simulator = SensorSimulator()
detection_engine = DetectionEngine()
demo_runner = DemoRunner(simulator, detection_engine, add_system_log)

# Active WebSocket Connections
connected_clients: List[WebSocket] = []

# Background simulation task reference
sim_task: Optional[asyncio.Task] = None

# Pydantic Request Models
class AttackRequest(BaseModel):
    sensor_id: str
    attack_type: str
    target_value: Optional[float] = None
    duration: Optional[float] = 0.0

class StopAttackRequest(BaseModel):
    sensor_id: str

async def simulation_loop():
    """Continuously advances simulation, runs detection, and broadcasts to WebSockets."""
    while True:
        try:
            # 1. Advance simulation state
            sensors = simulator.tick()

            # 2. Run multi-layer detection & trust calculation
            engine_output = detection_engine.process_telemetry(sensors)

            # 3. Append demo runner state
            demo_status = demo_runner.get_status()
            payload = {
                "type": "TELEMETRY_UPDATE",
                "data": engine_output,
                "demo": demo_status,
            }

            # 4. Broadcast to connected WebSocket clients
            disconnected = []
            for client in connected_clients:
                try:
                    await client.send_text(json.dumps(payload))
                except Exception:
                    disconnected.append(client)

            for d in disconnected:
                if d in connected_clients:
                    connected_clients.remove(d)

            # Record periodic events in SQLite
            if simulator.global_step % 5 == 0:
                for sid, s in sensors.items():
                    record_sensor_event(
                        sensor_id=sid,
                        value=s.current_value,
                        trust_score=s.trust_score,
                        anomaly_score=s.anomaly_score,
                        status=s.status,
                        attack_type=s.attack_type if s.attack_active else None
                    )

        except Exception as e:
            print(f"Error in simulation loop: {e}")

        await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    add_system_log("INFO", "BOOT", "SENTINEX Engine initialized. Baseline loaded.")
    # Start background telemetry generator
    task = asyncio.create_task(simulation_loop())
    yield
    task.cancel()

app = FastAPI(
    title="SENTINEX - Intelligent Sensor Integrity Engine",
    description="Multi-layer sensor integrity detection, dynamic trust scoring, and cyber mitigation engine.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- REST ENDPOINTS -----------------

@app.get("/api/system-status")
def get_system_status():
    """Returns current system health, status, and summary metrics."""
    sensors = simulator.sensors
    output = detection_engine.process_telemetry(sensors)
    return {
        "system_status": output["system_status"],
        "active_sensors": output["active_sensors"],
        "trusted_sensors": output["trusted_sensors"],
        "suspicious_sensors": output["suspicious_sensors"],
        "isolated_sensors": output["isolated_sensors"],
        "active_alerts_count": output["active_alerts_count"],
        "timestamp": output["timestamp"],
        "demo": demo_runner.get_status(),
    }

@app.get("/api/sensors")
def get_all_sensors():
    """Returns real-time states and metrics for all 6 sensors."""
    sensors = simulator.sensors
    output = detection_engine.process_telemetry(sensors)
    return {
        "sensors": output["sensors"],
        "system_status": output["system_status"],
        "timestamp": output["timestamp"]
    }

@app.get("/api/sensors/{sensor_id}")
def get_sensor_details(sensor_id: str):
    """Returns detailed telemetry, 5-layer detection breakdown, and history for a sensor."""
    if sensor_id not in simulator.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")
    
    s = simulator.sensors[sensor_id]
    layers = detection_engine.sensor_layers_cache.get(sensor_id, {})
    recent_alerts = get_alerts(sensor_id=sensor_id, limit=5)

    data = s.to_dict()
    data["layers"] = layers
    data["recent_alerts"] = recent_alerts
    data["correlated_with"] = s.config.get("correlated_with", [])
    data["description"] = s.config.get("description", "")
    data["noise_std"] = s.config.get("noise_std", 0.0)
    data["max_rate_of_change"] = s.config.get("max_rate_of_change", 0.0)
    return data

@app.get("/api/alerts")
def get_all_alerts(
    severity: Optional[str] = Query(None),
    sensor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50)
):
    """Returns explainable alerts filtered by severity, sensor_id, or resolution status."""
    return get_alerts(severity=severity, sensor_id=sensor_id, status=status, limit=limit)

@app.get("/api/logs")
def get_logs(limit: int = Query(60)):
    """Returns security audit trail and system operational logs."""
    return get_system_logs(limit=limit)

@app.post("/api/attack/start")
def start_attack(req: AttackRequest):
    """Injects a cyber or sensor attack on the designated sensor."""
    if req.sensor_id not in simulator.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    success = simulator.start_attack(
        sensor_id=req.sensor_id,
        attack_type=req.attack_type,
        target_value=req.target_value,
        duration=req.duration or 0.0
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to inject attack")

    sname = simulator.sensors[req.sensor_id].name
    add_system_log(
        level="WARNING",
        event_type="ATTACK_INJECTED",
        message=f"Attack [{req.attack_type}] injected on {sname} ({req.sensor_id}) with target {req.target_value}.",
        sensor_id=req.sensor_id,
        details={"attack_type": req.attack_type, "target_value": req.target_value, "duration": req.duration}
    )
    return {"message": "Attack injected successfully", "sensor_id": req.sensor_id, "attack_type": req.attack_type}

@app.post("/api/attack/stop")
def stop_attack(req: StopAttackRequest):
    """Halts active attack on the specified sensor."""
    if req.sensor_id not in simulator.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    simulator.stop_attack(req.sensor_id)
    add_system_log(
        level="INFO",
        event_type="ATTACK_STOPPED",
        message=f"Attack stopped on {req.sensor_id}.",
        sensor_id=req.sensor_id
    )
    return {"message": "Attack stopped", "sensor_id": req.sensor_id}

@app.post("/api/sensors/{sensor_id}/isolate")
def isolate_sensor_endpoint(sensor_id: str):
    """Mitigation: Completely isolates sensor from critical voting/decision loop."""
    if sensor_id not in simulator.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    simulator.isolate_sensor(sensor_id)
    sname = simulator.sensors[sensor_id].name
    add_system_log(
        level="INFO",
        event_type="MITIGATION_ISOLATION",
        message=f"Sensor {sname} ({sensor_id}) ISOLATED. Trusted sensors continue supporting the system.",
        sensor_id=sensor_id
    )
    return {
        "message": f"Sensor {sname} isolated. Trusted sensors continue supporting the system.",
        "sensor_id": sensor_id,
        "status": "ISOLATED"
    }

@app.post("/api/sensors/{sensor_id}/downweight")
def downweight_sensor_endpoint(sensor_id: str):
    """Mitigation: Reduces sensor influence (weight=0.25) in decision consensus."""
    if sensor_id not in simulator.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    simulator.downweight_sensor(sensor_id)
    sname = simulator.sensors[sensor_id].name
    add_system_log(
        level="INFO",
        event_type="MITIGATION_DOWNWEIGHT",
        message=f"Sensor {sname} ({sensor_id}) DOWN-WEIGHTED. Contribution reduced to 25%.",
        sensor_id=sensor_id
    )
    return {
        "message": f"Sensor {sname} contribution down-weighted.",
        "sensor_id": sensor_id,
        "status": "DOWN_WEIGHTED"
    }

@app.post("/api/sensors/{sensor_id}/reset")
def reset_sensor_endpoint(sensor_id: str):
    """Restores sensor to normal active observation and triggers gradual trust recovery."""
    if sensor_id not in simulator.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    simulator.reset_sensor(sensor_id)
    sname = simulator.sensors[sensor_id].name
    add_system_log(
        level="INFO",
        event_type="SENSOR_RESET",
        message=f"Sensor {sname} ({sensor_id}) reset to normal operation. Trust score recovering.",
        sensor_id=sensor_id
    )
    return {
        "message": f"Sensor {sname} restored to normal. Trust score will gradually recover.",
        "sensor_id": sensor_id,
        "status": "ACTIVE"
    }

@app.post("/api/system/reset")
def reset_system_endpoint():
    """Resets all sensors and system status to normal baseline."""
    simulator.reset_all()
    from backend.database import clear_all_alerts
    clear_all_alerts()
    add_system_log("INFO", "SYSTEM_RESET", "Global system reset invoked. All sensor states returned to baseline.")
    return {"message": "System successfully reset to normal baseline"}

@app.post("/api/demo/start")
async def start_demo_endpoint():
    """Starts the 7-stage automated demonstration tour."""
    await demo_runner.start()
    return {"message": "Demo mode started", "status": demo_runner.get_status()}

@app.post("/api/demo/stop")
async def stop_demo_endpoint():
    """Stops the demo tour."""
    await demo_runner.stop()
    return {"message": "Demo mode stopped", "status": demo_runner.get_status()}

@app.get("/api/demo/status")
def get_demo_status_endpoint():
    """Returns current stage and details of the demo runner."""
    return demo_runner.get_status()

# ----------------- WEBSOCKET ENDPOINT -----------------

@app.websocket("/ws/sensors")
async def websocket_sensors_endpoint(websocket: WebSocket):
    """Real-time WebSocket connection streaming continuous sensor telemetry."""
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Send immediate initial state
        sensors = simulator.sensors
        output = detection_engine.process_telemetry(sensors)
        await websocket.send_text(json.dumps({
            "type": "INITIAL_STATE",
            "data": output,
            "demo": demo_runner.get_status(),
        }))

        # Keep connection open for incoming control messages or ping/pong
        while True:
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
                if msg.get("action") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
