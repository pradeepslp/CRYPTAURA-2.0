"""
Layer 1: Cross-Sensor Correlation Engine for SENTINEX.
Detects sensor anomalies by comparing multi-sensor physical co-variances
and detecting when an individual sensor breaks consensus with its physical cluster.
"""

from typing import Dict, Any, Tuple
from backend.config import SENSOR_DEFINITIONS

class CrossSensorCorrelationDetector:
    def __init__(self):
        pass

    def evaluate(self, current_readings: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
        """
        Evaluates cross-sensor correlation for all sensors.
        Returns a dict mapping sensor_id to:
        {
            "score": float (0.0 normal -> 1.0 anomalous),
            "flagged": bool,
            "explanation": str,
            "peers_checked": List[str]
        }
        """
        results = {}

        # First compute normalized deviations from baseline for all sensors
        normalized_deviations = {}
        for sid, cfg in SENSOR_DEFINITIONS.items():
            val = current_readings.get(sid, cfg["baseline"])
            base = cfg["baseline"]
            span = max(0.1, cfg["max_normal"] - cfg["min_normal"])
            norm_dev = (val - base) / span  # ~ -0.5 to +0.5 is normal
            normalized_deviations[sid] = norm_dev

        # Average fleet-wide movement
        fleet_avg = sum(normalized_deviations.values()) / len(normalized_deviations)

        for sid, cfg in SENSOR_DEFINITIONS.items():
            my_dev = normalized_deviations[sid]
            corr_peers = cfg.get("correlated_with", [])
            anomaly_signals = []

            # 1. Peer-specific physical correlation checks
            if sid == "VIBR_01" and "RPM_01" in current_readings:
                # RPM vs Vibration: Higher RPM must have proportionally higher vibration
                rpm_dev = normalized_deviations["RPM_01"]
                disagreement = abs(my_dev - rpm_dev)
                if disagreement > 1.2:
                    anomaly_signals.append((min(1.0, disagreement / 2.0), f"Vibration deviates from mechanical RPM coupling (gap: {disagreement:.2f})"))

            elif sid == "TEMP_01" and "PRES_01" in current_readings:
                # Temperature vs Pressure: Thermal-hydraulic coupling
                pres_dev = normalized_deviations["PRES_01"]
                disagreement = abs(my_dev - pres_dev)
                if disagreement > 1.3:
                    anomaly_signals.append((min(1.0, disagreement / 2.2), f"Thermal reading contradicts hydraulic pressure baseline (gap: {disagreement:.2f})"))

            elif sid == "RPM_01":
                # RPM correlates with both Vibration and Temp
                vibr_dev = normalized_deviations.get("VIBR_01", 0)
                temp_dev = normalized_deviations.get("TEMP_01", 0)
                disagree_vibr = abs(my_dev - vibr_dev)
                disagree_temp = abs(my_dev - temp_dev)
                if disagree_vibr > 1.2 or disagree_temp > 1.4:
                    score = min(1.0, max(disagree_vibr, disagree_temp) / 2.0)
                    anomaly_signals.append((score, f"RPM contradicts shaft vibration and core temperature telemetry"))

            # 2. General fleet consensus check: sensor departs drastically while peers stay normal
            other_devs = [normalized_deviations[s] for s in SENSOR_DEFINITIONS if s != sid]
            other_avg = sum(other_devs) / len(other_devs)
            peer_disagreement = abs(my_dev - other_avg)
            
            # If peer disagreement is substantial (e.g. injected sensor is far away while others are stable)
            if peer_disagreement > 1.5:
                # Count how many sensors it disagrees with
                disagreeing_count = sum(1 for d in other_devs if abs(my_dev - d) > 1.2)
                score = min(1.0, peer_disagreement / 3.0)
                anomaly_signals.append((score, f"Reading disagrees with {disagreeing_count} independent sensors in system cluster"))

            if anomaly_signals:
                max_score = max(s[0] for s in anomaly_signals)
                best_expl = "; ".join(s[1] for s in anomaly_signals)
                flagged = max_score > 0.35
            else:
                max_score = min(0.15, abs(my_dev) * 0.1)
                flagged = False
                best_expl = "Sensor reading agrees with correlated sensor measurements."

            results[sid] = {
                "score": round(max_score, 3),
                "flagged": flagged,
                "explanation": best_expl,
                "peers_checked": corr_peers or ["Fleet Consensus"],
            }

        return results
