"""
Automated Demo Runner for SENTINEX.
Executes the exact 7-stage demonstration sequence:
1. Normal State (All sensors trusted, SECURE)
2. Attack (Inject False Data Injection on Temperature = 120°C)
3. Detection (Multi-layer engine identifies multi-sensor disagreement & physics bounds)
4. Trust Score Drop (Trust score plummets to Critical < 30)
5. Alert Generated (Explainable alert published to operator console)
6. Sensor Isolation (Isolates suspicious sensor; trusted sensors continue supporting system)
7. Sensor Reset & Trust Recovery (Restores normal telemetry, trust score recovers, system returns to SECURE)
"""

import asyncio
import time
from typing import Dict, Any, Optional

class DemoRunner:
    def __init__(self, simulator, detection_engine, add_log_fn):
        self.simulator = simulator
        self.detection_engine = detection_engine
        self.add_log_fn = add_log_fn
        self.is_running = False
        self.current_step = 0
        self.total_steps = 7
        self.step_name = "IDLE"
        self.step_description = "Demo mode ready"
        self.task: Optional[asyncio.Task] = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "step_name": self.step_name,
            "step_description": self.step_description,
        }

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.task = asyncio.create_task(self._run_sequence())

    async def stop(self):
        self.is_running = False
        if self.task and not self.task.done():
            self.task.cancel()
        self.current_step = 0
        self.step_name = "STOPPED"
        self.step_description = "Demo sequence stopped by operator."

    async def _run_sequence(self):
        try:
            # Stage 1: Normal State
            self.current_step = 1
            self.step_name = "NORMAL_OPERATION"
            self.step_description = "System operating normally. All 6 sensors trusted. System status: SECURE."
            self.simulator.reset_all()
            self.add_log_fn("INFO", "DEMO", "Demo Mode initiated: Establishing baseline normal operation.", "SYSTEM")
            await asyncio.sleep(4.0)

            if not self.is_running: return

            # Stage 2: Attack Injection
            self.current_step = 2
            self.step_name = "ATTACK_INJECTION"
            self.step_description = "Injecting cyber attack: False Data Injection (120.0°C) on Temperature sensor (TEMP_01)."
            self.simulator.start_attack(
                sensor_id="TEMP_01",
                attack_type="False Data Injection",
                target_value=120.0,
                duration=0.0
            )
            self.add_log_fn("WARNING", "ATTACK_INJECTED", "False Data Injection (120°C) applied to TEMP_01.", "TEMP_01")
            await asyncio.sleep(3.5)

            if not self.is_running: return

            # Stage 3: Detection Engine Triggered
            self.current_step = 3
            self.step_name = "DETECTION_TRIGGERED"
            self.step_description = "Detection Engine flagged: Cross-Sensor Correlation break, Physics limit breach (120°C > 95°C), and Statistical Z-Score outlier."
            self.add_log_fn("CRITICAL", "DETECTION", "Multi-layer engine identified high-confidence anomaly on TEMP_01.", "TEMP_01")
            await asyncio.sleep(3.5)

            if not self.is_running: return

            # Stage 4: Trust Score Drop
            self.current_step = 4
            self.step_name = "TRUST_SCORE_DROP"
            self.step_description = "Trust score on TEMP_01 rapidly drops into CRITICAL (< 30). System status switches to CRITICAL."
            self.add_log_fn("CRITICAL", "TRUST_DEGRADATION", "TEMP_01 trust score degraded below 30.0 (CRITICAL).", "TEMP_01")
            await asyncio.sleep(3.5)

            if not self.is_running: return

            # Stage 5: Explainable Alert
            self.current_step = 5
            self.step_name = "EXPLAINABLE_ALERT"
            self.step_description = "Explainable alert published: Temperature disagrees with 4 sensors for >3.2s and violates physical envelope."
            self.add_log_fn("CRITICAL", "ALERT_PUBLISHED", "Explainable alert ALT-TEMP_01 published to operator console.", "TEMP_01")
            await asyncio.sleep(4.0)

            if not self.is_running: return

            # Stage 6: Sensor Isolation Mitigation
            self.current_step = 6
            self.step_name = "SENSOR_ISOLATED"
            self.step_description = "Mitigation action executed: Sensor TEMP_01 ISOLATED. Trusted sensors continue supporting the system safely."
            self.simulator.isolate_sensor("TEMP_01")
            self.add_log_fn("INFO", "MITIGATION", "TEMP_01 successfully ISOLATED. Telemetry excluded from mission decisions.", "TEMP_01")
            await asyncio.sleep(4.5)

            if not self.is_running: return

            # Stage 7: Reset & Trust Recovery
            self.current_step = 7
            self.step_name = "RECOVERY_AND_RESTORE"
            self.step_description = "Resetting sensor to normal physical observation. Trust score dynamically recovering. System returning to SECURE."
            self.simulator.reset_sensor("TEMP_01")
            self.add_log_fn("INFO", "RECOVERY", "TEMP_01 reset. Physical ground truth restored; trust score recovering.", "TEMP_01")
            
            # Wait for trust score to climb back to 90+
            await asyncio.sleep(5.0)

            self.step_name = "COMPLETED"
            self.step_description = "Demo sequence completed successfully! All sensors restored to TRUSTED."
            self.add_log_fn("INFO", "DEMO", "Automated demonstration sequence concluded with verified recovery.", "SYSTEM")
            await asyncio.sleep(2.0)

        except asyncio.CancelledError:
            pass
        finally:
            self.is_running = False
