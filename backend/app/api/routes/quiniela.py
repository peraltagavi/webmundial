from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.quiniela import Quiniela, Duelo
from app.schemas.quiniela import QuinielaCreate, QuinielaRead, DueloCreate, DueloRead
from app.services import quiniela as svc
from app.schemas.quiniela_picks import (
    RegistroRequest, UsuarioRead,
    PartidoPickRead, PicksRequest, PickRead, LiderEntry,
)
from app.services import quiniela_picks as picks_svc

router = APIRouter(prefix="/quiniela", tags=["quiniela"])

# ── Quiniela picks ────────────────────────────────────────────────────────────

@router.post("/registro", response_model=UsuarioRead)
async def registro(body: RegistroRequest, db: AsyncSession = Depends(get_db)):
    return await picks_svc.registro_o_login(db, body)


@router.get("/partidos", response_model=list[PartidoPickRead])
async def listar_partidos(db: AsyncSession = Depends(get_db)):
    return await picks_svc.get_partidos(db)


@router.post("/picks", status_code=204)
async def guardar_picks(body: PicksRequest, db: AsyncSession = Depends(get_db)):
    try:
        await picks_svc.save_picks(db, body.usuario_id, body.picks)
    except ValueError:
        raise HTTPException(status_code=400, detail="Este partido ya no acepta predicciones")


@router.get("/picks/{usuario_id}", response_model=list[PickRead])
async def obtener_picks(usuario_id: int, db: AsyncSession = Depends(get_db)):
    picks = await picks_svc.get_picks_usuario(db, usuario_id)
    return picks


@router.get("/lideres", response_model=list[LiderEntry])
async def lideres(db: AsyncSession = Depends(get_db)):
    return await picks_svc.get_lideres(db)


# ── Quiniela social (legacy) ──────────────────────────────────────────────────

@router.post("", response_model=QuinielaRead)
async def crear_quiniela(body: QuinielaCreate, db: AsyncSession = Depends(get_db)):
    return await svc.crear_quiniela(db, body)


@router.get("/{codigo_publico}", response_model=QuinielaRead)
async def obtener_quiniela(codigo_publico: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Quiniela).where(Quiniela.codigo_publico == codigo_publico)
    )
    quiniela = result.scalar_one_or_none()
    if not quiniela:
        raise HTTPException(404, "Quiniela no encontrada")
    return quiniela


@router.post("/duelo", response_model=DueloRead)
async def crear_duelo(body: DueloCreate, db: AsyncSession = Depends(get_db)):
    return await svc.crear_duelo(db, body)


@router.post("/duelo/{codigo_sala}/unirse")
async def unirse_duelo(
    codigo_sala: str, quiniela_rival_id: int, db: AsyncSession = Depends(get_db)
):
    try:
        return await svc.unirse_duelo(db, codigo_sala, quiniela_rival_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
