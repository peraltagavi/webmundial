from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.seleccion import Seleccion
from app.models.jugador import Jugador
from app.schemas.seleccion import SeleccionRead, SeleccionMundialRead
from app.schemas.partido import SimularPartidoRequest, SimularPartidoResponse
from app.schemas.comparador import ComparadorResponse
from app.schemas.partido_simulador import (
    ProbabilidadesResponse,
    SimularPorCodigoRequest,
    SimularPorCodigoResponse,
)
from app.services import simulador as svc
from app.data.equipos import EQUIPOS_MUNDIAL_2026, CODIGOS_2026, GRUPOS_2026

router = APIRouter(prefix="/simulador", tags=["simulador"])


@router.get("/selecciones", response_model=list[SeleccionMundialRead])
async def listar_selecciones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Seleccion).where(Seleccion.codigo_fifa.in_(CODIGOS_2026))
    )
    sels = {s.codigo_fifa: s for s in result.scalars().all()}
    ordered = sorted(EQUIPOS_MUNDIAL_2026, key=lambda e: e["nombre"])
    return [
        SeleccionMundialRead(
            id=sels[e["codigo"]].id,
            nombre=sels[e["codigo"]].nombre,
            codigo_fifa=e["codigo"],
            confederacion=sels[e["codigo"]].confederacion,
            ranking_fifa=sels[e["codigo"]].ranking_fifa,
            puntos_fifa=sels[e["codigo"]].puntos_fifa,
            puntos_fifa_ant=sels[e["codigo"]].puntos_fifa_ant,
            posicion_anterior=sels[e["codigo"]].posicion_anterior,
            grupo=e["grupo"],
        )
        for e in ordered
        if e["codigo"] in sels
    ]


@router.get("/selecciones/{seleccion_id}/stats")
async def stats_seleccion(seleccion_id: int, db: AsyncSession = Depends(get_db)):
    seleccion = await db.get(Seleccion, seleccion_id)
    if not seleccion:
        raise HTTPException(404, "Selección no encontrada")
    stats = await svc.stats_historicos(db, seleccion_id)
    return {"seleccion": SeleccionRead.model_validate(seleccion), "stats": stats}


@router.post("/partido", response_model=SimularPartidoResponse)
async def simular_partido(body: SimularPartidoRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await svc.simular_partido(db, body.equipo_local_id, body.equipo_visitante_id, body.fase)
    except Exception as e:
        raise HTTPException(400, str(e))


@router.get("/selecciones/{seleccion_id}/alineacion")
async def alineacion(seleccion_id: int, db: AsyncSession = Depends(get_db)):
    seleccion = await db.get(Seleccion, seleccion_id)
    if not seleccion:
        raise HTTPException(404, "Selección no encontrada")
    result = await db.execute(
        select(Jugador)
        .where(Jugador.seleccion_codigo == seleccion.codigo_fifa)
        .order_by(Jugador.valor_mercado_eur.desc())
    )
    jugadores = result.scalars().all()
    return {"seleccion": seleccion.nombre, "jugadores": jugadores}


@router.get("/comparador", response_model=ComparadorResponse)
async def comparador(
    codigo_a: str = Query(..., min_length=2, max_length=3, description="Código FIFA del equipo A"),
    codigo_b: str = Query(..., min_length=2, max_length=3, description="Código FIFA del equipo B"),
    db: AsyncSession = Depends(get_db),
):
    if codigo_a.upper() == codigo_b.upper():
        raise HTTPException(400, "Los dos equipos deben ser distintos")
    try:
        return await svc.comparador(db, codigo_a.upper(), codigo_b.upper())
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/probabilidades", response_model=ProbabilidadesResponse)
async def probabilidades(
    codigo_a: str = Query(..., min_length=2, max_length=3),
    codigo_b: str = Query(..., min_length=2, max_length=3),
    db: AsyncSession = Depends(get_db),
):
    if codigo_a.upper() == codigo_b.upper():
        raise HTTPException(400, "Los dos equipos deben ser distintos")
    try:
        return await svc.probabilidades(db, codigo_a.upper(), codigo_b.upper())
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/simular", response_model=SimularPorCodigoResponse)
async def simular_por_codigo(
    body: SimularPorCodigoRequest,
    db: AsyncSession = Depends(get_db),
):
    if body.codigo_a.upper() == body.codigo_b.upper():
        raise HTTPException(400, "Los dos equipos deben ser distintos")
    try:
        return await svc.simular_por_codigo(
            db, body.codigo_a.upper(), body.codigo_b.upper(), body.fase
        )
    except ValueError as e:
        raise HTTPException(404, str(e))
