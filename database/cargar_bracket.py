#!/usr/bin/env python3
"""
Carga los 16avos de final en la base de datos y desbloquea el bracket.

Uso:
    python3 cargar_bracket.py --db-url postgresql://usuario:pass@host:5432/mundial2026

Si existe bracket_16avos.json en el mismo directorio, lo usa.
Si no, pide los datos interactivamente.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

try:
    import asyncpg
except ImportError:
    print("ERROR: asyncpg no está instalado. Instálalo con: pip install asyncpg")
    sys.exit(1)

JSON_PATH = Path(__file__).parent / "bracket_16avos.json"

CODIGOS_VALIDOS = {
    "MEX","RSA","KOR","CZE","CAN","BIH","QAT","CHE",
    "BRA","MAR","HTI","SCO","USA","PRY","AUS","TUR",
    "DEU","CUW","CIV","ECU","NLD","JPN","SWE","TUN",
    "BEL","EGY","IRN","NZL","ESP","CPV","KSA","URY",
    "FRA","SEN","IRQ","NOR","ARG","ALG","AUT","JOR",
    "PRT","COD","UZB","COL","ENG","HRV","GHA","PAN",
}


def leer_cruces_json() -> list[dict]:
    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)
    cruces = data["cruces"]
    if len(cruces) != 16:
        raise ValueError(f"Se esperan 16 cruces, se encontraron {len(cruces)}")
    for c in cruces:
        for campo in ("posicion", "equipo_a", "equipo_b"):
            if campo not in c:
                raise ValueError(f"Falta el campo '{campo}' en un cruce")
        if c["equipo_a"] not in CODIGOS_VALIDOS:
            raise ValueError(f"Código inválido: {c['equipo_a']}")
        if c["equipo_b"] not in CODIGOS_VALIDOS:
            raise ValueError(f"Código inválido: {c['equipo_b']}")
        if not 1 <= int(c["posicion"]) <= 16:
            raise ValueError(f"Posición fuera de rango: {c['posicion']}")
    return cruces


def leer_cruces_interactivo() -> list[dict]:
    print("\n📋 Ingresa los 16 cruces de dieciseisavos de final.")
    print("   Formato: CODIGO_A CODIGO_B  (ej: FRA RSA)\n")
    cruces = []
    for i in range(1, 17):
        while True:
            entrada = input(f"  Cruce {i:2d}: ").strip().upper().split()
            if len(entrada) != 2:
                print("  ⚠ Ingresa dos códigos separados por espacio.")
                continue
            a, b = entrada
            if a not in CODIGOS_VALIDOS:
                print(f"  ⚠ Código inválido: {a}")
                continue
            if b not in CODIGOS_VALIDOS:
                print(f"  ⚠ Código inválido: {b}")
                continue
            if a == b:
                print("  ⚠ Los dos equipos deben ser distintos.")
                continue
            cruces.append({"posicion": i, "equipo_a": a, "equipo_b": b})
            break
    return cruces


async def cargar(db_url: str, cruces: list[dict]) -> None:
    # asyncpg acepta postgresql:// directamente
    url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url)
    try:
        async with conn.transaction():
            # Limpiar cruces anteriores
            await conn.execute("DELETE FROM bracket_cruces WHERE ronda = 'dieciseisavos'")

            for c in cruces:
                await conn.execute(
                    """
                    INSERT INTO bracket_cruces (ronda, posicion, equipo_a, equipo_b, fue_penales, updated_at)
                    VALUES ('dieciseisavos', $1, $2, $3, FALSE, NOW())
                    """,
                    int(c["posicion"]), c["equipo_a"], c["equipo_b"],
                )

            # Desbloquear bracket
            await conn.execute(
                "UPDATE bracket_config SET desbloqueado = TRUE, fecha_desbloqueo = NOW() WHERE id = 1"
            )

        print(f"\n✅ {len(cruces)} cruces cargados en dieciseisavos.")
        print("✅ Bracket desbloqueado.\n")
    finally:
        await conn.close()


async def main() -> None:
    parser = argparse.ArgumentParser(description="Carga el bracket de dieciseisavos")
    parser.add_argument("--db-url", required=True, help="URL de conexión a PostgreSQL")
    args = parser.parse_args()

    print("\n🏆 Cargador de Bracket — Mundial 2026\n")

    if JSON_PATH.exists():
        print(f"📁 Leyendo {JSON_PATH.name}…")
        try:
            cruces = leer_cruces_json()
            print(f"   {len(cruces)} cruces encontrados.")
        except Exception as e:
            print(f"   ERROR en el JSON: {e}")
            sys.exit(1)
    else:
        print(f"ℹ  No se encontró {JSON_PATH.name}.")
        cruces = leer_cruces_interactivo()

    print("\n📋 Cruces a cargar:")
    for c in cruces:
        print(f"   {c['posicion']:2d}. {c['equipo_a']} vs {c['equipo_b']}")

    confirmacion = input("\n¿Confirmar carga? (s/N): ").strip().lower()
    if confirmacion != "s":
        print("Cancelado.")
        sys.exit(0)

    await cargar(args.db_url, cruces)


if __name__ == "__main__":
    asyncio.run(main())
