from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Seleccion(Base):
    __tablename__ = "selecciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo_fifa: Mapped[str] = mapped_column(String(3), unique=True, nullable=False)
    confederacion: Mapped[str | None] = mapped_column(String(20))
    ranking_fifa: Mapped[int | None] = mapped_column(Integer)
    puntos_fifa: Mapped[float | None] = mapped_column(Float)
    puntos_fifa_ant: Mapped[float | None] = mapped_column(Float)
    posicion_anterior: Mapped[int | None] = mapped_column(Integer)
