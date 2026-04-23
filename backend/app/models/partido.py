from sqlalchemy import Integer, SMALLINT, String, TIMESTAMP, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import datetime


class PartidoSimulado(Base):
    """Resultados generados por el simulador de la app."""
    __tablename__ = "partidos_simulados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fase: Mapped[str | None] = mapped_column(String(50))
    grupo: Mapped[str | None] = mapped_column(String(5))
    fecha_simulacion: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.utcnow
    )
    equipo_local_codigo: Mapped[str | None] = mapped_column(
        String(3), ForeignKey("selecciones.codigo_fifa")
    )
    equipo_visitante_codigo: Mapped[str | None] = mapped_column(
        String(3), ForeignKey("selecciones.codigo_fifa")
    )
    goles_local: Mapped[int | None] = mapped_column(SMALLINT)
    goles_visitante: Mapped[int | None] = mapped_column(SMALLINT)
    penales_local: Mapped[int | None] = mapped_column(SMALLINT)
    penales_visitante: Mapped[int | None] = mapped_column(SMALLINT)
    prob_local: Mapped[float | None] = mapped_column(Numeric(5, 3))
    prob_empate: Mapped[float | None] = mapped_column(Numeric(5, 3))
    prob_visitante: Mapped[float | None] = mapped_column(Numeric(5, 3))

    equipo_local = relationship("Seleccion", foreign_keys=[equipo_local_codigo])
    equipo_visitante = relationship("Seleccion", foreign_keys=[equipo_visitante_codigo])
