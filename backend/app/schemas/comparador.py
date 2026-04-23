from __future__ import annotations
import datetime
from pydantic import BaseModel
from app.schemas.seleccion import SeleccionRead


class H2HStats(BaseModel):
    total: int
    victorias_a: int
    victorias_b: int
    empates: int
    goles_a: int
    goles_b: int


class PartidoResumen(BaseModel):
    fecha: datetime.date | None
    torneo: str | None
    equipo_local: str
    equipo_visitante: str
    goles_local: int | None
    goles_visitante: int | None
    ronda: str | None
    penales_local: int | None
    penales_visitante: int | None


class Rendimiento(BaseModel):
    partidos: int
    ganados: int
    empatados: int
    perdidos: int
    goles_favor: int
    goles_contra: int
    diferencia_goles: int
    porcentaje_victorias: float
    mundiales_disputados: int


class MejorResultado(BaseModel):
    label: str
    torneos: list[str]


class ComparadorResponse(BaseModel):
    equipo_a: SeleccionRead
    equipo_b: SeleccionRead
    head_to_head: H2HStats
    ultimos_5: list[PartidoResumen]
    rendimiento_a: Rendimiento
    rendimiento_b: Rendimiento
    mejor_resultado_a: MejorResultado
    mejor_resultado_b: MejorResultado
