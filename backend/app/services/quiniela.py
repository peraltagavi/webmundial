import random
import string
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.quiniela import Quiniela, Duelo
from app.schemas.quiniela import QuinielaCreate, DueloCreate


def _generar_codigo(largo: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=largo))


async def crear_quiniela(db: AsyncSession, data: QuinielaCreate) -> Quiniela:
    quiniela = Quiniela(
        codigo_publico=_generar_codigo(12),
        nombre_usuario=data.nombre_usuario,
        predicciones=data.predicciones,
        es_publica=data.es_publica,
    )
    db.add(quiniela)
    await db.commit()
    await db.refresh(quiniela)
    return quiniela


async def crear_duelo(db: AsyncSession, data: DueloCreate) -> Duelo:
    duelo = Duelo(
        codigo_sala=_generar_codigo(8),
        quiniela_retador_id=data.quiniela_retador_id,
    )
    db.add(duelo)
    await db.commit()
    await db.refresh(duelo)
    return duelo


async def unirse_duelo(db: AsyncSession, codigo_sala: str, quiniela_rival_id: int) -> Duelo:
    from sqlalchemy import select
    result = await db.execute(select(Duelo).where(Duelo.codigo_sala == codigo_sala, Duelo.activo == True))
    duelo = result.scalar_one_or_none()
    if not duelo:
        raise ValueError("Sala no encontrada o inactiva")
    duelo.quiniela_rival_id = quiniela_rival_id
    await db.commit()
    await db.refresh(duelo)
    return duelo
