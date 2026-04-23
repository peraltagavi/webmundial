import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.jugador import Jugador
from app.schemas.alineacion import JugadorAlineacionRead

router = APIRouter(prefix="/alineaciones", tags=["alineaciones"])

_TODAY = datetime.date.today()


def _edad(fecha: datetime.date | None) -> int | None:
    if not fecha:
        return None
    return (_TODAY - fecha).days // 365


@router.get("/jugadores/{codigo_seleccion}", response_model=list[JugadorAlineacionRead])
async def jugadores_seleccion(
    codigo_seleccion: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Jugador)
        .where(Jugador.seleccion_codigo == codigo_seleccion.upper())
        .order_by(Jugador.valor_mercado_eur.desc().nullslast())
    )
    jugadores = result.scalars().all()
    if not jugadores:
        raise HTTPException(404, f"Sin jugadores para '{codigo_seleccion}'")
    return [
        JugadorAlineacionRead(
            id=j.id,
            nombre=j.nombre,
            posicion=j.posicion,
            club=j.club,
            edad=_edad(j.fecha_nacimiento),
            valor_mercado_eur=float(j.valor_mercado_eur) if j.valor_mercado_eur else None,
            internacionalidades=j.internacionalidades,
            numero_camiseta=j.numero_camiseta,
        )
        for j in jugadores
    ]
