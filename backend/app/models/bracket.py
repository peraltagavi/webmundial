from sqlalchemy import Integer, String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime
from app.db.base import Base
import datetime


class BracketCruce(Base):
    __tablename__ = "bracket_cruces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ronda: Mapped[str] = mapped_column(String(20), nullable=False)
    posicion: Mapped[int] = mapped_column(Integer, nullable=False)
    equipo_a: Mapped[str | None] = mapped_column(String(3))
    equipo_b: Mapped[str | None] = mapped_column(String(3))
    goles_a: Mapped[int | None] = mapped_column(Integer)
    goles_b: Mapped[int | None] = mapped_column(Integer)
    ganador: Mapped[str | None] = mapped_column(String(3))
    fue_penales: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime.datetime | None] = mapped_column(DateTime)


class BracketConfig(Base):
    __tablename__ = "bracket_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    desbloqueado: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_desbloqueo: Mapped[datetime.datetime | None] = mapped_column(DateTime)
    mensaje_bloqueado: Mapped[str | None] = mapped_column(Text)
