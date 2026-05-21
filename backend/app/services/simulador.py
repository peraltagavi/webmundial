import random
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.models.seleccion import Seleccion
from app.models.partido_historico import PartidoHistorico
from app.models import poisson_model as pm
from app.data.estadisticas_historicas import STATS
from app.schemas.partido import SimularPartidoResponse
from app.schemas.comparador import (
    ComparadorResponse, H2HStats, PartidoResumen,
    Rendimiento, MejorResultado,
)
from app.schemas.partido_simulador import (
    ProbabilidadesResponse,
    TeamAnalisis,
    UltimoPartidoEquipo,
    SimularPorCodigoResponse,
    MatrizEntry,
)


# ─── Helpers de fuerza / probabilidades ──────────────────────────────────────

def _fuerza_equipo(seleccion: Seleccion) -> float:
    if seleccion.puntos_fifa:
        return min(seleccion.puntos_fifa / 2000.0, 1.0)
    if seleccion.ranking_fifa:
        return max(1.0 - (seleccion.ranking_fifa / 210.0), 0.1)
    return 0.5


def _probabilidades(fuerza_local: float, fuerza_visit: float) -> tuple[float, float, float]:
    delta = fuerza_local - fuerza_visit
    prob_local = 1 / (1 + math.exp(-5 * delta))
    prob_visit = 1 / (1 + math.exp(5 * delta))
    prob_empate = 1 - abs(prob_local - prob_visit) * 0.8
    total = prob_local + prob_empate + prob_visit
    return prob_local / total, prob_empate / total, prob_visit / total


def _goles_esperados(fuerza: float) -> float:
    return 0.5 + fuerza * 2.5


# ─── Stage ranking (valores reales del CSV) ───────────────────────────────────

_STAGE_RANK: dict[str, int] = {
    "final":               100,
    "final round":          90,   # 1950 WC (formato ronda final)
    "third-place match":    70,
    "semi-finals":          60,
    "semi-final":           60,
    "second group stage":   50,   # 1974, 1978 WC
    "quarter-finals":       40,
    "quarter-final":        40,
    "round of 16":          25,
    "group stage":          10,
}


def _stage_rank(stage: str | None) -> int:
    return _STAGE_RANK.get((stage or "").lower(), 5)


def _stage_label(stage: str | None, won: bool) -> str:
    s = (stage or "").lower()
    if s == "final":
        return "Campeón" if won else "Subcampeón"
    if s == "final round":
        return "Campeón" if won else "Finalista (ronda final)"
    if s == "third-place match":
        return "3er lugar" if won else "4o lugar"
    if s in ("semi-finals", "semi-final"):
        return "Semifinalista"
    if s == "second group stage":
        return "2ª fase de grupos"
    if s in ("quarter-finals", "quarter-final"):
        return "Cuartofinalista"
    if s == "round of 16":
        return "Octavos de final"
    return "Fase de grupos"


# ─── Servicio: simular partido ────────────────────────────────────────────────

async def simular_partido(
    db: AsyncSession,
    equipo_local_id: int,
    equipo_visitante_id: int,
    fase: str = "grupos",
) -> SimularPartidoResponse:
    local = await db.get(Seleccion, equipo_local_id)
    visitante = await db.get(Seleccion, equipo_visitante_id)

    f_local = _fuerza_equipo(local)
    f_visit = _fuerza_equipo(visitante)
    p_local, p_empate, p_visit = _probabilidades(f_local, f_visit)

    lambda_local = _goles_esperados(f_local)
    lambda_visit = _goles_esperados(f_visit)

    goles_l = random.choices(
        range(8),
        weights=[math.exp(-lambda_local) * lambda_local**k / math.factorial(k) for k in range(8)],
    )[0]
    goles_v = random.choices(
        range(8),
        weights=[math.exp(-lambda_visit) * lambda_visit**k / math.factorial(k) for k in range(8)],
    )[0]

    penales_l = penales_v = None
    if goles_l == goles_v and fase != "grupos":
        penales_l = random.randint(3, 5)
        penales_v = random.randint(3, 5)
        while penales_l == penales_v:
            penales_v = random.randint(3, 5)

    return SimularPartidoResponse(
        goles_local=goles_l,
        goles_visitante=goles_v,
        penales_local=penales_l,
        penales_visitante=penales_v,
        probabilidad_local=round(p_local, 3),
        probabilidad_empate=round(p_empate, 3),
        probabilidad_visitante=round(p_visit, 3),
    )


# ─── Servicio: stats históricos de una selección ────────────────────────────

async def _partidos_de(db: AsyncSession, codigo: str) -> list[PartidoHistorico]:
    result = await db.execute(
        select(PartidoHistorico).where(
            and_(
                or_(
                    PartidoHistorico.home_team_code == codigo,
                    PartidoHistorico.away_team_code == codigo,
                ),
                PartidoHistorico.tournament_name.ilike("%Men%"),
            )
        )
    )
    return result.scalars().all()


def _calc_rendimiento(partidos: list[PartidoHistorico], codigo: str) -> Rendimiento:
    ganados = empatados = perdidos = goles_favor = goles_contra = 0
    mundiales: set[str] = set()

    for p in partidos:
        es_local = p.home_team_code == codigo
        gf = p.home_team_score if es_local else p.away_team_score
        gc = p.away_team_score if es_local else p.home_team_score
        if gf is None or gc is None:
            continue
        goles_favor += gf
        goles_contra += gc

        # PE = empate normal O cualquier partido que fue a penales
        if p.draw or p.penalty_shootout:
            empatados += 1
        # PG = ganó en tiempo regular o prórroga, SIN penales
        elif not p.penalty_shootout:
            won = bool(p.home_team_win if es_local else p.away_team_win)
            if won:
                ganados += 1
            else:
                perdidos += 1

        if p.tournament_id:
            mundiales.add(p.tournament_id)

    total = ganados + empatados + perdidos
    return Rendimiento(
        partidos=total,
        ganados=ganados,
        empatados=empatados,
        perdidos=perdidos,
        goles_favor=goles_favor,
        goles_contra=goles_contra,
        diferencia_goles=goles_favor - goles_contra,
        porcentaje_victorias=round(ganados / total * 100, 1) if total else 0,
        mundiales_disputados=len(mundiales),
    )


def _calc_mejor_resultado(partidos: list[PartidoHistorico], codigo: str) -> MejorResultado:
    # Para cada Mundial, encontrar la fase más lejana alcanzada
    torneos: dict[str, dict] = {}

    for p in partidos:
        tid = p.tournament_id or p.tournament_name or "?"
        rank = _stage_rank(p.stage_name)
        if tid not in torneos:
            torneos[tid] = {"name": p.tournament_name or tid, "rank": 0, "stage": "", "won": False}

        if rank > torneos[tid]["rank"]:
            torneos[tid]["rank"] = rank
            torneos[tid]["stage"] = p.stage_name or ""
            es_local = p.home_team_code == codigo
            torneos[tid]["won"] = bool(p.home_team_win if es_local else p.away_team_win)

    if not torneos:
        return MejorResultado(label="Sin datos", torneos=[])

    # Mejor resultado global: rank máximo, desempatando por victoria
    best_score = max(t["rank"] * 2 + (1 if t["won"] else 0) for t in torneos.values())
    best_torneos = [
        t["name"] for t in torneos.values()
        if t["rank"] * 2 + (1 if t["won"] else 0) == best_score
    ]
    # Toma cualquiera para el label (todos tienen igual resultado)
    sample = next(t for t in torneos.values() if t["rank"] * 2 + (1 if t["won"] else 0) == best_score)
    label = _stage_label(sample["stage"], sample["won"])

    return MejorResultado(label=label, torneos=sorted(best_torneos))


async def stats_historicos(db: AsyncSession, seleccion_id: int) -> dict:
    seleccion = await db.get(Seleccion, seleccion_id)
    if not seleccion:
        return {}
    s = STATS.get(seleccion.codigo_fifa)
    if not s:
        return {}
    return {
        "partidos":             s["pj"],
        "ganados":              s["pg"],
        "empatados":            s["pe"],
        "perdidos":             s["pp"],
        "goles_favor":          s["gf"],
        "goles_contra":         s["gc"],
        "diferencia_goles":     s["dg"],
        "porcentaje_victorias": s["porcentaje_victorias"],
        "mundiales_disputados": s["mundiales"],
    }


# ─── Servicio: comparador ─────────────────────────────────────────────────────

async def comparador(
    db: AsyncSession,
    codigo_a: str,
    codigo_b: str,
) -> ComparadorResponse:
    # 1. Fetch selecciones
    res_a = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo_a))
    res_b = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo_b))
    equipo_a = res_a.scalar_one_or_none()
    equipo_b = res_b.scalar_one_or_none()

    if not equipo_a:
        raise ValueError(f"Selección '{codigo_a}' no encontrada")
    if not equipo_b:
        raise ValueError(f"Selección '{codigo_b}' no encontrada")

    # 2. Partidos head-to-head (ordenados por fecha desc, solo Men's)
    res_h2h = await db.execute(
        select(PartidoHistorico)
        .where(
            and_(
                or_(
                    and_(
                        PartidoHistorico.home_team_code == codigo_a,
                        PartidoHistorico.away_team_code == codigo_b,
                    ),
                    and_(
                        PartidoHistorico.home_team_code == codigo_b,
                        PartidoHistorico.away_team_code == codigo_a,
                    ),
                ),
                PartidoHistorico.tournament_name.ilike("%Men%"),
            )
        )
        .order_by(PartidoHistorico.match_date.desc())
    )
    h2h_partidos = res_h2h.scalars().all()

    # Calcular H2H stats con misma lógica PG/PE/PP
    victorias_a = victorias_b = empates = goles_a = goles_b = 0
    for p in h2h_partidos:
        if p.home_team_score is None or p.away_team_score is None:
            continue
        a_es_local = p.home_team_code == codigo_a
        gf_a = p.home_team_score if a_es_local else p.away_team_score
        gf_b = p.away_team_score if a_es_local else p.home_team_score
        goles_a += gf_a
        goles_b += gf_b
        if p.draw or p.penalty_shootout:
            empates += 1
        elif not p.penalty_shootout:
            won_a = bool(p.home_team_win if a_es_local else p.away_team_win)
            if won_a:
                victorias_a += 1
            else:
                victorias_b += 1

    h2h = H2HStats(
        total=len(h2h_partidos),
        victorias_a=victorias_a,
        victorias_b=victorias_b,
        empates=empates,
        goles_a=goles_a,
        goles_b=goles_b,
    )

    # Últimos 5 enfrentamientos directos
    ultimos_5 = [
        PartidoResumen(
            fecha=p.match_date,
            torneo=p.tournament_name,
            equipo_local=p.home_team_name or p.home_team_code,
            equipo_visitante=p.away_team_name or p.away_team_code,
            goles_local=p.home_team_score,
            goles_visitante=p.away_team_score,
            ronda=p.stage_name,
            penales_local=p.home_team_score_penalties if p.penalty_shootout else None,
            penales_visitante=p.away_team_score_penalties if p.penalty_shootout else None,
            fue_penales=bool(p.penalty_shootout),
        )
        for p in h2h_partidos[:5]
    ]

    # 3. Rendimiento desde stats estáticas; partidos solo para mejor resultado
    def _stats_to_rendimiento(codigo: str) -> Rendimiento:
        s = STATS.get(codigo, {})
        pj = s.get("pj", 0)
        pg = s.get("pg", 0)
        return Rendimiento(
            partidos=pj,
            ganados=pg,
            empatados=s.get("pe", 0),
            perdidos=s.get("pp", 0),
            goles_favor=s.get("gf", 0),
            goles_contra=s.get("gc", 0),
            diferencia_goles=s.get("dg", 0),
            porcentaje_victorias=round(pg / pj * 100, 1) if pj else 0.0,
            mundiales_disputados=s.get("mundiales", 0),
        )

    rendimiento_a = _stats_to_rendimiento(codigo_a)
    rendimiento_b = _stats_to_rendimiento(codigo_b)

    partidos_a = await _partidos_de(db, codigo_a)
    partidos_b = await _partidos_de(db, codigo_b)

    mejor_a = _calc_mejor_resultado(partidos_a, codigo_a)
    mejor_b = _calc_mejor_resultado(partidos_b, codigo_b)

    from app.schemas.seleccion import SeleccionRead
    return ComparadorResponse(
        equipo_a=SeleccionRead.model_validate(equipo_a),
        equipo_b=SeleccionRead.model_validate(equipo_b),
        head_to_head=h2h,
        ultimos_5=ultimos_5,
        rendimiento_a=rendimiento_a,
        rendimiento_b=rendimiento_b,
        mejor_resultado_a=mejor_a,
        mejor_resultado_b=mejor_b,
    )


# ─── Helpers para probabilidades enriquecidas ─────────────────────────────────

def _ultimos_5_equipo(
    partidos: list[PartidoHistorico], codigo: str
) -> list[UltimoPartidoEquipo]:
    sorted_p = sorted(
        [p for p in partidos if p.match_date is not None],
        key=lambda p: p.match_date,
        reverse=True,
    )
    result = []
    for p in sorted_p[:5]:
        es_local = p.home_team_code == codigo
        gf = p.home_team_score if es_local else p.away_team_score
        gc = p.away_team_score if es_local else p.home_team_score
        rival = (
            (p.away_team_name or p.away_team_code)
            if es_local
            else (p.home_team_name or p.home_team_code)
        )
        if gf is None or gc is None:
            res = "?"
        elif gf > gc:
            res = "G"
        elif gf == gc:
            res = "E"
        else:
            res = "P"
        result.append(UltimoPartidoEquipo(
            fecha=str(p.match_date) if p.match_date else None,
            rival=rival,
            goles_favor=gf,
            goles_contra=gc,
            resultado=res,
        ))
    return result


def _calc_goles_promedio(partidos: list[PartidoHistorico], codigo: str) -> float:
    total_goles = total_p = 0
    for p in partidos:
        es_local = p.home_team_code == codigo
        gf = p.home_team_score if es_local else p.away_team_score
        if gf is not None:
            total_goles += gf
            total_p += 1
    return round(total_goles / total_p, 2) if total_p else 1.0


def _calc_porteria_cero(partidos: list[PartidoHistorico], codigo: str) -> float:
    total = clean = 0
    for p in partidos:
        es_local = p.home_team_code == codigo
        gc = p.away_team_score if es_local else p.home_team_score
        if gc is not None:
            total += 1
            if gc == 0:
                clean += 1
    return round(clean / total * 100, 1) if total else 0.0


def _prob_enriquecida(
    sel_a: Seleccion,
    sel_b: Seleccion,
    rend_a: Rendimiento,
    rend_b: Rendimiento,
    h2h: H2HStats,
) -> tuple[float, float, float]:
    # Component 1: head-to-head (weight 40% if available)
    if h2h.total > 0:
        h2h_a = h2h.victorias_a / h2h.total
        h2h_b = h2h.victorias_b / h2h.total
        h2h_e = h2h.empates / h2h.total
        has_h2h = True
    else:
        h2h_a = h2h_b = h2h_e = 0.0
        has_h2h = False

    # Component 2: FIFA ranking (weight 35%)
    r_a = float(sel_a.ranking_fifa or 100)
    r_b = float(sel_b.ranking_fifa or 100)
    str_a = 1.0 / r_a
    str_b = 1.0 / r_b
    str_total = str_a + str_b
    raw_a = str_a / str_total
    raw_b = str_b / str_total
    draw_rank = (1.0 - abs(raw_a - raw_b)) * 0.28
    rk_a = raw_a * (1.0 - draw_rank)
    rk_b = raw_b * (1.0 - draw_rank)
    rk_total = rk_a + draw_rank + rk_b
    rank_prob_a = rk_a / rk_total
    rank_prob_e = draw_rank / rk_total
    rank_prob_b = rk_b / rk_total

    # Component 3: WC win rate (weight 25%)
    wr_a = rend_a.porcentaje_victorias / 100.0
    wr_b = rend_b.porcentaje_victorias / 100.0
    wr_sum = wr_a + wr_b
    if wr_sum > 0:
        raw_wc_a = wr_a / wr_sum
        raw_wc_b = wr_b / wr_sum
    else:
        raw_wc_a = raw_wc_b = 0.5
    draw_wc = (1.0 - abs(raw_wc_a - raw_wc_b)) * 0.22
    wc_a = raw_wc_a * (1.0 - draw_wc)
    wc_b = raw_wc_b * (1.0 - draw_wc)
    wc_total = wc_a + draw_wc + wc_b
    wc_prob_a = wc_a / wc_total
    wc_prob_e = draw_wc / wc_total
    wc_prob_b = wc_b / wc_total

    # Weights — redistribute H2H weight if no history
    if has_h2h:
        w_h, w_r, w_w = 0.40, 0.35, 0.25
    else:
        w_h = 0.0
        w_r = 0.35 + 0.40 * (35.0 / 60.0)
        w_w = 0.25 + 0.40 * (25.0 / 60.0)

    prob_a = w_h * h2h_a + w_r * rank_prob_a + w_w * wc_prob_a
    prob_e = w_h * h2h_e + w_r * rank_prob_e + w_w * wc_prob_e
    prob_b = w_h * h2h_b + w_r * rank_prob_b + w_w * wc_prob_b
    total = prob_a + prob_e + prob_b
    return round(prob_a / total * 100, 1), round(prob_e / total * 100, 1), round(prob_b / total * 100, 1)


# ─── Servicio: probabilidades con modelo Poisson ─────────────────────────────

async def probabilidades(
    db: AsyncSession,
    codigo_a: str,
    codigo_b: str,
) -> ProbabilidadesResponse:
    res_a = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo_a))
    res_b = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo_b))
    sel_a = res_a.scalar_one_or_none()
    sel_b = res_b.scalar_one_or_none()
    if not sel_a:
        raise ValueError(f"Selección '{codigo_a}' no encontrada")
    if not sel_b:
        raise ValueError(f"Selección '{codigo_b}' no encontrada")

    partidos_a = await _partidos_de(db, codigo_a)
    partidos_b = await _partidos_de(db, codigo_b)

    def _static_wc(codigo: str) -> tuple[int, float]:
        s = STATS.get(codigo, {})
        pj = s.get("pj", 0)
        pg = s.get("pg", 0)
        return s.get("mundiales", 0), (round(pg / pj * 100, 1) if pj else 0.0)

    mundiales_a, pct_vic_a = _static_wc(codigo_a)
    mundiales_b, pct_vic_b = _static_wc(codigo_b)

    # H2H
    res_h2h = await db.execute(
        select(PartidoHistorico)
        .where(
            and_(
                or_(
                    and_(
                        PartidoHistorico.home_team_code == codigo_a,
                        PartidoHistorico.away_team_code == codigo_b,
                    ),
                    and_(
                        PartidoHistorico.home_team_code == codigo_b,
                        PartidoHistorico.away_team_code == codigo_a,
                    ),
                ),
                PartidoHistorico.tournament_name.ilike("%Men%"),
            )
        )
        .order_by(PartidoHistorico.match_date.desc())
    )
    h2h_partidos = res_h2h.scalars().all()
    v_a = v_b = emp = g_a = g_b = 0
    for p in h2h_partidos:
        if p.home_team_score is None or p.away_team_score is None:
            continue
        al = p.home_team_code == codigo_a
        fa = p.home_team_score if al else p.away_team_score
        fb = p.away_team_score if al else p.home_team_score
        g_a += fa; g_b += fb
        if p.draw or p.penalty_shootout:
            emp += 1
        elif not p.penalty_shootout:
            won_a = bool(p.home_team_win if al else p.away_team_win)
            if won_a:
                v_a += 1
            else:
                v_b += 1
    h2h = H2HStats(total=len(h2h_partidos), victorias_a=v_a, victorias_b=v_b,
                   empates=emp, goles_a=g_a, goles_b=g_b)

    # Probabilidades y lambdas desde el modelo Poisson
    la, lb = pm.calcular_lambda(codigo_a, codigo_b)
    from app.models.poisson_model import _build_matrix, _probs_from_matrix
    cells = _build_matrix(la, lb)
    prob_a_f, prob_e_f, prob_b_f = _probs_from_matrix(cells)
    prob_a  = round(prob_a_f * 100, 1)
    prob_e  = round(prob_e_f * 100, 1)
    prob_b_ = round(prob_b_f * 100, 1)
    matriz  = [MatrizEntry(i=i, j=j, prob=round(p, 6)) for i, j, p in cells[:9]]

    def make_team(sel: Seleccion, mundiales: int, pct_vic: float, partidos: list, codigo: str) -> TeamAnalisis:
        return TeamAnalisis(
            nombre=sel.nombre,
            codigo_fifa=sel.codigo_fifa,
            ranking_fifa=sel.ranking_fifa,
            puntos_fifa=sel.puntos_fifa,
            goles_promedio=_calc_goles_promedio(partidos, codigo),
            porcentaje_porteria_cero=_calc_porteria_cero(partidos, codigo),
            mundiales_disputados=mundiales,
            porcentaje_victorias=pct_vic,
            ultimos_5=_ultimos_5_equipo(partidos, codigo),
        )

    return ProbabilidadesResponse(
        equipo_a=make_team(sel_a, mundiales_a, pct_vic_a, partidos_a, codigo_a),
        equipo_b=make_team(sel_b, mundiales_b, pct_vic_b, partidos_b, codigo_b),
        prob_a=prob_a,
        prob_empate=prob_e,
        prob_b=prob_b_,
        total_h2h=h2h.total,
        lambda_a=round(la, 4),
        lambda_b=round(lb, 4),
        matriz=matriz,
    )


# ─── Servicio: simulación por código FIFA (modelo Poisson) ───────────────────

async def simular_por_codigo(
    db: AsyncSession,
    codigo_a: str,
    codigo_b: str,
    fase: str = "grupos",
) -> SimularPorCodigoResponse:
    # Validar que existen en nuestra DB
    res_a = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo_a))
    res_b = await db.execute(select(Seleccion).where(Seleccion.codigo_fifa == codigo_b))
    if not res_a.scalar_one_or_none():
        raise ValueError(f"Selección '{codigo_a}' no encontrada")
    if not res_b.scalar_one_or_none():
        raise ValueError(f"Selección '{codigo_b}' no encontrada")

    res = pm.simular_partido(codigo_a, codigo_b, fase)
    return SimularPorCodigoResponse(
        goles_a=res["goles_a"],
        goles_b=res["goles_b"],
        ganador=res["ganador"].lower() if res["ganador"] in ("A", "B") else "empate",
        lambda_a=res["lambda_a"],
        lambda_b=res["lambda_b"],
        prob_a=res["prob_a"],
        prob_empate=res["prob_empate"],
        prob_b=res["prob_b"],
        fue_prorroga=res["fue_prorroga"],
        fue_penales=res["fue_penales"],
        matriz=[MatrizEntry(**m) for m in res["matriz"]],
    )
