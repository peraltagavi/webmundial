from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update as sa_update, delete as sa_delete
from app.models.bracket import BracketCruce, BracketConfig
from app.schemas.bracket import CruceRead, BracketStatusResponse, BracketEstadoResponse
from app.models import poisson_model as pm

_RONDA_NEXT = {
    "dieciseisavos": "octavos",
    "octavos": "cuartos",
    "cuartos": "semis",
}

_RONDA_ORDEN = ["dieciseisavos", "octavos", "cuartos", "semis", "final", "tercero"]


async def _get_config(db: AsyncSession) -> BracketConfig:
    result = await db.execute(select(BracketConfig).limit(1))
    cfg = result.scalar_one_or_none()
    if not cfg:
        cfg = BracketConfig(desbloqueado=False,
                            mensaje_bloqueado="El bracket se habilitará cuando los 32 clasificados estén definidos.")
        db.add(cfg)
        await db.flush()
    return cfg


async def _get_or_create_cruce(db: AsyncSession, ronda: str, posicion: int) -> BracketCruce:
    result = await db.execute(
        select(BracketCruce).where(
            and_(BracketCruce.ronda == ronda, BracketCruce.posicion == posicion)
        )
    )
    cruce = result.scalar_one_or_none()
    if not cruce:
        cruce = BracketCruce(ronda=ronda, posicion=posicion, fue_penales=False)
        db.add(cruce)
        await db.flush()
    return cruce


async def _set_slot(db: AsyncSession, ronda: str, posicion: int, slot: str, codigo: str) -> None:
    cruce = await _get_or_create_cruce(db, ronda, posicion)
    if slot == "equipo_a":
        cruce.equipo_a = codigo
    else:
        cruce.equipo_b = codigo
    await db.flush()


async def _avanzar_ganador(db: AsyncSession, cruce: BracketCruce) -> None:
    ronda, pos, ganador = cruce.ronda, cruce.posicion, cruce.ganador
    if not ganador:
        return

    if ronda in _RONDA_NEXT:
        next_ronda = _RONDA_NEXT[ronda]
        next_pos = (pos + 1) // 2
        slot = "equipo_a" if pos % 2 == 1 else "equipo_b"
        await _set_slot(db, next_ronda, next_pos, slot, ganador)

    elif ronda == "semis":
        slot = "equipo_a" if pos == 1 else "equipo_b"
        await _set_slot(db, "final", 1, slot, ganador)
        loser = cruce.equipo_b if ganador == cruce.equipo_a else cruce.equipo_a
        if loser:
            await _set_slot(db, "tercero", 1, slot, loser)


async def get_bracket_status(db: AsyncSession) -> BracketStatusResponse:
    cfg = await _get_config(db)
    cruces: list[CruceRead] = []
    if cfg.desbloqueado:
        result = await db.execute(
            select(BracketCruce).order_by(BracketCruce.ronda, BracketCruce.posicion)
        )
        cruces = [CruceRead.model_validate(c) for c in result.scalars().all()]
    return BracketStatusResponse(
        desbloqueado=cfg.desbloqueado,
        mensaje_bloqueado=cfg.mensaje_bloqueado or "",
        cruces=cruces,
    )


async def get_bracket_estado(db: AsyncSession) -> BracketEstadoResponse:
    cfg = await _get_config(db)
    rondas: dict[str, list[CruceRead]] = {}
    if cfg.desbloqueado:
        result = await db.execute(
            select(BracketCruce).order_by(BracketCruce.posicion)
        )
        for c in result.scalars().all():
            rondas.setdefault(c.ronda, []).append(CruceRead.model_validate(c))
    return BracketEstadoResponse(
        desbloqueado=cfg.desbloqueado,
        mensaje_bloqueado=cfg.mensaje_bloqueado or "",
        rondas=rondas,
    )


async def simular_cruce(db: AsyncSession, cruce_id: int) -> CruceRead:
    result = await db.execute(select(BracketCruce).where(BracketCruce.id == cruce_id))
    cruce = result.scalar_one_or_none()
    if not cruce:
        raise ValueError(f"Cruce {cruce_id} no encontrado")
    if not cruce.equipo_a or not cruce.equipo_b:
        raise ValueError("El cruce no tiene ambos equipos definidos")
    if cruce.ganador:
        raise ValueError("El cruce ya tiene resultado")

    sim = pm.simular_partido(cruce.equipo_a, cruce.equipo_b, fase="octavos")
    cruce.goles_a = sim["goles_a"]
    cruce.goles_b = sim["goles_b"]
    cruce.fue_penales = sim["fue_penales"]
    cruce.ganador = cruce.equipo_a if sim["ganador"] == "A" else cruce.equipo_b

    await db.flush()
    await _avanzar_ganador(db, cruce)
    await db.commit()
    await db.refresh(cruce)
    return CruceRead.model_validate(cruce)


async def _limpiar_downstream(db: AsyncSession, cruce: BracketCruce) -> None:
    """Cascade-clean downstream cruces that were populated by this cruce's result."""
    if not cruce.ganador:
        return

    if cruce.ronda in _RONDA_NEXT:
        next_ronda = _RONDA_NEXT[cruce.ronda]
        next_pos = (cruce.posicion + 1) // 2
        slot = "equipo_a" if cruce.posicion % 2 == 1 else "equipo_b"
        result = await db.execute(
            select(BracketCruce).where(
                and_(BracketCruce.ronda == next_ronda, BracketCruce.posicion == next_pos)
            )
        )
        nc = result.scalar_one_or_none()
        if nc:
            if nc.ganador:
                await _limpiar_downstream(db, nc)
                nc.goles_a = None; nc.goles_b = None; nc.ganador = None; nc.fue_penales = False
            if slot == "equipo_a":
                nc.equipo_a = None
            else:
                nc.equipo_b = None
            await db.flush()

    elif cruce.ronda == "semis":
        slot = "equipo_a" if cruce.posicion == 1 else "equipo_b"
        for target_ronda in ("final", "tercero"):
            result = await db.execute(
                select(BracketCruce).where(
                    and_(BracketCruce.ronda == target_ronda, BracketCruce.posicion == 1)
                )
            )
            tc = result.scalar_one_or_none()
            if tc:
                if tc.ganador:
                    tc.goles_a = None; tc.goles_b = None; tc.ganador = None; tc.fue_penales = False
                if slot == "equipo_a":
                    tc.equipo_a = None
                else:
                    tc.equipo_b = None
                await db.flush()


async def limpiar_cruce(db: AsyncSession, cruce_id: int) -> CruceRead:
    result = await db.execute(select(BracketCruce).where(BracketCruce.id == cruce_id))
    cruce = result.scalar_one_or_none()
    if not cruce:
        raise ValueError(f"Cruce {cruce_id} no encontrado")
    if not cruce.ganador:
        return CruceRead.model_validate(cruce)
    await _limpiar_downstream(db, cruce)
    cruce.goles_a = None; cruce.goles_b = None; cruce.ganador = None; cruce.fue_penales = False
    await db.commit()
    await db.refresh(cruce)
    return CruceRead.model_validate(cruce)


async def reiniciar_bracket(db: AsyncSession) -> None:
    await db.execute(sa_delete(BracketCruce).where(BracketCruce.ronda != "dieciseisavos"))
    await db.execute(
        sa_update(BracketCruce)
        .where(BracketCruce.ronda == "dieciseisavos")
        .values(goles_a=None, goles_b=None, ganador=None, fue_penales=False)
    )
    await db.commit()


async def avanzar(db: AsyncSession, cruce_id: int, ganador: str) -> CruceRead:
    result = await db.execute(select(BracketCruce).where(BracketCruce.id == cruce_id))
    cruce = result.scalar_one_or_none()
    if not cruce:
        raise ValueError(f"Cruce {cruce_id} no encontrado")
    if ganador not in (cruce.equipo_a, cruce.equipo_b):
        raise ValueError(f"'{ganador}' no es equipo de este cruce")

    cruce.ganador = ganador
    await db.flush()
    await _avanzar_ganador(db, cruce)
    await db.commit()
    await db.refresh(cruce)
    return CruceRead.model_validate(cruce)
