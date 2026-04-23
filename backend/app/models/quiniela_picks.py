from sqlalchemy import Integer, String, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import datetime


class QuinielaUsuario(Base):
    __tablename__ = "quiniela_usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )


class QuinielaPartido(Base):
    __tablename__ = "quiniela_partidos"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    grupo: Mapped[str] = mapped_column(String(2), nullable=False)
    fecha: Mapped[str] = mapped_column(String(20), nullable=False)
    equipo_local: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo_local: Mapped[str] = mapped_column(String(10), nullable=False)
    equipo_visitante: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo_visitante: Mapped[str] = mapped_column(String(10), nullable=False)
    goles_local_real: Mapped[int | None] = mapped_column(Integer, nullable=True)
    goles_visitante_real: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cerrado: Mapped[bool] = mapped_column(Boolean, default=False)


class QuinielaPick(Base):
    __tablename__ = "quiniela_picks"
    __table_args__ = (UniqueConstraint("usuario_id", "partido_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("quiniela_usuarios.id"), nullable=False
    )
    partido_id: Mapped[str] = mapped_column(
        ForeignKey("quiniela_partidos.id"), nullable=False
    )
    goles_local: Mapped[int] = mapped_column(Integer, nullable=False)
    goles_visitante: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
