from sqlalchemy import Integer, SMALLINT, String, Date, Time, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import datetime


class PartidoHistorico(Base):
    __tablename__ = "partidos_historicos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    tournament_id: Mapped[str | None] = mapped_column(String(20))
    tournament_name: Mapped[str | None] = mapped_column(String(100))
    genero: Mapped[str] = mapped_column(String(10), nullable=False)
    match_id: Mapped[str | None] = mapped_column(String(20))
    match_name: Mapped[str | None] = mapped_column(String(200))
    stage_name: Mapped[str | None] = mapped_column(String(50))
    group_name: Mapped[str | None] = mapped_column(String(20))
    group_stage: Mapped[bool | None] = mapped_column(Boolean)
    knockout_stage: Mapped[bool | None] = mapped_column(Boolean)
    replayed: Mapped[bool | None] = mapped_column(Boolean)
    replay: Mapped[bool | None] = mapped_column(Boolean)
    match_date: Mapped[datetime.date | None] = mapped_column(Date)
    match_time: Mapped[datetime.time | None] = mapped_column(Time)
    stadium_name: Mapped[str | None] = mapped_column(String(150))
    city_name: Mapped[str | None] = mapped_column(String(100))
    country_name: Mapped[str | None] = mapped_column(String(100))
    home_team_code: Mapped[str] = mapped_column(String(3), nullable=False)
    home_team_name: Mapped[str | None] = mapped_column(String(100))
    away_team_code: Mapped[str] = mapped_column(String(3), nullable=False)
    away_team_name: Mapped[str | None] = mapped_column(String(100))
    home_team_score: Mapped[int | None] = mapped_column(SMALLINT)
    away_team_score: Mapped[int | None] = mapped_column(SMALLINT)
    home_team_score_margin: Mapped[int | None] = mapped_column(SMALLINT)
    away_team_score_margin: Mapped[int | None] = mapped_column(SMALLINT)
    extra_time: Mapped[bool | None] = mapped_column(Boolean)
    penalty_shootout: Mapped[bool | None] = mapped_column(Boolean)
    home_team_score_penalties: Mapped[int | None] = mapped_column(SMALLINT)
    away_team_score_penalties: Mapped[int | None] = mapped_column(SMALLINT)
    result: Mapped[str | None] = mapped_column(String(30))
    home_team_win: Mapped[bool | None] = mapped_column(Boolean)
    away_team_win: Mapped[bool | None] = mapped_column(Boolean)
    draw: Mapped[bool | None] = mapped_column(Boolean)
