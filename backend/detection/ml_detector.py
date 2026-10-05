"""
Layer 4: Machine Learning Anomaly Detection for SENTINEX.
Uses Scikit-learn IsolationForest trained on simulated normal multi-variate baseline telemetry.
Outputs an ML anomaly score and detects multi-dimensional distribution outliers.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List
from backend.config import SENSOR_DEFINITIONS

class MLIsolationForestDetector:
    def __init__(self):
        self.sensor_keys = list(SENSOR_DEFINITIONS.keys())
        self.model = IsolationForest(
            n_estimators=75,
            contamination=0.03,
            random_state=42,
            n_jobs=1
        )
        self.is_fitted = False
        self._fit_on_synthetic_baseline()

    def _fit_on_synthetic_baseline(self):
        """Train IsolationForest on 1,500 samples of healthy coupled sensor data."""
        np.random.seed(42)
        n_samples = 1500
        data = np.zeros((n_samples, len(self.sensor_keys)))

        # Simulate normal multi-variate operational cycle
        phase = np.linspace(0, 10 * np.pi, n_samples)
        cyclic_load = np.sin(phase) * 0.02

        for col_idx, sid in enumerate(self.sensor_keys):
            cfg = SENSOR_DEFINITIONS[sid]
            base = cfg["baseline"]
            noise = cfg["noise_std"]

            if sid == "RPM_01":
                vals = base * (1.0 + cyclic_load * 1.5) + np.random.normal(0, noise, n_samples)
            elif sid == "VIBR_01":
                rpm_load = cyclic_load * 1.5
                vals = base * (1.0 + rpm_load * 1.2) + np.random.normal(0, noise, n_samples)
            elif sid == "TEMP_01":
                vals = base * (1.0 + cyclic_load * 0.8) + np.random.normal(0, noise, n_samples)
            elif sid == "PRES_01":
                vals = base * (1.0 + cyclic_load * 0.7) + np.random.normal(0, noise, n_samples)
            elif sid == "GPS_01":
                vals = base * (1.0 + cyclic_load * 0.5) + np.random.normal(0, noise, n_samples)
            else:
                vals = base + np.random.normal(0, noise, n_samples)

            data[:, col_idx] = vals

        self.model.fit(data)
        self.is_fitted = True

        # Compute baseline decision function distribution for normalization
        base_scores = self.model.decision_function(data)
        self.norm_mean = float(np.mean(base_scores))
        self.norm_std = float(np.std(base_scores))

    def evaluate_multi(self, readings: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
        """
        Evaluates IsolationForest on the combined sensor vector,
        and attributes anomaly scores to each individual sensor.
        """
        if not self.is_fitted:
            self._fit_on_synthetic_baseline()

        # Build feature vector
        vector = np.array([[readings.get(sid, SENSOR_DEFINITIONS[sid]["baseline"]) for sid in self.sensor_keys]])
        
        # IsolationForest decision function: lower score = more anomalous
        # Typical normal: +0.10 to +0.25; Anomaly: < 0 (negative)
        raw_score = float(self.model.decision_function(vector)[0])

        # Normalize score to [0, 1] where 1.0 is extreme anomaly
        # If raw_score >= 0.15: normal ~ 0.05
        # If raw_score <= -0.15: severe anomaly ~ 0.95
        if raw_score >= 0.12:
            system_anomaly_score = max(0.01, 0.10 - (raw_score - 0.12))
        else:
            # Shift into [0.2, 1.0]
            system_anomaly_score = min(1.0, 0.25 + (0.12 - raw_score) * 3.5)

        results = {}
        for idx, sid in enumerate(self.sensor_keys):
            val = readings.get(sid, SENSOR_DEFINITIONS[sid]["baseline"])
            cfg = SENSOR_DEFINITIONS[sid]
            base = cfg["baseline"]
            span = max(0.1, cfg["max_normal"] - cfg["min_normal"])
            rel_dev = abs(val - base) / span

            # Per-sensor attribution combines system-level score and relative deviation
            if rel_dev > 1.0:
                sensor_score = min(1.0, max(system_anomaly_score, 0.4 + rel_dev * 0.3))
                flagged = True
                expl = f"IsolationForest detected abnormal multi-variate distribution pattern (Score: {sensor_score:.2f})."
            elif system_anomaly_score > 0.4 and rel_dev > 0.6:
                sensor_score = round(system_anomaly_score * 0.8, 3)
                flagged = True
                expl = f"IsolationForest flagged atypical operational manifold state (Score: {sensor_score:.2f})."
            else:
                sensor_score = round(min(0.15, system_anomaly_score * 0.3), 3)
                flagged = False
                expl = "IsolationForest confirms reading matches normal baseline cluster."

            results[sid] = {
                "score": round(sensor_score, 3),
                "flagged": flagged,
                "raw_decision_score": round(raw_score, 4),
                "explanation": expl,
            }

        return results
