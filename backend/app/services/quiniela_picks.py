from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.quiniela_picks import QuinielaUsuario, QuinielaPartido, QuinielaPick
from app.schemas.quiniela_picks import RegistroRequest, PickInput, PartidoPickRead
from datetime import datetime, timezone, timedelta


async def registro_o_login(db: AsyncSession, body: RegistroRequest) -> QuinielaUsuario:
    result = await db.execute(
        select(QuinielaUsuario).where(QuinielaUsuario.email == body.email)
    )
    usuario = result.scalar_one_or_none()
    if usuario:
        return usuario
    usuario = QuinielaUsuario(nombre=body.nombre, email=body.email)
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


def _is_bloqueado(partido: QuinielaPartido) -> bool:
    if partido.fecha_hora is None:
        return False
    cutoff = partido.fecha_hora - timedelta(minutes=10)
    return datetime.now(timezone.utc) >= cutoff


async def get_partidos(db: AsyncSession) -> list[PartidoPickRead]:
    result = await db.execute(
        select(QuinielaPartido).order_by(QuinielaPartido.fecha, QuinielaPartido.id)
    )
    partidos = list(result.scalars().all())
    out = []
    for p in partidos:
        d = PartidoPickRead.model_validate(p)
        d.bloqueado = _is_bloqueado(p)
        out.append(d)
    return out


async def save_picks(
    db: AsyncSession, usuario_id: int, picks: list[PickInput]
) -> None:
    partido_ids = [p.partido_id for p in picks]
    partidos_result = await db.execute(
        select(QuinielaPartido).where(QuinielaPartido.id.in_(partido_ids))
    )
    partidos_map = {p.id: p for p in partidos_result.scalars().all()}

    for pick in picks:
        partido = partidos_map.get(pick.partido_id)
        if partido and _is_bloqueado(partido):
            raise ValueError(f"partido:{pick.partido_id}")

        result = await db.execute(
            select(QuinielaPick).where(
                QuinielaPick.usuario_id == usuario_id,
                QuinielaPick.partido_id == pick.partido_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.goles_local = pick.goles_local
            existing.goles_visitante = pick.goles_visitante
        else:
            db.add(
                QuinielaPick(
                    usuario_id=usuario_id,
                    partido_id=pick.partido_id,
                    goles_local=pick.goles_local,
                    goles_visitante=pick.goles_visitante,
                )
            )
    await db.commit()


async def get_picks_usuario(
    db: AsyncSession, usuario_id: int
) -> list[QuinielaPick]:
    result = await db.execute(
        select(QuinielaPick).where(QuinielaPick.usuario_id == usuario_id)
    )
    return list(result.scalars().all())


def _calcular_puntos(pick: QuinielaPick, partido: QuinielaPartido) -> int:
    if partido.goles_local_real is None or partido.goles_visitante_real is None:
        return 0
    gl, gv = pick.goles_local, pick.goles_visitante
    rl, rv = partido.goles_local_real, partido.goles_visitante_real
    if gl == rl and gv == rv:
        return 3
    if gl - gv == rl - rv:
        return 2
    if (gl > gv and rl > rv) or (gl == gv and rl == rv) or (gl < gv and rl < rv):
        return 1
    return 0


async def get_lideres(db: AsyncSession) -> list[dict]:
    users_result = await db.execute(select(QuinielaUsuario))
    users = list(users_result.scalars().all())

    partidos_result = await db.execute(
        select(QuinielaPartido).where(QuinielaPartido.cerrado == True)  # noqa: E712
    )
    partidos_map = {p.id: p for p in partidos_result.scalars().all()}

    lideres = []
    for user in users:
        picks_result = await db.execute(
            select(QuinielaPick).where(QuinielaPick.usuario_id == user.id)
        )
        picks = list(picks_result.scalars().all())
        puntos = sum(
            _calcular_puntos(p, partidos_map[p.partido_id])
            for p in picks
            if p.partido_id in partidos_map
        )
        lideres.append(
            {
                "usuario_id": user.id,
                "nombre": user.nombre,
                "puntos": puntos,
                "picks_completados": len(picks),
            }
        )

    lideres.sort(key=lambda x: (-x["puntos"], -x["picks_completados"]))
    return lideres[:10]
