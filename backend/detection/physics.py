"""
Layer 3: Physics and Rule Consistency Engine for SENTINEX.
Enforces physical laws, thermodynamic bounds, mechanical slew limits,
and coupled system conservation rules.
"""

from typing import Dict, Any, Optional
from backend.config import SENSOR_DEFINITIONS

class PhysicsRuleDetector:
    def __init__(self):
        self.last_values: Dict[str, float] = {}

    def evaluate(self, sensor_id: str, value: float, dt: float = 1.0) -> Dict[str, Any]:
        """
        Evaluates physical consistency, operating range boundaries,
        and maximum instantaneous rate of change (slew limit).
        """
        cfg = SENSOR_DEFINITIONS.get(sensor_id, {})
        min_n = cfg["min_normal"]
        max_n = cfg["max_normal"]
        hard_min = cfg["hard_min"]
        hard_max = cfg["hard_max"]
        max_rate = cfg["max_rate_of_change"]
        unit = cfg["unit"]

        last_val = self.last_values.get(sensor_id, value)
        rate_of_change = abs(value - last_val) / max(0.2, dt)
        self.last_values[sensor_id] = value

        violations = []
        scores = []

        # 1. Hard physical boundary violation (e.g. Temp > 95°C or < 40°C)
        if value > hard_max:
            excess = value - hard_max
            score = min(1.0, 0.75 + (excess / (hard_max * 0.25)))
            violations.append(f"Exceeds absolute hard physical threshold ({value:.1f}{unit} > {hard_max}{unit})")
            scores.append(score)
        elif value < hard_min:
            deficit = hard_min - value
            score = min(1.0, 0.75 + (deficit / (hard_min * 0.25)))
            violations.append(f"Falls below absolute hard physical threshold ({value:.1f}{unit} < {hard_min}{unit})")
            scores.append(score)

        # 2. Operating range boundary warning (between normal and hard limits)
        elif value > max_n:
            ratio = (value - max_n) / (hard_max - max_n)
            score = 0.25 + ratio * 0.45
            violations.append(f"Violates configured normal operating limit ({value:.1f}{unit} > {max_n}{unit})")
            scores.append(score)
        elif value < min_n:
            ratio = (min_n - value) / (min_n - hard_min)
            score = 0.25 + ratio * 0.45
            violations.append(f"Violates configured normal operating limit ({value:.1f}{unit} < {min_n}{unit})")
            scores.append(score)

        # 3. Physical Slew Rate Limit (sudden rate of change impossible for mechanical/thermal mass)
        if rate_of_change > max_rate:
            slew_ratio = rate_of_change / max_rate
            score = min(1.0, 0.50 + (slew_ratio - 1.0) * 0.25)
            violations.append(
                f"Changed significantly faster than expected physical slew rate "
                f"(Δ={rate_of_change:.2f}{unit}/s > max limit {max_rate}{unit}/s)"
            )
            scores.append(score)

        if violations:
            final_score = round(max(scores), 3)
            return {
                "score": final_score,
                "flagged": final_score > 0.35,
                "rate_of_change": round(rate_of_change, 2),
                "explanation": "; ".join(violations),
            }
        else:
            return {
                "score": 0.01,
                "flagged": False,
                "rate_of_change": round(rate_of_change, 2),
                "explanation": f"Within valid operating range [{min_n} - {max_n} {unit}] and normal physical slew rate.",
            }
