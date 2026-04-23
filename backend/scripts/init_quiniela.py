#!/usr/bin/env python3
"""Creates quiniela tables and populates quiniela_partidos with 72 group-stage matches."""
import psycopg2

DSN = "postgresql://mundial:mundial2026@localhost:5432/mundial2026"

_NOMBRES = {
    "MEX": "México", "RSA": "Sudáfrica", "KOR": "Rep. Corea", "CZE": "Rep. Checa",
    "CAN": "Canadá", "BIH": "Bosnia-Herz.", "QAT": "Catar", "CHE": "Suiza",
    "BRA": "Brasil", "MAR": "Marruecos", "HTI": "Haití", "SCO": "Escocia",
    "USA": "EE. UU.", "PRY": "Paraguay", "AUS": "Australia", "TUR": "Turquía",
    "DEU": "Alemania", "CUW": "Curazao", "CIV": "Costa de Marfil", "ECU": "Ecuador",
    "NLD": "Países Bajos", "JPN": "Japón", "SWE": "Suecia", "TUN": "Túnez",
    "BEL": "Bélgica", "EGY": "Egipto", "IRN": "Irán", "NZL": "Nueva Zelanda",
    "ESP": "España", "CPV": "Cabo Verde", "KSA": "Arabia Saudí", "URY": "Uruguay",
    "FRA": "Francia", "SEN": "Senegal", "IRQ": "Irak", "NOR": "Noruega",
    "ARG": "Argentina", "ALG": "Argelia", "AUT": "Austria", "JOR": "Jordania",
    "PRT": "Portugal", "JAM": "Jamaica", "UZB": "Uzbekistán", "COL": "Colombia",
    "ENG": "Inglaterra", "HRV": "Croacia", "GHA": "Ghana", "PAN": "Panamá",
}

_FECHA_MAP = {
    "11 jun": "2026-06-11", "12 jun": "2026-06-12", "13 jun": "2026-06-13",
    "14 jun": "2026-06-14", "15 jun": "2026-06-15", "16 jun": "2026-06-16",
    "17 jun": "2026-06-17", "18 jun": "2026-06-18", "19 jun": "2026-06-19",
    "20 jun": "2026-06-20", "21 jun": "2026-06-21", "22 jun": "2026-06-22",
    "23 jun": "2026-06-23", "24 jun": "2026-06-24", "25 jun": "2026-06-25",
    "26 jun": "2026-06-26", "27 jun": "2026-06-27",
}

_FIXTURE = [
    ("A", "A1", "11 jun", "MEX", "RSA"), ("A", "A2", "11 jun", "KOR", "CZE"),
    ("A", "A3", "18 jun", "CZE", "RSA"), ("A", "A4", "18 jun", "MEX", "KOR"),
    ("A", "A5", "24 jun", "CZE", "MEX"), ("A", "A6", "24 jun", "RSA", "KOR"),
    ("B", "B1", "12 jun", "CAN", "BIH"), ("B", "B2", "13 jun", "QAT", "CHE"),
    ("B", "B3", "18 jun", "CHE", "BIH"), ("B", "B4", "18 jun", "CAN", "QAT"),
    ("B", "B5", "24 jun", "CHE", "CAN"), ("B", "B6", "24 jun", "BIH", "QAT"),
    ("C", "C1", "13 jun", "BRA", "MAR"), ("C", "C2", "13 jun", "HTI", "SCO"),
    ("C", "C3", "19 jun", "SCO", "MAR"), ("C", "C4", "19 jun", "BRA", "HTI"),
    ("C", "C5", "24 jun", "BRA", "SCO"), ("C", "C6", "24 jun", "MAR", "HTI"),
    ("D", "D1", "12 jun", "USA", "PRY"), ("D", "D2", "13 jun", "AUS", "TUR"),
    ("D", "D3", "19 jun", "USA", "AUS"), ("D", "D4", "19 jun", "TUR", "PRY"),
    ("D", "D5", "25 jun", "TUR", "USA"), ("D", "D6", "25 jun", "PRY", "AUS"),
    ("E", "E1", "14 jun", "DEU", "CUW"), ("E", "E2", "14 jun", "CIV", "ECU"),
    ("E", "E3", "20 jun", "DEU", "CIV"), ("E", "E4", "20 jun", "ECU", "CUW"),
    ("E", "E5", "25 jun", "CUW", "CIV"), ("E", "E6", "25 jun", "ECU", "DEU"),
    ("F", "F1", "14 jun", "NLD", "JPN"), ("F", "F2", "14 jun", "SWE", "TUN"),
    ("F", "F3", "20 jun", "NLD", "SWE"), ("F", "F4", "20 jun", "TUN", "JPN"),
    ("F", "F5", "25 jun", "JPN", "SWE"), ("F", "F6", "25 jun", "TUN", "NLD"),
    ("G", "G1", "15 jun", "BEL", "EGY"), ("G", "G2", "15 jun", "IRN", "NZL"),
    ("G", "G3", "21 jun", "BEL", "IRN"), ("G", "G4", "21 jun", "NZL", "EGY"),
    ("G", "G5", "26 jun", "EGY", "IRN"), ("G", "G6", "26 jun", "NZL", "BEL"),
    ("H", "H1", "15 jun", "ESP", "CPV"), ("H", "H2", "15 jun", "KSA", "URY"),
    ("H", "H3", "21 jun", "ESP", "KSA"), ("H", "H4", "21 jun", "URY", "CPV"),
    ("H", "H5", "26 jun", "CPV", "KSA"), ("H", "H6", "26 jun", "URY", "ESP"),
    ("I", "I1", "16 jun", "FRA", "SEN"), ("I", "I2", "16 jun", "IRQ", "NOR"),
    ("I", "I3", "22 jun", "FRA", "IRQ"), ("I", "I4", "22 jun", "NOR", "SEN"),
    ("I", "I5", "26 jun", "NOR", "FRA"), ("I", "I6", "26 jun", "SEN", "IRQ"),
    ("J", "J1", "16 jun", "ARG", "ALG"), ("J", "J2", "16 jun", "AUT", "JOR"),
    ("J", "J3", "22 jun", "ARG", "AUT"), ("J", "J4", "22 jun", "JOR", "ALG"),
    ("J", "J5", "27 jun", "ALG", "AUT"), ("J", "J6", "27 jun", "JOR", "ARG"),
    ("K", "K1", "17 jun", "PRT", "JAM"), ("K", "K2", "17 jun", "UZB", "COL"),
    ("K", "K3", "23 jun", "PRT", "UZB"), ("K", "K4", "23 jun", "COL", "JAM"),
    ("K", "K5", "27 jun", "COL", "PRT"), ("K", "K6", "27 jun", "JAM", "UZB"),
    ("L", "L1", "17 jun", "ENG", "HRV"), ("L", "L2", "17 jun", "GHA", "PAN"),
    ("L", "L3", "23 jun", "ENG", "GHA"), ("L", "L4", "23 jun", "PAN", "HRV"),
    ("L", "L5", "27 jun", "PAN", "ENG"), ("L", "L6", "27 jun", "HRV", "GHA"),
]

def main():
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS quiniela_usuarios (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS quiniela_partidos (
            id VARCHAR(10) PRIMARY KEY,
            grupo VARCHAR(2) NOT NULL,
            fecha VARCHAR(20) NOT NULL,
            equipo_local VARCHAR(100) NOT NULL,
            codigo_local VARCHAR(10) NOT NULL,
            equipo_visitante VARCHAR(100) NOT NULL,
            codigo_visitante VARCHAR(10) NOT NULL,
            goles_local_real INTEGER,
            goles_visitante_real INTEGER,
            cerrado BOOLEAN DEFAULT FALSE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS quiniela_picks (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER REFERENCES quiniela_usuarios(id),
            partido_id VARCHAR(10) REFERENCES quiniela_partidos(id),
            goles_local INTEGER NOT NULL,
            goles_visitante INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(usuario_id, partido_id)
        )
    """)

    for grupo, pid, fecha_raw, loc, vis in _FIXTURE:
        fecha = _FECHA_MAP[fecha_raw]
        cur.execute(
            """
            INSERT INTO quiniela_partidos
                (id, grupo, fecha, equipo_local, codigo_local, equipo_visitante, codigo_visitante)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (pid, grupo, fecha, _NOMBRES[loc], loc, _NOMBRES[vis], vis),
        )

    conn.commit()
    cur.close()
    conn.close()
    print("✓ quiniela tables created and partidos populated")


if __name__ == "__main__":
    main()
