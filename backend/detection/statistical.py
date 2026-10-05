"""
Layer 2: Statistical Detection Engine for SENTINEX.
Calculates rolling moving average, standard deviation, z-score,
and variance collapse (freezing detection).
"""

import math
from typing import Dict, Any, List
from collections import deque
from backend.config import SENSOR_DEFINITIONS

class StatisticalDetector:
    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self.windows: Dict[str, deque] = {
            sid: deque(maxlen=window_size) for sid in SENSOR_DEFINITIONS
        }

    def update_and_evaluate(self, sensor_id: str, value: float) -> Dict[str, Any]:
        """
        Updates sliding window with current reading and evaluates statistical anomaly.
        """
        cfg = SENSOR_DEFINITIONS.get(sensor_id, {})
        buf = self.windows[sensor_id]
        buf.append(value)

        # Baseline fallback if buffer is filling up
        if len(buf) < 5:
            return {
                "score": 0.01,
                "flagged": False,
                "z_score": 0.05,
                "moving_avg": value,
                "std_dev": cfg.get("noise_std", 1.0),
                "explanation": "Statistical baseline calibrating (warmup window).",
            }

        # Calculate moving average and sample standard deviation
        n = len(buf)
        moving_avg = sum(buf) / n
        variance = sum((x - moving_avg) ** 2 for x in buf) / max(1, (n - 1))
        std_dev = math.sqrt(variance)

        # Expected natural noise floor
        expected_noise = cfg.get("noise_std", 0.5)

        # Check for Variance Collapse / Sensor Freeze (Noise injection or flatline)
        if n >= 15 and std_dev < (expected_noise * 0.03):
            return {
                "score": 0.85,
                "flagged": True,
                "z_score": 0.0,
                "moving_avg": round(moving_avg, 2),
                "std_dev": round(std_dev, 4),
                "explanation": f"Statistical variance collapse detected (std_dev = {std_dev:.4f}). Sensor reading is artificially flatlined.",
            }

        # Z-score calculation against expected noise floor to avoid zero division
        effective_std = max(std_dev, expected_noise * 0.85)
        z_score = abs(value - moving_avg) / effective_std

        # Normalization to [0, 1]
        # Normal Gaussian distribution: z <= 2.8 is within standard operational deviation
        if z_score <= 2.8:
            score = round(min(0.12, (z_score / 2.8) * 0.12), 3)
            flagged = False
            explanation = f"Value within normal statistical variance (Z-score: {z_score:.2f}, avg={moving_avg:.2f}, std={std_dev:.2f})."
        elif z_score <= 4.2:
            score = round(0.25 + ((z_score - 2.8) / 1.4) * 0.40, 3)
            flagged = True
            explanation = f"Moderate statistical anomaly detected (Z-score: {z_score:.2f} > 2.8 standard deviations)."
        else:
            score = round(min(1.0, 0.65 + ((z_score - 4.2) / 3.0) * 0.35), 3)
            flagged = True
            explanation = f"Severe statistical anomaly detected (Z-score: {z_score:.2f} severely deviates from moving average {moving_avg:.2f})."

        return {
            "score": score,
            "flagged": flagged,
            "z_score": round(z_score, 2),
            "moving_avg": round(moving_avg, 2),
            "std_dev": round(std_dev, 3),
            "explanation": explanation,
        }
