from sqlalchemy import Integer, SMALLINT, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import datetime


class Jugador(Base):
    __tablename__ = "jugadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seleccion_codigo: Mapped[str | None] = mapped_column(
        String(3), ForeignKey("selecciones.codigo_fifa")
    )
    seleccion_nombre: Mapped[str | None] = mapped_column(String(100))
    numero_camiseta: Mapped[int | None] = mapped_column(SMALLINT)
    posicion: Mapped[str | None] = mapped_column(String(50))
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    fecha_nacimiento: Mapped[datetime.date | None] = mapped_column(Date)
    estatura_cm: Mapped[int | None] = mapped_column(SMALLINT)
    pie_dominante: Mapped[str | None] = mapped_column(String(15))
    club: Mapped[str | None] = mapped_column(String(100))
    liga: Mapped[str | None] = mapped_column(String(100))
    internacionalidades: Mapped[int | None] = mapped_column(Integer)
    goles_seleccion: Mapped[int | None] = mapped_column(Integer)
    valor_mercado_eur: Mapped[float | None] = mapped_column(Numeric(14, 2))

    seleccion = relationship("Seleccion", foreign_keys=[seleccion_codigo])
