from sqlalchemy import Integer, String, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import datetime


class Quiniela(Base):
    __tablename__ = "quinielas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo_publico: Mapped[str] = mapped_column(String(12), unique=True, nullable=False)
    nombre_usuario: Mapped[str] = mapped_column(String(100))
    predicciones: Mapped[dict] = mapped_column(JSON, default=dict)
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    creado_en: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    es_publica: Mapped[bool] = mapped_column(Boolean, default=True)


class Duelo(Base):
    __tablename__ = "duelos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo_sala: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    quiniela_retador_id: Mapped[int] = mapped_column(ForeignKey("quinielas.id"))
    quiniela_rival_id: Mapped[int | None] = mapped_column(ForeignKey("quinielas.id"), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    retador = relationship("Quiniela", foreign_keys=[quiniela_retador_id])
    rival = relationship("Quiniela", foreign_keys=[quiniela_rival_id])
