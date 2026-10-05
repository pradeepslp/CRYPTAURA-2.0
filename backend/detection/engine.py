"""
Central Multi-Layer Detection & Trust Score Engine for SENTINEX.
Combines:
1. Cross-Sensor Correlation
2. Statistical Detection (Z-score, moving avg, variance)
3. Physics / Rule Consistency (operating limits, slew rate)
4. ML IsolationForest
5. Temporal Persistence Analysis

Dynamically computes Trust Scores (0-100), graded states (TRUSTED, WARNING, SUSPICIOUS, CRITICAL),
explainable operator alerts, and handles dynamic trust degradation & gradual recovery.
"""

import time
from typing import Dict, Any, List
from backend.config import SENSOR_DEFINITIONS, DETECTION_WEIGHTS
from backend.detection.correlation import CrossSensorCorrelationDetector
from backend.detection.statistical import StatisticalDetector
from backend.detection.physics import PhysicsRuleDetector
from backend.detection.ml_detector import MLIsolationForestDetector
from backend.detection.temporal import TemporalAnomalyDetector
from backend.database import save_alert, resolve_alerts_for_sensor

class DetectionEngine:
    def __init__(self):
        self.correlation_detector = CrossSensorCorrelationDetector()
        self.statistical_detector = StatisticalDetector(window_size=30)
        self.physics_detector = PhysicsRuleDetector()
        self.ml_detector = MLIsolationForestDetector()
        self.temporal_detector = TemporalAnomalyDetector()
        self.last_tick_time = time.time()
        self.sensor_layers_cache: Dict[str, Dict[str, Any]] = {}

    def process_telemetry(self, sensors: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes full multi-layer detection pipeline on all active sensors.
        Returns detailed system status and per-sensor detection evidence.
        """
        now = time.time()
        dt = max(0.5, now - self.last_tick_time)
        self.last_tick_time = now

        readings = {sid: s.current_value for sid, s in sensors.items()}

        # 1. Run Layer 1: Cross-Sensor Correlation
        corr_results = self.correlation_detector.evaluate(readings)

        # 2. Run Layer 4: ML IsolationForest
        ml_results = self.ml_detector.evaluate_multi(readings)

        processed_sensors = {}
        active_alerts = []

        for sid, s in sensors.items():
            cfg = SENSOR_DEFINITIONS[sid]
            val = s.current_value

            # Layer 2: Statistical
            stat_res = self.statistical_detector.update_and_evaluate(sid, val)

            # Layer 3: Physics & Rules
            phys_res = self.physics_detector.evaluate(sid, val, dt)

            # Layer 1 result for this sensor
            corr_res = corr_results.get(sid, {"score": 0.0, "flagged": False, "explanation": "Normal"})

            # Layer 4 result for this sensor
            ml_res = ml_results.get(sid, {"score": 0.0, "flagged": False, "explanation": "Normal"})

            # Check if any instantaneous layer detected anomaly
            instant_flagged = (
                phys_res["score"] > 0.35 or
                stat_res["score"] > 0.35 or
                corr_res["score"] > 0.35 or
                ml_res["score"] > 0.35 or
                s.attack_active
            )

            # Layer 5: Temporal
            temp_res = self.temporal_detector.evaluate(sid, instant_flagged)

            # Compute Composite Risk Score (Weighted sum + max-boost)
            weights = DETECTION_WEIGHTS
            weighted_risk = (
                corr_res["score"] * weights["cross_correlation"] +
                stat_res["score"] * weights["statistical"] +
                phys_res["score"] * weights["physics"] +
                ml_res["score"] * weights["ml_isolation_forest"] +
                temp_res["score"] * weights["temporal"]
            )

            # If severe physics violation or extreme correlation break, amplify risk
            max_single_layer = max(corr_res["score"], stat_res["score"], phys_res["score"], ml_res["score"])
            final_risk = min(1.0, max(weighted_risk, max_single_layer * 0.85))

            # If persistent temporal anomaly, multiply risk
            if temp_res["is_persistent"]:
                final_risk = min(1.0, final_risk * 1.35)

            # If explicit attack is active, guarantee high risk
            if s.attack_active:
                final_risk = max(final_risk, 0.85)

            s.risk_score = round(final_risk, 3)
            s.anomaly_score = round(final_risk, 3)

            # Dynamic Trust Score Evolution
            # Drop when risk is high, Recover gradually when normal
            if final_risk > 0.30:
                drop_rate = 14.0 + (final_risk ** 1.5) * 35.0
                if temp_res["is_persistent"] or s.attack_active:
                    drop_rate += 18.0
                s.trust_score = max(5.0, s.trust_score - drop_rate)
            else:
                # Gradual recovery: when normal, trust score recovers +3.5 per tick
                if s.trust_score < 98.5:
                    s.trust_score = min(99.0, s.trust_score + 3.5)

            s.trust_score = round(s.trust_score, 1)

            # Categorize Trust Status
            if s.status == "ISOLATED":
                s.trust_status = "ISOLATED"
            elif s.trust_score >= 90:
                s.trust_status = "TRUSTED"
            elif s.trust_score >= 60:
                s.trust_status = "WARNING"
            elif s.trust_score >= 30:
                s.trust_status = "SUSPICIOUS"
            else:
                s.trust_status = "CRITICAL"

            # Cache layer breakdown for inspection
            layer_breakdown = {
                "cross_correlation": corr_res,
                "statistical": stat_res,
                "physics": phys_res,
                "ml_isolation_forest": ml_res,
                "temporal": temp_res,
            }
            self.sensor_layers_cache[sid] = layer_breakdown

            # Update rolling history
            iso_time = time.strftime("%H:%M:%S")
            s.history.append({
                "timestamp": iso_time,
                "value": round(s.current_value, 2),
                "trust_score": s.trust_score,
                "anomaly_score": s.anomaly_score,
            })
            if len(s.history) > 40:
                s.history.pop(0)

            # Alert Generation Logic
            # Trigger alert when trust drops below 70 or risk is high or attack active
            if s.status != "ISOLATED" and (s.trust_score < 70.0 or final_risk > 0.45 or s.attack_active):
                severity = "CRITICAL" if (s.trust_score < 40.0 or final_risk > 0.65 or s.attack_active) else "WARNING"
                triggered_methods = []
                explanations = []

                if corr_res["flagged"]:
                    triggered_methods.append("Cross-Sensor Correlation")
                    explanations.append(corr_res["explanation"])
                if stat_res["flagged"]:
                    triggered_methods.append("Statistical Detection")
                    explanations.append(stat_res["explanation"])
                if phys_res["flagged"]:
                    triggered_methods.append("Physics/Rule Consistency")
                    explanations.append(phys_res["explanation"])
                if ml_res["flagged"]:
                    triggered_methods.append("ML IsolationForest")
                    explanations.append(ml_res["explanation"])
                if temp_res["flagged"]:
                    triggered_methods.append("Temporal Analysis")
                    explanations.append(temp_res["explanation"])

                if not triggered_methods:
                    triggered_methods.append("Composite Multi-Layer Risk")
                    explanations.append(f"Composite risk metric reached elevated threshold ({final_risk:.2f}).")

                # Compose Explainable natural language reason
                dur_text = f" for {temp_res['duration_seconds']}s" if temp_res['duration_seconds'] > 0 else ""
                combined_reason = f"{s.name} ({sid}) is suspicious because its reading ({round(s.current_value, 1)} {s.unit}) " + "; ".join(explanations) + dur_text + "."

                recommended_action = (
                    "IMMEDIATE ACTION REQUIRED: Isolate sensor from critical voting loop to prevent telemetry poisoning."
                    if severity == "CRITICAL" else
                    "Down-weight sensor contribution and monitor physical correlation across adjacent nodes."
                )

                alert_id = f"ALT-{sid}-{int(time.time()) // 10}"
                alert_data = save_alert(
                    alert_id=alert_id,
                    sensor_id=sid,
                    sensor_name=s.name,
                    severity=severity,
                    current_value=round(s.current_value, 2),
                    trust_score=s.trust_score,
                    anomaly_score=s.anomaly_score,
                    detection_methods=triggered_methods,
                    reason=combined_reason,
                    recommended_action=recommended_action,
                    status="ACTIVE"
                )
                active_alerts.append(alert_data)

            elif s.trust_score >= 88.0 and not s.attack_active:
                # Sensor is healthy again -> resolve any active alerts
                resolve_alerts_for_sensor(sid, "Sensor returned to normal operational limits and regained high trust score.")

            processed_sensors[sid] = s.to_dict()
            processed_sensors[sid]["layers"] = layer_breakdown

        # System Status Logic
        has_critical = any(
            (s.trust_score < 60.0 and s.status != "ISOLATED") or s.attack_active
            for s in sensors.values()
        )
        has_warning = any(
            (60.0 <= s.trust_score < 90.0 and s.status != "ISOLATED")
            for s in sensors.values()
        )

        if has_critical:
            system_status = "CRITICAL"
        elif has_warning:
            system_status = "WARNING"
        else:
            system_status = "SECURE"

        trusted_count = sum(1 for s in sensors.values() if s.trust_score >= 90.0 and s.status != "ISOLATED")
        suspicious_count = sum(1 for s in sensors.values() if s.trust_score < 60.0 and s.status != "ISOLATED")
        active_sensor_count = sum(1 for s in sensors.values() if s.status != "ISOLATED")
        isolated_count = sum(1 for s in sensors.values() if s.status == "ISOLATED")

        return {
            "system_status": system_status,
            "active_sensors": active_sensor_count,
            "trusted_sensors": trusted_count,
            "suspicious_sensors": suspicious_count,
            "isolated_sensors": isolated_count,
            "active_alerts_count": len(active_alerts),
            "alerts": active_alerts,
            "sensors": processed_sensors,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
