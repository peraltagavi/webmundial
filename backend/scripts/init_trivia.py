#!/usr/bin/env python3
"""Creates trivia_records table."""
import psycopg2

conn = psycopg2.connect("postgresql://mundial:mundial2026@localhost:5432/mundial2026")
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS trivia_records (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        puntuacion INTEGER NOT NULL,
        racha_maxima INTEGER NOT NULL DEFAULT 0,
        fecha TIMESTAMP DEFAULT NOW()
    )
""")
conn.commit()
cur.close()
conn.close()
print("✓ trivia_records created")
