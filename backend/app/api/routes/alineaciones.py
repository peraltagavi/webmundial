import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.jugador import Jugador
from app.schemas.alineacion import JugadorAlineacionRead, RatingRequest, RatingResponse
from app.data.equipos import CODIGOS_2026

router = APIRouter(prefix="/alineaciones", tags=["alineaciones"])

_TODAY = datetime.date.today()

# Cached global min/max for valor_mercado_eur (computed once per process lifetime)
_GLOBAL: dict | None = None


def _edad(fecha: datetime.date | None) -> int | None:
    if not fecha:
        return None
    return (_TODAY - fecha).days // 365


async def _global_stats(db: AsyncSession) -> dict:
    global _GLOBAL
    if _GLOBAL is None:
        result = await db.execute(
            select(
                func.min(Jugador.valor_mercado_eur).label("min_v"),
                func.max(Jugador.valor_mercado_eur).label("max_v"),
            )
        )
        row = result.one()
        _GLOBAL = {
            "min_v": float(row.min_v or 0),
            "max_v": float(row.max_v or 1),
        }
    return _GLOBAL


def _calc_score(j: Jugador, min_v: float, max_v: float) -> float:
    valor = float(j.valor_mercado_eur or 0)
    rng = max_v - min_v
    score_base = ((valor - min_v) / rng * 60) if rng > 0 else 0
    score_exp  = (min(j.internacionalidades or 0, 200) / 200) * 25
    score_gol  = (min(j.goles_seleccion or 0,   50)  / 50)  * 15
    return round(score_base + score_exp + score_gol, 1)


def _zona(posicion: str | None) -> str:
    if not posicion:
        return "unknown"
    p = posicion.lower()
    if any(k in p for k in ["portero", "defensa", "lateral", "líbero", "libero", "carrilero"]):
        return "defensa"
    if any(k in p for k in ["medio", "centrocampista", "volante", "interior", "pivote"]):
        return "mediocampo"
    if any(k in p for k in ["delantero", "extremo", "ariete", "punta", "mediapunta"]):
        return "ataque"
    return "unknown"


@router.get("/jugadores/{codigo_seleccion}", response_model=list[JugadorAlineacionRead])
async def jugadores_seleccion(
    codigo_seleccion: str,
    db: AsyncSession = Depends(get_db),
):
    codigo = codigo_seleccion.upper()
    if codigo not in CODIGOS_2026:
        raise HTTPException(400, f"'{codigo}' no es una selección del Mundial 2026")
    stats = await _global_stats(db)
    result = await db.execute(
        select(Jugador)
        .where(Jugador.seleccion_codigo == codigo)
        .order_by(Jugador.valor_mercado_eur.desc().nullslast())
    )
    jugadores = result.scalars().all()
    if not jugadores:
        raise HTTPException(404, f"Sin jugadores para '{codigo}'")
    return [
        JugadorAlineacionRead(
            id=j.id,
            nombre=j.nombre,
            posicion=j.posicion,
            club=j.club,
            edad=_edad(j.fecha_nacimiento),
            valor_mercado_eur=float(j.valor_mercado_eur) if j.valor_mercado_eur else None,
            internacionalidades=j.internacionalidades,
            goles_seleccion=j.goles_seleccion,
            numero_camiseta=j.numero_camiseta,
            score=_calc_score(j, stats["min_v"], stats["max_v"]),
        )
        for j in jugadores
    ]


@router.post("/rating", response_model=RatingResponse)
async def calcular_rating(body: RatingRequest, db: AsyncSession = Depends(get_db)):
    if not body.jugadores_ids:
        return RatingResponse(defensa=0, mediocampo=0, ataque=0, overall=0, scores={})

    stats = await _global_stats(db)
    result = await db.execute(
        select(Jugador).where(Jugador.id.in_(body.jugadores_ids))
    )
    jugadores = result.scalars().all()

    zones: dict[str, list[float]] = {"defensa": [], "mediocampo": [], "ataque": []}
    scores: dict[int, float] = {}

    for j in jugadores:
        s = _calc_score(j, stats["min_v"], stats["max_v"])
        scores[j.id] = s
        z = _zona(j.posicion)
        if z in zones:
            zones[z].append(s)

    def avg(lst: list[float]) -> float:
        return round(sum(lst) / len(lst)) if lst else 0

    d = avg(zones["defensa"])
    m = avg(zones["mediocampo"])
    a = avg(zones["ataque"])
    o = avg([x for x in [d, m, a] if x > 0])

    return RatingResponse(defensa=d, mediocampo=m, ataque=a, overall=o, scores=scores)
