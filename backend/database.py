"""
SQLite Database module for SENTINEX.
Stores sensor events, security alerts, and system audit logs.
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.getenv("DB_PATH", "sentinex.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE,
        sensor_id TEXT NOT NULL,
        sensor_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        current_value REAL NOT NULL,
        trust_score REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        detection_methods TEXT NOT NULL,
        reason TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        sensor_id TEXT NOT NULL,
        value REAL NOT NULL,
        trust_score REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        status TEXT NOT NULL,
        attack_type TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        event_type TEXT NOT NULL,
        sensor_id TEXT,
        message TEXT NOT NULL,
        details TEXT
    )
    """)

    conn.commit()
    conn.close()

def save_alert(
    alert_id: str,
    sensor_id: str,
    sensor_name: str,
    severity: str,
    current_value: float,
    trust_score: float,
    anomaly_score: float,
    detection_methods: List[str],
    reason: str,
    recommended_action: str,
    status: str = "ACTIVE"
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    methods_json = json.dumps(detection_methods)

    # Check if there is already an active alert for this sensor to update or insert
    cursor.execute("""
        SELECT alert_id FROM alerts 
        WHERE sensor_id = ? AND status = 'ACTIVE' 
        ORDER BY id DESC LIMIT 1
    """, (sensor_id,))
    existing = cursor.fetchone()

    if existing:
        current_aid = existing["alert_id"]
        cursor.execute("""
            UPDATE alerts 
            SET severity = ?, current_value = ?, trust_score = ?, anomaly_score = ?,
                detection_methods = ?, reason = ?, recommended_action = ?, updated_at = ?
            WHERE alert_id = ?
        """, (
            severity, current_value, trust_score, anomaly_score,
            methods_json, reason, recommended_action, now, current_aid
        ))
        conn.commit()
        cursor.execute("SELECT * FROM alerts WHERE alert_id = ?", (current_aid,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)
    else:
        cursor.execute("""
            INSERT INTO alerts (
                alert_id, sensor_id, sensor_name, severity, current_value,
                trust_score, anomaly_score, detection_methods, reason,
                recommended_action, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_id, sensor_id, sensor_name, severity, current_value,
            trust_score, anomaly_score, methods_json, reason,
            recommended_action, status, now, now
        ))
        conn.commit()
        cursor.execute("SELECT * FROM alerts WHERE alert_id = ?", (alert_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)

def clear_all_alerts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET status = 'RESOLVED'")
    conn.commit()
    conn.close()

def resolve_alerts_for_sensor(sensor_id: str, reason: str = "Sensor returned to normal operational limits"):

    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        UPDATE alerts 
        SET status = 'RESOLVED', updated_at = ?
        WHERE sensor_id = ? AND status = 'ACTIVE'
    """, (now, sensor_id))
    conn.commit()
    conn.close()

def get_alerts(
    severity: Optional[str] = None,
    sensor_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []

    if severity:
        query += " AND severity = ?"
        params.append(severity.upper())
    if sensor_id:
        query += " AND sensor_id = ?"
        params.append(sensor_id)
    if status:
        query += " AND status = ?"
        params.append(status.upper())

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        try:
            d["detection_methods"] = json.loads(d["detection_methods"])
        except Exception:
            d["detection_methods"] = []
        result.append(d)
    return result

def add_system_log(
    level: str,
    event_type: str,
    message: str,
    sensor_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    details_str = json.dumps(details) if details else None
    cursor.execute("""
        INSERT INTO system_logs (timestamp, level, event_type, sensor_id, message, details)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (now, level.upper(), event_type.upper(), sensor_id, message, details_str))
    conn.commit()
    conn.close()

def get_system_logs(limit: int = 60) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("details"):
            try:
                d["details"] = json.loads(d["details"])
            except Exception:
                pass
        result.append(d)
    return result

def record_sensor_event(
    sensor_id: str,
    value: float,
    trust_score: float,
    anomaly_score: float,
    status: str,
    attack_type: Optional[str] = None
):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO sensor_events (timestamp, sensor_id, value, trust_score, anomaly_score, status, attack_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (now, sensor_id, value, trust_score, anomaly_score, status, attack_type))
    conn.commit()
    conn.close()
