"""
Sensor Simulation Engine for SENTINEX.
Generates realistic, physically-grounded telemetry for 6 core industrial sensors:
1. Temperature (TEMP_01)
2. Pressure (PRES_01)
3. Vibration (VIBR_01)
4. GPS Velocity (GPS_01)
5. Voltage (VOLT_01)
6. RPM (RPM_01)

Features:
- Ornstein-Uhlenbeck / mean-reverting physical simulation with mutual coupling
- Realistic attack injection (FDI, Sudden Spike, Drift, Noise, Freeze/Failure)
- Mitigation states: ACTIVE, DOWN_WEIGHTED, ISOLATED
- 60-point rolling history for immediate plotting and statistical estimation
"""

import math
import random
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.config import SENSOR_DEFINITIONS

class SensorState:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.id = config["id"]
        self.name = config["name"]
        self.unit = config["unit"]
        self.baseline = config["baseline"]
        self.min_normal = config["min_normal"]
        self.max_normal = config["max_normal"]
        self.hard_min = config["hard_min"]
        self.hard_max = config["hard_max"]
        self.noise_std = config["noise_std"]
        self.max_rate_of_change = config["max_rate_of_change"]

        # Current dynamic state
        self.current_value = self.baseline
        self.raw_ground_truth = self.baseline
        self.status = "ACTIVE"  # ACTIVE | DOWN_WEIGHTED | ISOLATED
        self.mitigation_weight = 1.0  # 1.0 (Active), 0.25 (Downweighted), 0.0 (Isolated)

        # Dynamic Trust & Anomaly scores
        self.trust_score = 98.0  # 0 to 100
        self.risk_score = 0.02   # 0 to 1
        self.anomaly_score = 0.02 # 0 to 1
        self.trust_status = "TRUSTED" # TRUSTED | WARNING | SUSPICIOUS | CRITICAL | ISOLATED

        # Attack configuration
        self.attack_active = False
        self.attack_type: Optional[str] = None
        self.attack_target_value: Optional[float] = None
        self.attack_duration: float = 0.0  # 0 means indefinite until stopped
        self.attack_start_time: Optional[float] = None
        self.drift_accumulated: float = 0.0
        self.frozen_value: Optional[float] = None

        # Rolling history of (timestamp_str, value, trust_score, anomaly_score)
        self.history: List[Dict[str, Any]] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "unit": self.unit,
            "current_value": round(self.current_value, 2),
            "baseline": self.baseline,
            "min_normal": self.min_normal,
            "max_normal": self.max_normal,
            "hard_min": self.hard_min,
            "hard_max": self.hard_max,
            "trust_score": round(self.trust_score, 1),
            "risk_score": round(self.risk_score, 3),
            "anomaly_score": round(self.anomaly_score, 3),
            "status": self.status,
            "trust_status": "ISOLATED" if self.status == "ISOLATED" else self.trust_status,
            "attack_active": self.attack_active,
            "attack_type": self.attack_type,
            "mitigation_weight": self.mitigation_weight,
            "history": self.history[-30:],  # Last 30 points for cards
        }

class SensorSimulator:
    def __init__(self):
        self.sensors: Dict[str, SensorState] = {
            sid: SensorState(cfg) for sid, cfg in SENSOR_DEFINITIONS.items()
        }
        self.global_step = 0
        self.system_load_phase = 0.0
        self._seed_initial_history()

    def _seed_initial_history(self):
        """Generate 30 points of realistic historical data so dashboard is populated immediately."""
        now = time.time()
        for i in range(30, 0, -1):
            t_offset = now - i * 1.5
            iso_time = datetime.fromtimestamp(t_offset).strftime("%H:%M:%S")
            self.system_load_phase += 0.12

            # Global gentle industrial fluctuation cycle
            load_factor = math.sin(self.system_load_phase) * 0.02

            for sensor in self.sensors.values():
                val = sensor.baseline * (1.0 + load_factor) + random.gauss(0, sensor.noise_std)
                # Keep within normal
                val = max(sensor.min_normal + 0.1, min(sensor.max_normal - 0.1, val))
                sensor.current_value = round(val, 2)
                sensor.raw_ground_truth = sensor.current_value
                sensor.history.append({
                    "timestamp": iso_time,
                    "value": sensor.current_value,
                    "trust_score": round(random.uniform(97.0, 99.5), 1),
                    "anomaly_score": round(random.uniform(0.01, 0.04), 3),
                })

    def tick(self) -> Dict[str, SensorState]:
        """Advance simulation by 1 time step."""
        self.global_step += 1
        now = time.time()
        iso_time = datetime.now().strftime("%H:%M:%S")

        # System cyclic load (e.g. turbine slight acceleration / hydraulic pulse)
        self.system_load_phase += 0.08
        load_variation = math.sin(self.system_load_phase) * 0.015

        # 1. Update true physics readings first (correlated baseline)
        rpm_state = self.sensors["RPM_01"]
        base_rpm = rpm_state.baseline * (1.0 + load_variation * 1.5) + random.gauss(0, rpm_state.noise_std)
        rpm_state.raw_ground_truth = base_rpm

        # Vibration strongly correlates with RPM mechanical load
        vibr_ratio = (base_rpm - rpm_state.baseline) / rpm_state.baseline
        vibr_state = self.sensors["VIBR_01"]
        vibr_state.raw_ground_truth = vibr_state.baseline * (1.0 + vibr_ratio * 1.2) + random.gauss(0, vibr_state.noise_std)

        # Temp slowly follows thermal cycle
        temp_state = self.sensors["TEMP_01"]
        temp_state.raw_ground_truth = temp_state.baseline * (1.0 + load_variation * 0.8) + random.gauss(0, temp_state.noise_std)

        # Pressure follows temp + hydraulic minor fluctuations
        pres_state = self.sensors["PRES_01"]
        pres_state.raw_ground_truth = pres_state.baseline * (1.0 + load_variation * 0.7) + random.gauss(0, pres_state.noise_std)

        # GPS velocity follows vehicle/turbine linear movement
        gps_state = self.sensors["GPS_01"]
        gps_state.raw_ground_truth = gps_state.baseline * (1.0 + load_variation * 0.5) + random.gauss(0, gps_state.noise_std)

        # Voltage has independent small regulated power supply noise
        volt_state = self.sensors["VOLT_01"]
        volt_state.raw_ground_truth = volt_state.baseline + random.gauss(0, volt_state.noise_std)

        # 2. Apply Attack Injection or Normal Observation
        for sid, s in self.sensors.items():
            # Check duration expiry
            if s.attack_active and s.attack_duration > 0 and s.attack_start_time:
                if now - s.attack_start_time >= s.attack_duration:
                    s.attack_active = False
                    s.attack_type = None
                    s.drift_accumulated = 0.0
                    s.frozen_value = None

            if not s.attack_active:
                # Normal behavior: observed value equals physical truth
                s.current_value = s.raw_ground_truth
                s.drift_accumulated = 0.0
                s.frozen_value = None
            else:
                # Attack is active!
                atype = s.attack_type
                if atype == "False Data Injection":
                    # Forces reading directly to injected target value with slight deceptive noise
                    target = s.attack_target_value if s.attack_target_value is not None else (s.baseline * 1.6)
                    s.current_value = target + random.gauss(0, s.noise_std * 0.3)

                elif atype == "Sudden Value Manipulation":
                    # Sudden sharp spike/drop
                    target = s.attack_target_value if s.attack_target_value is not None else (s.baseline * 1.8)
                    s.current_value = target + random.gauss(0, s.noise_std * 0.5)

                elif atype == "Sensor Drift":
                    # Creeping drift bias
                    drift_step = (s.attack_target_value if s.attack_target_value else 1.2) * 0.4
                    s.drift_accumulated += drift_step
                    s.current_value = s.raw_ground_truth + s.drift_accumulated

                elif atype == "Noise Injection":
                    # Chaotic noise with huge standard deviation (5x - 10x normal noise)
                    noise_mag = s.noise_std * 8.0
                    s.current_value = s.raw_ground_truth + random.gauss(0, noise_mag)

                elif atype == "Sensor Failure":
                    # Flatline freeze or drop to 0
                    if s.frozen_value is None:
                        # Freeze at current value or zero
                        if s.attack_target_value is not None and s.attack_target_value == 0:
                            s.frozen_value = 0.0
                        else:
                            s.frozen_value = s.current_value
                    s.current_value = s.frozen_value

                else:
                    # Generic override
                    s.current_value = s.attack_target_value or (s.baseline * 1.5)

        return self.sensors

    def start_attack(
        self,
        sensor_id: str,
        attack_type: str,
        target_value: Optional[float] = None,
        duration: float = 0.0
    ) -> bool:
        if sensor_id not in self.sensors:
            return False
        s = self.sensors[sensor_id]
        s.attack_active = True
        s.attack_type = attack_type
        s.attack_target_value = target_value
        s.attack_duration = duration
        s.attack_start_time = time.time()
        s.drift_accumulated = 0.0
        s.frozen_value = None
        return True

    def stop_attack(self, sensor_id: str) -> bool:
        if sensor_id not in self.sensors:
            return False
        s = self.sensors[sensor_id]
        s.attack_active = False
        s.attack_type = None
        s.attack_target_value = None
        s.attack_duration = 0.0
        s.attack_start_time = None
        s.drift_accumulated = 0.0
        s.frozen_value = None
        return True

    def isolate_sensor(self, sensor_id: str) -> bool:
        if sensor_id not in self.sensors:
            return False
        s = self.sensors[sensor_id]
        s.status = "ISOLATED"
        s.mitigation_weight = 0.0
        return True

    def downweight_sensor(self, sensor_id: str) -> bool:
        if sensor_id not in self.sensors:
            return False
        s = self.sensors[sensor_id]
        s.status = "DOWN_WEIGHTED"
        s.mitigation_weight = 0.25
        return True

    def reset_sensor(self, sensor_id: str) -> bool:
        if sensor_id not in self.sensors:
            return False
        s = self.sensors[sensor_id]
        s.attack_active = False
        s.attack_type = None
        s.status = "ACTIVE"
        s.mitigation_weight = 1.0
        s.drift_accumulated = 0.0
        s.frozen_value = None
        # Gradual recovery will raise trust back to 95+
        return True

    def reset_all(self):
        for s in self.sensors.values():
            s.attack_active = False
            s.attack_type = None
            s.status = "ACTIVE"
            s.mitigation_weight = 1.0
            s.drift_accumulated = 0.0
            s.frozen_value = None
            s.trust_score = 98.0
            s.anomaly_score = 0.02
            s.risk_score = 0.02
            s.trust_status = "TRUSTED"
