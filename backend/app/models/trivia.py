from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import datetime


class TriviaRecord(Base):
    __tablename__ = "trivia_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    puntuacion: Mapped[int] = mapped_column(Integer, nullable=False)
    racha_maxima: Mapped[int] = mapped_column(Integer, default=0)
    fecha: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
