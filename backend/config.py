"""
Configuration for SENTINEX - Intelligent Sensor Integrity Engine.
Defines sensor metadata, physical limits, operating thresholds, and detection parameters.
"""

from typing import Dict, Any

SENSOR_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "TEMP_01": {
        "id": "TEMP_01",
        "name": "Temperature",
        "unit": "°C",
        "baseline": 72.0,
        "min_normal": 65.0,
        "max_normal": 85.0,
        "hard_min": 40.0,
        "hard_max": 95.0,
        "max_rate_of_change": 4.0,  # Max degrees per second under normal thermal inertia
        "noise_std": 0.45,
        "description": "Primary Turbomachinery Core Temperature",
        "correlated_with": ["PRES_01", "RPM_01"],
        "expected_correlation": {"PRES_01": 0.70, "RPM_01": 0.65},
    },
    "PRES_01": {
        "id": "PRES_01",
        "name": "Pressure",
        "unit": "PSI",
        "baseline": 31.0,
        "min_normal": 28.0,
        "max_normal": 34.0,
        "hard_min": 20.0,
        "hard_max": 42.0,
        "max_rate_of_change": 3.0,
        "noise_std": 0.25,
        "description": "Hydraulic Manifold Operational Pressure",
        "correlated_with": ["TEMP_01"],
        "expected_correlation": {"TEMP_01": 0.70},
    },
    "VIBR_01": {
        "id": "VIBR_01",
        "name": "Vibration",
        "unit": "mm/s",
        "baseline": 1.6,
        "min_normal": 0.8,
        "max_normal": 2.5,
        "hard_min": 0.2,
        "hard_max": 4.2,
        "max_rate_of_change": 0.8,
        "noise_std": 0.08,
        "description": "Shaft Bearing Vibration Amplitude",
        "correlated_with": ["RPM_01"],
        "expected_correlation": {"RPM_01": 0.82},
    },
    "GPS_01": {
        "id": "GPS_01",
        "name": "GPS Velocity",
        "unit": "km/h",
        "baseline": 60.0,
        "min_normal": 55.0,
        "max_normal": 65.0,
        "hard_min": 35.0,
        "hard_max": 85.0,
        "max_rate_of_change": 7.0,
        "noise_std": 0.50,
        "description": "Differential GPS Velocity Tracking",
        "correlated_with": ["RPM_01"],
        "expected_correlation": {"RPM_01": 0.60},
    },
    "VOLT_01": {
        "id": "VOLT_01",
        "name": "Voltage",
        "unit": "V",
        "baseline": 24.0,
        "min_normal": 22.8,
        "max_normal": 25.2,
        "hard_min": 19.0,
        "hard_max": 28.0,
        "max_rate_of_change": 1.2,
        "noise_std": 0.12,
        "description": "Dual-Bus Regulated Supply Voltage",
        "correlated_with": [],
        "expected_correlation": {},
    },
    "RPM_01": {
        "id": "RPM_01",
        "name": "RPM",
        "unit": "RPM",
        "baseline": 1800.0,
        "min_normal": 1700.0,
        "max_normal": 1900.0,
        "hard_min": 1200.0,
        "hard_max": 2300.0,
        "max_rate_of_change": 120.0,
        "noise_std": 12.0,
        "description": "Turbine Rotational Speed",
        "correlated_with": ["VIBR_01", "TEMP_01", "GPS_01"],
        "expected_correlation": {"VIBR_01": 0.82, "TEMP_01": 0.65, "GPS_01": 0.60},
    },
}

# Trust Score Categories
TRUST_LEVELS = {
    "TRUSTED": {"min": 90, "max": 100, "label": "Trusted", "color": "emerald"},
    "WARNING": {"min": 60, "max": 89, "label": "Warning", "color": "amber"},
    "SUSPICIOUS": {"min": 30, "max": 59, "label": "Suspicious", "color": "orange"},
    "CRITICAL": {"min": 0, "max": 29, "label": "Critical", "color": "rose"},
}

# Detection weights for composite risk score
DETECTION_WEIGHTS = {
    "cross_correlation": 0.22,
    "statistical": 0.20,
    "physics": 0.26,
    "ml_isolation_forest": 0.18,
    "temporal": 0.14,
}

# Mitigation weights
STATUS_WEIGHTS = {
    "ACTIVE": 1.0,
    "DOWN_WEIGHTED": 0.25,
    "ISOLATED": 0.0,
}
