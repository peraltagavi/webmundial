#!/usr/bin/env python3
"""
Importa los tres archivos de datos al esquema PostgreSQL del Mundial 2026.

Uso:
    python import_data.py [--db-url postgresql://usuario:pass@host:5432/mundial2026]

Si no se pasa --db-url, lee la variable de entorno DATABASE_URL o usa la URL
por defecto del docker-compose.

Orden de carga:
    1. ranking_fifa_abril2026.xlsx  →  tabla selecciones
    2. matches.csv                  →  tabla partidos_historicos
                                       (inserta en selecciones los equipos históricos
                                        que no están en el ranking actual)
    3. jugadores.csv                →  tabla jugadores
"""

import argparse
import csv
import os
import re
import sys
from datetime import date, datetime
from pathlib import Path

import openpyxl
import psycopg2
import psycopg2.extras

HERE = Path(__file__).parent

# ─── helpers de transformación ───────────────────────────────────────────────

def parse_bool(val: str) -> bool:
    return val.strip() == "1"


def parse_date_dmy(val: str) -> date | None:
    """DD/MM/YYYY → date"""
    val = val.strip()
    if not val:
        return None
    try:
        return datetime.strptime(val, "%d/%m/%Y").date()
    except ValueError:
        return None


def parse_estatura(val: str) -> int | None:
    """'1,87 m' o '1‚79 m' → 187"""
    val = val.strip()
    if not val:
        return None
    # normaliza coma europea (incluyendo el carácter ‚ U+201A que aparece en el CSV)
    val = val.replace("‚", ",").replace("m", "").strip()
    val = val.replace(",", ".")
    try:
        return round(float(val) * 100)
    except ValueError:
        return None


def parse_valor_mkt(val: str) -> float | None:
    """'1.000.000,00 €' → 1000000.00"""
    val = val.strip()
    if not val:
        return None
    # quita símbolo €, espacios y separadores de miles (.)
    val = re.sub(r"[€\s]", "", val)
    val = val.replace(".", "").replace(",", ".")
    try:
        return float(val)
    except ValueError:
        return None


def parse_time(val: str) -> str | None:
    val = val.strip()
    return val if val else None


def inferir_genero(tournament_name: str) -> str:
    return "femenino" if "Women" in tournament_name else "masculino"


# ─── carga ranking FIFA (xlsx) → selecciones ─────────────────────────────────

def load_ranking(conn) -> dict[str, int]:
    """
    Inserta todas las selecciones del ranking FIFA.
    Devuelve {codigo_fifa: id} para uso posterior.
    """
    wb = openpyxl.load_workbook(HERE / "ranking_fifa_abril2026.xlsx", read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    # fila 0 = título, fila 1 = url, fila 2 = cabeceras → datos desde fila 3
    data_rows = [r for r in rows[3:] if r[0] is not None]

    cur = conn.cursor()
    inserted = 0
    for row in data_rows:
        posicion, nombre, codigo, puntos, puntos_ant, pos_ant, *_ = row
        if not codigo:
            continue
        cur.execute("""
            INSERT INTO selecciones (nombre, codigo_fifa, ranking_fifa, puntos_fifa, puntos_fifa_ant, posicion_anterior)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (codigo_fifa) DO UPDATE SET
                nombre            = EXCLUDED.nombre,
                ranking_fifa      = EXCLUDED.ranking_fifa,
                puntos_fifa       = EXCLUDED.puntos_fifa,
                puntos_fifa_ant   = EXCLUDED.puntos_fifa_ant,
                posicion_anterior = EXCLUDED.posicion_anterior
            RETURNING id
        """, (
            str(nombre),
            str(codigo),
            int(posicion) if posicion else None,
            float(puntos) if puntos else None,
            float(puntos_ant) if puntos_ant else None,
            int(pos_ant) if pos_ant else None,
        ))
        inserted += 1

    conn.commit()
    print(f"  ✓ selecciones: {inserted} filas del ranking FIFA insertadas")

    # devuelve mapa codigo→id
    cur.execute("SELECT codigo_fifa, id FROM selecciones")
    return {row[0]: row[1] for row in cur.fetchall()}


# ─── carga matches.csv → partidos_historicos ─────────────────────────────────

def load_matches(conn, codigo_a_id: dict[str, int]) -> None:
    """
    Inserta todos los partidos históricos.
    Los equipos que no están en selecciones (equipos históricos) se insertan
    primero sin datos de ranking.
    """
    with open(HERE / "matches.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # 1) asegura que todos los equipos existen en selecciones
    equipos_csv: dict[str, str] = {}  # codigo → nombre
    for r in rows:
        equipos_csv[r["home_team_code"]] = r["home_team_name"]
        equipos_csv[r["away_team_code"]] = r["away_team_name"]

    cur = conn.cursor()
    nuevos = 0
    for codigo, nombre in equipos_csv.items():
        if codigo not in codigo_a_id:
            cur.execute("""
                INSERT INTO selecciones (nombre, codigo_fifa)
                VALUES (%s, %s)
                ON CONFLICT (codigo_fifa) DO NOTHING
                RETURNING id
            """, (nombre, codigo))
            result = cur.fetchone()
            if result:
                codigo_a_id[codigo] = result[0]
                nuevos += 1
    if nuevos:
        conn.commit()
        print(f"  ✓ selecciones: {nuevos} equipos históricos añadidos (sin ranking)")

    # 2) inserta partidos
    batch: list[tuple] = []
    for r in rows:
        pen_local = int(r["home_team_score_penalties"]) if r["home_team_score_penalties"] else None
        pen_visit = int(r["away_team_score_penalties"]) if r["away_team_score_penalties"] else None

        batch.append((
            int(r["key_id"]),
            r["tournament_id"],
            r["tournament_name"],
            inferir_genero(r["tournament_name"]),
            r["match_id"],
            r["match_name"],
            r["stage_name"],
            r["group_name"] or None,
            parse_bool(r["group_stage"]),
            parse_bool(r["knockout_stage"]),
            parse_bool(r["replayed"]),
            parse_bool(r["replay"]),
            r["match_date"] or None,
            parse_time(r["match_time"]),
            r["stadium_name"] or None,
            r["city_name"] or None,
            r["country_name"] or None,
            r["home_team_code"],
            r["home_team_name"],
            r["away_team_code"],
            r["away_team_name"],
            int(r["home_team_score"]) if r["home_team_score"] else None,
            int(r["away_team_score"]) if r["away_team_score"] else None,
            int(r["home_team_score_margin"]) if r["home_team_score_margin"] else None,
            int(r["away_team_score_margin"]) if r["away_team_score_margin"] else None,
            parse_bool(r["extra_time"]),
            parse_bool(r["penalty_shootout"]),
            pen_local,
            pen_visit,
            r["result"] or None,
            parse_bool(r["home_team_win"]),
            parse_bool(r["away_team_win"]),
            parse_bool(r["draw"]),
        ))

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO partidos_historicos (
            key_id, tournament_id, tournament_name, genero,
            match_id, match_name, stage_name, group_name,
            group_stage, knockout_stage, replayed, replay,
            match_date, match_time,
            stadium_name, city_name, country_name,
            home_team_code, home_team_name,
            away_team_code, away_team_name,
            home_team_score, away_team_score,
            home_team_score_margin, away_team_score_margin,
            extra_time, penalty_shootout,
            home_team_score_penalties, away_team_score_penalties,
            result, home_team_win, away_team_win, draw
        ) VALUES %s
        ON CONFLICT (key_id) DO NOTHING
        """,
        batch,
    )
    conn.commit()
    print(f"  ✓ partidos_historicos: {len(batch)} partidos insertados")


# ─── carga jugadores.csv → jugadores ─────────────────────────────────────────

def load_jugadores(conn, codigo_a_id: dict[str, int]) -> None:
    with open(HERE / "jugadores.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # asegura que equipos de jugadores.csv existen en selecciones
    cur = conn.cursor()
    for r in rows:
        codigo = r["Code"].strip()
        nombre = r["Team"].strip()
        if codigo and codigo not in codigo_a_id:
            cur.execute("""
                INSERT INTO selecciones (nombre, codigo_fifa)
                VALUES (%s, %s)
                ON CONFLICT (codigo_fifa) DO NOTHING
                RETURNING id
            """, (nombre, codigo))
            result = cur.fetchone()
            if result:
                codigo_a_id[codigo] = result[0]

    batch: list[tuple] = []
    for r in rows:
        codigo = r["Code"].strip()
        numero_raw = r["#"].strip()
        numero = int(numero_raw) if numero_raw.isdigit() else None
        dob = parse_date_dmy(r["DOB"])
        estatura = parse_estatura(r["estatura"])
        valor = parse_valor_mkt(r["Valor MKT (euros)"])

        batch.append((
            codigo or None,
            r["Team"].strip() or None,
            numero,
            r["POS"].strip() or None,
            r["Player Name"].strip(),
            dob,
            estatura,
            r["pie"].strip() or None,
            r["club"].strip() or None,
            r["liga"].strip() or None,
            int(r["caps"]) if r["caps"].strip().isdigit() else None,
            int(r["goles_seleccion"]) if r["goles_seleccion"].strip().isdigit() else None,
            valor,
        ))

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO jugadores (
            seleccion_codigo, seleccion_nombre, numero_camiseta,
            posicion, nombre, fecha_nacimiento,
            estatura_cm, pie_dominante,
            club, liga, internacionalidades, goles_seleccion,
            valor_mercado_eur
        ) VALUES %s
        """,
        batch,
    )
    conn.commit()
    print(f"  ✓ jugadores: {len(batch)} jugadores insertados")


# ─── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Importa datos del Mundial 2026 a PostgreSQL")
    parser.add_argument(
        "--db-url",
        default=os.environ.get(
            "DATABASE_URL",
            "postgresql://mundial:mundial2026@localhost:5432/mundial2026",
        ).replace("+asyncpg", ""),  # convierte URL async a sync para psycopg2
        help="URL de conexión PostgreSQL",
    )
    args = parser.parse_args()

    print(f"\nConectando a: {args.db_url}")
    try:
        conn = psycopg2.connect(args.db_url)
    except psycopg2.OperationalError as e:
        print(f"\nERROR: No se pudo conectar a la base de datos.\n{e}")
        sys.exit(1)

    print("\n── Cargando datos ──────────────────────────────────────")
    try:
        print("1/3  Ranking FIFA (xlsx) → selecciones")
        codigo_a_id = load_ranking(conn)

        print("2/3  matches.csv → partidos_historicos")
        load_matches(conn, codigo_a_id)

        print("3/3  jugadores.csv → jugadores")
        load_jugadores(conn, codigo_a_id)
    except Exception as e:
        conn.rollback()
        print(f"\nERROR durante la importación: {e}")
        raise
    finally:
        conn.close()

    print("\n✓ Importación completada\n")


if __name__ == "__main__":
    main()
