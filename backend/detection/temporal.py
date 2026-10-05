"""
Layer 5: Temporal Analysis Engine for SENTINEX.
Tracks temporal persistence, duration of anomalous states,
and sudden delta dynamics to separate transient noise from sustained cyber-attacks.
"""

import time
from typing import Dict, Any
from backend.config import SENSOR_DEFINITIONS

class TemporalAnomalyDetector:
    def __init__(self):
        # Maps sensor_id to temporal tracking metrics
        self.state: Dict[str, Dict[str, Any]] = {
            sid: {
                "consecutive_anomalous_ticks": 0,
                "first_anomalous_timestamp": None,
                "total_duration_anomalous": 0.0,
                "last_tick_time": time.time(),
                "recovery_ticks": 0,
            }
            for sid in SENSOR_DEFINITIONS
        }

    def evaluate(self, sensor_id: str, is_instant_anomalous: bool) -> Dict[str, Any]:
        """
        Evaluates temporal persistence and duration of abnormal state.
        """
        now = time.time()
        st = self.state[sensor_id]
        dt = max(0.5, now - st["last_tick_time"])
        st["last_tick_time"] = now

        if is_instant_anomalous:
            st["consecutive_anomalous_ticks"] += 1
            st["recovery_ticks"] = 0
            if st["first_anomalous_timestamp"] is None:
                st["first_anomalous_timestamp"] = now
            st["total_duration_anomalous"] = now - st["first_anomalous_timestamp"]

            consec = st["consecutive_anomalous_ticks"]
            dur = st["total_duration_anomalous"]

            # Severity score escalates with persistence
            # 1 tick = 0.25 (could be transient glitch)
            # 2 ticks (~2-3 sec) = 0.65 (confirmed sustained anomaly)
            # 4+ ticks = 0.95+ (persistent attack)
            if consec == 1:
                score = 0.25
                expl = f"Transient anomaly detected for {dur:.1f}s (single-tick event)."
            elif consec <= 3:
                score = round(min(0.80, 0.45 + consec * 0.15), 3)
                expl = f"Sustained anomalous reading persisting for {dur:.1f}s ({consec} consecutive samples)."
            else:
                score = round(min(1.0, 0.75 + (consec - 3) * 0.08), 3)
                expl = f"Severe persistent anomaly confirmed across {consec} consecutive cycles ({dur:.1f}s)."

            return {
                "score": score,
                "flagged": consec >= 2,
                "consecutive_ticks": consec,
                "duration_seconds": round(dur, 1),
                "is_persistent": consec >= 2,
                "explanation": expl,
            }
        else:
            # Back to normal reading
            st["recovery_ticks"] += 1
            if st["recovery_ticks"] > 2:
                # Reset anomalous state after sustained normal ticks
                st["consecutive_anomalous_ticks"] = 0
                st["first_anomalous_timestamp"] = None
                st["total_duration_anomalous"] = 0.0

            return {
                "score": 0.01,
                "flagged": False,
                "consecutive_ticks": 0,
                "duration_seconds": 0.0,
                "is_persistent": False,
                "explanation": "Temporal behavior is consistent with steady state operations.",
            }
