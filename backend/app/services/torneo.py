import random
import math
from itertools import product as itertools_product
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.seleccion import Seleccion
from app.schemas.torneo import (
    EquipoFixture, PartidoFixture, GrupoFixture, FixtureResponse,
    ResultadoPartido, FilaTabla,
    SimularGrupoResponse, SimularTodosResponse,
    MejoresTercerosResponse, SimularKOResponse,
    ResultadoEscenario, EscenariosResponse, FilaTablaEscenario,
)

# ─── Fixture hardcodeado ──────────────────────────────────────────────────────

_FIXTURE_RAW = [
    {
        "nombre": "A",
        "equipos": [
            ("México",              "MEX"),
            ("Sudáfrica",           "RSA"),
            ("República de Corea",  "KOR"),
            ("República Checa",     "CZE"),
        ],
        "partidos": [
            ("A1", "11 jun", "MEX", "RSA"),
            ("A2", "11 jun", "KOR", "CZE"),
            ("A3", "18 jun", "CZE", "RSA"),
            ("A4", "18 jun", "MEX", "KOR"),
            ("A5", "24 jun", "CZE", "MEX"),
            ("A6", "24 jun", "RSA", "KOR"),
        ],
    },
    {
        "nombre": "B",
        "equipos": [
            ("Canadá",              "CAN"),
            ("Bosnia y Herzegovina","BIH"),
            ("Catar",               "QAT"),
            ("Suiza",               "CHE"),
        ],
        "partidos": [
            ("B1", "12 jun", "CAN", "BIH"),
            ("B2", "13 jun", "QAT", "CHE"),
            ("B3", "18 jun", "CHE", "BIH"),
            ("B4", "18 jun", "CAN", "QAT"),
            ("B5", "24 jun", "CHE", "CAN"),
            ("B6", "24 jun", "BIH", "QAT"),
        ],
    },
    {
        "nombre": "C",
        "equipos": [
            ("Brasil",    "BRA"),
            ("Marruecos", "MAR"),
            ("Haití",     "HTI"),
            ("Escocia",   "SCO"),
        ],
        "partidos": [
            ("C1", "13 jun", "BRA", "MAR"),
            ("C2", "13 jun", "HTI", "SCO"),
            ("C3", "19 jun", "SCO", "MAR"),
            ("C4", "19 jun", "BRA", "HTI"),
            ("C5", "24 jun", "BRA", "SCO"),
            ("C6", "24 jun", "MAR", "HTI"),
        ],
    },
    {
        "nombre": "D",
        "equipos": [
            ("Estados Unidos", "USA"),
            ("Paraguay",       "PRY"),
            ("Australia",      "AUS"),
            ("Turquía",        "TUR"),
        ],
        "partidos": [
            ("D1", "12 jun", "USA", "PRY"),
            ("D2", "13 jun", "AUS", "TUR"),
            ("D3", "19 jun", "USA", "AUS"),
            ("D4", "19 jun", "TUR", "PRY"),
            ("D5", "25 jun", "TUR", "USA"),
            ("D6", "25 jun", "PRY", "AUS"),
        ],
    },
    {
        "nombre": "E",
        "equipos": [
            ("Alemania",        "DEU"),
            ("Curazao",         "CUW"),
            ("Costa de Marfil", "CIV"),
            ("Ecuador",         "ECU"),
        ],
        "partidos": [
            ("E1", "14 jun", "DEU", "CUW"),
            ("E2", "14 jun", "CIV", "ECU"),
            ("E3", "20 jun", "DEU", "CIV"),
            ("E4", "20 jun", "ECU", "CUW"),
            ("E5", "25 jun", "CUW", "CIV"),
            ("E6", "25 jun", "ECU", "DEU"),
        ],
    },
    {
        "nombre": "F",
        "equipos": [
            ("Países Bajos", "NLD"),
            ("Japón",        "JPN"),
            ("Suecia",       "SWE"),
            ("Túnez",        "TUN"),
        ],
        "partidos": [
            ("F1", "14 jun", "NLD", "JPN"),
            ("F2", "14 jun", "SWE", "TUN"),
            ("F3", "20 jun", "NLD", "SWE"),
            ("F4", "20 jun", "TUN", "JPN"),
            ("F5", "25 jun", "JPN", "SWE"),
            ("F6", "25 jun", "TUN", "NLD"),
        ],
    },
    {
        "nombre": "G",
        "equipos": [
            ("Bélgica",       "BEL"),
            ("Egipto",        "EGY"),
            ("Irán",          "IRN"),
            ("Nueva Zelanda", "NZL"),
        ],
        "partidos": [
            ("G1", "15 jun", "BEL", "EGY"),
            ("G2", "15 jun", "IRN", "NZL"),
            ("G3", "21 jun", "BEL", "IRN"),
            ("G4", "21 jun", "NZL", "EGY"),
            ("G5", "26 jun", "EGY", "IRN"),
            ("G6", "26 jun", "NZL", "BEL"),
        ],
    },
    {
        "nombre": "H",
        "equipos": [
            ("España",       "ESP"),
            ("Cabo Verde",   "CPV"),
            ("Arabia Saudí", "KSA"),
            ("Uruguay",      "URY"),
        ],
        "partidos": [
            ("H1", "15 jun", "ESP", "CPV"),
            ("H2", "15 jun", "KSA", "URY"),
            ("H3", "21 jun", "ESP", "KSA"),
            ("H4", "21 jun", "URY", "CPV"),
            ("H5", "26 jun", "CPV", "KSA"),
            ("H6", "26 jun", "URY", "ESP"),
        ],
    },
    {
        "nombre": "I",
        "equipos": [
            ("Francia",  "FRA"),
            ("Senegal",  "SEN"),
            ("Irak",     "IRQ"),
            ("Noruega",  "NOR"),
        ],
        "partidos": [
            ("I1", "16 jun", "FRA", "SEN"),
            ("I2", "16 jun", "IRQ", "NOR"),
            ("I3", "22 jun", "FRA", "IRQ"),
            ("I4", "22 jun", "NOR", "SEN"),
            ("I5", "26 jun", "NOR", "FRA"),
            ("I6", "26 jun", "SEN", "IRQ"),
        ],
    },
    {
        "nombre": "J",
        "equipos": [
            ("Argentina", "ARG"),
            ("Argelia",   "ALG"),
            ("Austria",   "AUT"),
            ("Jordania",  "JOR"),
        ],
        "partidos": [
            ("J1", "16 jun", "ARG", "ALG"),
            ("J2", "16 jun", "AUT", "JOR"),
            ("J3", "22 jun", "ARG", "AUT"),
            ("J4", "22 jun", "JOR", "ALG"),
            ("J5", "27 jun", "ALG", "AUT"),
            ("J6", "27 jun", "JOR", "ARG"),
        ],
    },
    {
        "nombre": "K",
        "equipos": [
            ("Portugal",    "PRT"),
            ("Jamaica",     "JAM"),
            ("Uzbekistán",  "UZB"),
            ("Colombia",    "COL"),
        ],
        "partidos": [
            ("K1", "17 jun", "PRT", "JAM"),
            ("K2", "17 jun", "UZB", "COL"),
            ("K3", "23 jun", "PRT", "UZB"),
            ("K4", "23 jun", "COL", "JAM"),
            ("K5", "27 jun", "COL", "PRT"),
            ("K6", "27 jun", "JAM", "UZB"),
        ],
    },
    {
        "nombre": "L",
        "equipos": [
            ("Inglaterra", "ENG"),
            ("Croacia",    "HRV"),
            ("Ghana",      "GHA"),
            ("Panamá",     "PAN"),
        ],
        "partidos": [
            ("L1", "17 jun", "ENG", "HRV"),
            ("L2", "17 jun", "GHA", "PAN"),
            ("L3", "23 jun", "ENG", "GHA"),
            ("L4", "23 jun", "PAN", "HRV"),
            ("L5", "27 jun", "PAN", "ENG"),
            ("L6", "27 jun", "HRV", "GHA"),
        ],
    },
]

# Build quick-lookup maps
_NOMBRE_POR_CODIGO: dict[str, str] = {}
_PARTIDOS_POR_GRUPO: dict[str, list[dict]] = {}
_EQUIPOS_POR_GRUPO: dict[str, list[tuple[str, str]]] = {}

for _g in _FIXTURE_RAW:
    g_nom = _g["nombre"]
    _EQUIPOS_POR_GRUPO[g_nom] = [(n, c) for n, c in _g["equipos"]]
    for n, c in _g["equipos"]:
        _NOMBRE_POR_CODIGO[c] = n
    _PARTIDOS_POR_GRUPO[g_nom] = [
        {"id": p[0], "fecha": p[1], "codigo_a": p[2], "codigo_b": p[3]}
        for p in _g["partidos"]
    ]


# ─── Helpers internos ────────────────────────────────────────────────────────

def _poisson_sample(lam: float) -> int:
    return random.choices(
        range(8),
        weights=[math.exp(-lam) * lam**k / math.factorial(k) for k in range(8)],
    )[0]


def _fuerza(sel: Seleccion | None) -> float:
    if sel and sel.puntos_fifa:
        return min(float(sel.puntos_fifa) / 2000.0, 1.0)
    if sel and sel.ranking_fifa:
        return max(1.0 - (sel.ranking_fifa / 210.0), 0.1)
    return 0.4


async def _get_sel(db: AsyncSession, codigo: str) -> Seleccion | None:
    res = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo))
    return res.scalar_one_or_none()


async def _batch_rankings(db: AsyncSession, codigos: list[str]) -> dict[str, int | None]:
    res = await db.execute(
        select(Seleccion).where(Seleccion.codigo_fifa.in_(codigos))
    )
    sels = res.scalars().all()
    return {s.codigo_fifa: s.ranking_fifa for s in sels}


async def _simular_par(db: AsyncSession, codigo_a: str, codigo_b: str) -> tuple[int, int]:
    sel_a = await _get_sel(db, codigo_a)
    sel_b = await _get_sel(db, codigo_b)
    fa = _fuerza(sel_a)
    fb = _fuerza(sel_b)
    r_a = float(sel_a.ranking_fifa if sel_a and sel_a.ranking_fifa else 100)
    r_b = float(sel_b.ranking_fifa if sel_b and sel_b.ranking_fifa else 100)
    delta = max(-0.4, min(0.4, (r_b - r_a) / 200.0))
    lam_a = max(0.3, (0.5 + fa * 2.5) * (1.0 + delta))
    lam_b = max(0.3, (0.5 + fb * 2.5) * (1.0 - delta))
    return _poisson_sample(lam_a), _poisson_sample(lam_b)


def _calcular_tabla(
    grupo: str,
    resultados: dict[str, tuple[int, int]],
    rankings: dict[str, int | None],
) -> list[FilaTabla]:
    partidos_def = _PARTIDOS_POR_GRUPO[grupo]
    equipos = _EQUIPOS_POR_GRUPO[grupo]

    stats: dict[str, dict] = {
        codigo: {
            "nombre": nombre, "codigo": codigo,
            "ranking_fifa": rankings.get(codigo),
            "pj": 0, "pg": 0, "pe": 0, "pp": 0,
            "gf": 0, "gc": 0, "dg": 0, "pts": 0,
        }
        for nombre, codigo in equipos
    }

    for p in partidos_def:
        pid = p["id"]
        if pid not in resultados:
            continue
        ga, gb = resultados[pid]
        ca, cb = p["codigo_a"], p["codigo_b"]
        stats[ca]["pj"] += 1; stats[cb]["pj"] += 1
        stats[ca]["gf"] += ga; stats[ca]["gc"] += gb
        stats[cb]["gf"] += gb; stats[cb]["gc"] += ga
        if ga > gb:
            stats[ca]["pg"] += 1; stats[ca]["pts"] += 3; stats[cb]["pp"] += 1
        elif ga < gb:
            stats[cb]["pg"] += 1; stats[cb]["pts"] += 3; stats[ca]["pp"] += 1
        else:
            stats[ca]["pe"] += 1; stats[ca]["pts"] += 1
            stats[cb]["pe"] += 1; stats[cb]["pts"] += 1

    for s in stats.values():
        s["dg"] = s["gf"] - s["gc"]

    def h2h_pts(a: str, b: str) -> int:
        pts = 0
        for p in partidos_def:
            if p["id"] not in resultados:
                continue
            if {p["codigo_a"], p["codigo_b"]} != {a, b}:
                continue
            ga, gb = resultados[p["id"]]
            ca = p["codigo_a"]
            fa, fb = (ga, gb) if ca == a else (gb, ga)
            if fa > fb:
                pts += 3
            elif fa == fb:
                pts += 1
        return pts

    def sort_key(s: dict):
        codigo = s["codigo"]
        return (
            -s["pts"],
            -s["dg"],
            -s["gf"],
            -(s["ranking_fifa"] or 999) * -1,  # lower rank = better
        )

    sorted_teams = sorted(stats.values(), key=sort_key)

    # Resolve ties between exactly 2 teams using h2h
    result = []
    i = 0
    while i < len(sorted_teams):
        j = i + 1
        while j < len(sorted_teams) and (
            sorted_teams[j]["pts"] == sorted_teams[i]["pts"]
            and sorted_teams[j]["dg"] == sorted_teams[i]["dg"]
            and sorted_teams[j]["gf"] == sorted_teams[i]["gf"]
        ):
            j += 1
        group = sorted_teams[i:j]
        if len(group) == 2:
            a, b = group[0]["codigo"], group[1]["codigo"]
            pa = h2h_pts(a, b)
            pb = h2h_pts(b, a)
            if pb > pa:
                group = [group[1], group[0]]
        result.extend(group)
        i = j

    return [FilaTabla(**s) for s in result]


# ─── Servicios públicos ───────────────────────────────────────────────────────

async def get_fixture(db: AsyncSession) -> FixtureResponse:
    all_codes = list(_NOMBRE_POR_CODIGO.keys())
    rankings = await _batch_rankings(db, all_codes)

    grupos = []
    for g in _FIXTURE_RAW:
        equipos = [
            EquipoFixture(
                nombre=n,
                codigo=c,
                ranking_fifa=rankings.get(c),
            )
            for n, c in g["equipos"]
        ]
        eq_map = {c: EquipoFixture(nombre=n, codigo=c, ranking_fifa=rankings.get(c))
                  for n, c in g["equipos"]}
        partidos = [
            PartidoFixture(
                id=p[0],
                fecha=p[1],
                equipo_a=eq_map[p[2]],
                equipo_b=eq_map[p[3]],
            )
            for p in g["partidos"]
        ]
        grupos.append(GrupoFixture(nombre=g["nombre"], equipos=equipos, partidos=partidos))

    return FixtureResponse(grupos=grupos)


async def simular_grupo(
    db: AsyncSession,
    grupo: str,
    resultados_previos: list[ResultadoPartido],
) -> SimularGrupoResponse:
    partidos_def = _PARTIDOS_POR_GRUPO.get(grupo)
    if not partidos_def:
        raise ValueError(f"Grupo '{grupo}' no existe")

    resultados: dict[str, tuple[int, int]] = {
        r.partido_id: (r.goles_a, r.goles_b) for r in resultados_previos
    }

    for p in partidos_def:
        if p["id"] not in resultados:
            ga, gb = await _simular_par(db, p["codigo_a"], p["codigo_b"])
            resultados[p["id"]] = (ga, gb)

    codigos = [c for _, c in _EQUIPOS_POR_GRUPO[grupo]]
    rankings = await _batch_rankings(db, codigos)
    tabla = _calcular_tabla(grupo, resultados, rankings)

    partidos_resp = [
        ResultadoPartido(partido_id=k, goles_a=v[0], goles_b=v[1])
        for k, v in resultados.items()
    ]
    return SimularGrupoResponse(grupo=grupo, tabla=tabla, partidos=partidos_resp)


async def simular_todos(
    db: AsyncSession,
    resultados_previos: list[ResultadoPartido],
) -> SimularTodosResponse:
    grupos = []
    for g in _FIXTURE_RAW:
        prev = [r for r in resultados_previos if r.partido_id.startswith(g["nombre"])]
        res = await simular_grupo(db, g["nombre"], prev)
        grupos.append(res)
    return SimularTodosResponse(grupos=grupos)


def mejores_terceros(tablas: list[SimularGrupoResponse]) -> MejoresTercerosResponse:
    terceros: list[tuple[str, FilaTabla]] = []
    for t in tablas:
        if len(t.tabla) >= 3:
            terceros.append((t.grupo, t.tabla[2]))

    def tercero_key(item: tuple[str, FilaTabla]):
        _, f = item
        return (-f.pts, -f.dg, -f.gf, f.ranking_fifa or 999)

    terceros_sorted = sorted(terceros, key=tercero_key)[:8]
    clasificados = [f for _, f in terceros_sorted]
    grupos_origen = [g for g, _ in terceros_sorted]
    return MejoresTercerosResponse(clasificados=clasificados, grupos_origen=grupos_origen)


async def simular_partido_ko(
    db: AsyncSession,
    codigo_a: str,
    codigo_b: str,
) -> SimularKOResponse:
    # Tiempo reglamentario
    ga, gb = await _simular_par(db, codigo_a, codigo_b)

    if ga != gb:
        return SimularKOResponse(
            goles_a=ga, goles_b=gb,
            ganador="a" if ga > gb else "b",
        )

    # Prórroga (lambda reducido)
    sel_a = await _get_sel(db, codigo_a)
    sel_b = await _get_sel(db, codigo_b)
    r_a = float(sel_a.ranking_fifa if sel_a and sel_a.ranking_fifa else 100)
    r_b = float(sel_b.ranking_fifa if sel_b and sel_b.ranking_fifa else 100)
    delta = max(-0.4, min(0.4, (r_b - r_a) / 200.0))
    fa = _fuerza(sel_a); fb = _fuerza(sel_b)
    et_lam_a = max(0.1, (0.5 + fa * 2.5) * (1.0 + delta) * 0.35)
    et_lam_b = max(0.1, (0.5 + fb * 2.5) * (1.0 - delta) * 0.35)
    et_a = _poisson_sample(et_lam_a)
    et_b = _poisson_sample(et_lam_b)
    ga += et_a; gb += et_b

    if ga != gb:
        return SimularKOResponse(
            goles_a=ga, goles_b=gb,
            ganador="a" if ga > gb else "b",
        )

    # Penales
    prob_a = max(0.3, min(0.7, 0.5 + (r_b - r_a) / 400.0))
    pen_a = pen_b = 0
    for _ in range(5):
        if random.random() < prob_a:
            pen_a += 1
        if random.random() < (1.0 - prob_a):
            pen_b += 1
    while pen_a == pen_b:
        if random.random() < prob_a:
            pen_a += 1
        else:
            pen_b += 1

    return SimularKOResponse(
        goles_a=ga, goles_b=gb,
        ganador="a" if pen_a > pen_b else "b",
        penales=True,
        penales_a=pen_a,
        penales_b=pen_b,
    )


def calcular_escenarios(
    equipo_codigo: str,
    resultados_input: list[ResultadoEscenario],
) -> EscenariosResponse:
    # Find group
    grupo_nombre: str | None = None
    for g in _FIXTURE_RAW:
        if equipo_codigo in [c for _, c in g["equipos"]]:
            grupo_nombre = g["nombre"]
            break
    if not grupo_nombre:
        raise ValueError(f"Equipo '{equipo_codigo}' no encontrado en el fixture")

    equipos = _EQUIPOS_POR_GRUPO[grupo_nombre]
    partidos_def = _PARTIDOS_POR_GRUPO[grupo_nombre]
    nombres: dict[str, str] = {c: n for n, c in equipos}

    # Only include results where both goals are provided
    team_results: dict[str, tuple[int, int]] = {
        r.partido_id: (r.goles_local, r.goles_visitante)
        for r in resultados_input
        if r.goles_local is not None and r.goles_visitante is not None
    }

    # Matches not involving the selected team
    other_partidos = [
        p for p in partidos_def
        if p["codigo_a"] != equipo_codigo and p["codigo_b"] != equipo_codigo
    ]

    # Possible outcomes: home win, draw, away win
    OUTCOMES = [(1, 0), (0, 0), (0, 1)]

    def calc_table(extra: dict[str, tuple[int, int]]) -> list[dict]:
        all_r = {**team_results, **extra}
        stats: dict[str, dict] = {
            c: {"nombre": nombres[c], "codigo": c,
                "pj": 0, "pg": 0, "pe": 0, "pp": 0,
                "gf": 0, "gc": 0, "pts": 0}
            for _, c in equipos
        }
        for p in partidos_def:
            r = all_r.get(p["id"])
            if r is None:
                continue
            ga, gb = r
            ca, cb = p["codigo_a"], p["codigo_b"]
            stats[ca]["pj"] += 1; stats[cb]["pj"] += 1
            stats[ca]["gf"] += ga; stats[ca]["gc"] += gb
            stats[cb]["gf"] += gb; stats[cb]["gc"] += ga
            if ga > gb:
                stats[ca]["pg"] += 1; stats[ca]["pts"] += 3; stats[cb]["pp"] += 1
            elif ga < gb:
                stats[cb]["pg"] += 1; stats[cb]["pts"] += 3; stats[ca]["pp"] += 1
            else:
                stats[ca]["pe"] += 1; stats[ca]["pts"] += 1
                stats[cb]["pe"] += 1; stats[cb]["pts"] += 1
        for s in stats.values():
            s["dg"] = s["gf"] - s["gc"]
        return sorted(stats.values(), key=lambda s: (-s["pts"], -s["dg"], -s["gf"]))

    # Current standings with only team's results applied
    current_table = calc_table({})
    team_pts = next((s["pts"] for s in current_table if s["codigo"] == equipo_codigo), 0)
    team_current_pos = next((i for i, s in enumerate(current_table) if s["codigo"] == equipo_codigo), 3)

    # Enumerate all combinations of other match outcomes
    n = len(other_partidos)
    favorable = 0
    total = 0
    favorable_scenarios: list[str] = []

    for combo in itertools_product(range(3), repeat=n):
        extra: dict[str, tuple[int, int]] = {}
        parts: list[str] = []
        for idx, outcome_idx in enumerate(combo):
            p = other_partidos[idx]
            ga, gb = OUTCOMES[outcome_idx]
            extra[p["id"]] = (ga, gb)
            na = nombres.get(p["codigo_a"], p["codigo_a"])
            nb = nombres.get(p["codigo_b"], p["codigo_b"])
            if ga > gb:
                parts.append(f"{na} gana a {nb}")
            elif ga < gb:
                parts.append(f"{nb} gana a {na}")
            else:
                parts.append(f"{na} empata con {nb}")

        table = calc_table(extra)
        pos = next((i for i, s in enumerate(table) if s["codigo"] == equipo_codigo), 3)
        total += 1
        if pos < 2:
            favorable += 1
            if len(favorable_scenarios) < 6:
                favorable_scenarios.append(", ".join(parts))

    if total == 0:
        total = 1
        favorable = 1 if team_current_pos < 2 else 0

    nombre_equipo = nombres.get(equipo_codigo, equipo_codigo)

    if favorable == total:
        estado = "clasifica"
        mensaje = f"¡Con estos resultados, {nombre_equipo} CLASIFICA al eliminatorio en todos los escenarios posibles!"
        escenarios_desc: list[str] = []
    elif favorable == 0:
        estado = "eliminado"
        mensaje = f"{nombre_equipo} queda ELIMINADO con estos resultados sin importar el resto de partidos del grupo."
        escenarios_desc = []
    else:
        estado = "depende"
        pct = int((favorable / total) * 100)
        mensaje = (
            f"{nombre_equipo} tiene {team_pts} punto(s) y puede clasificar "
            f"en {favorable} de {total} escenarios posibles ({pct}%). "
            f"Necesita ayuda del resto del grupo."
        )
        escenarios_desc = favorable_scenarios

    tabla_actual = [
        FilaTablaEscenario(
            nombre=s["nombre"], codigo=s["codigo"], pts=s["pts"],
            pj=s["pj"], pg=s["pg"], pe=s["pe"], pp=s["pp"],
            gf=s["gf"], gc=s["gc"], dg=s["dg"], posicion=i + 1,
        )
        for i, s in enumerate(current_table)
    ]

    return EscenariosResponse(
        estado=estado,
        puntos=team_pts,
        posicion_actual=team_current_pos + 1,
        mensaje=mensaje,
        escenarios_favorables=favorable,
        escenarios_totales=total,
        escenarios_descripcion=escenarios_desc,
        tabla_actual=tabla_actual,
    )
