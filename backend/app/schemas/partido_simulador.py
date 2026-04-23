from __future__ import annotations
from pydantic import BaseModel


class UltimoPartidoEquipo(BaseModel):
    fecha: str | None
    rival: str
    goles_favor: int | None
    goles_contra: int | None
    resultado: str  # "G", "E", "P"


class TeamAnalisis(BaseModel):
    nombre: str
    codigo_fifa: str
    ranking_fifa: int | None
    puntos_fifa: float | None
    goles_promedio: float
    porcentaje_porteria_cero: float
    mundiales_disputados: int
    porcentaje_victorias: float
    ultimos_5: list[UltimoPartidoEquipo]


class ProbabilidadesResponse(BaseModel):
    equipo_a: TeamAnalisis
    equipo_b: TeamAnalisis
    prob_a: float
    prob_empate: float
    prob_b: float
    total_h2h: int


class SimularPorCodigoRequest(BaseModel):
    codigo_a: str
    codigo_b: str


class SimularPorCodigoResponse(BaseModel):
    goles_a: int
    goles_b: int
    ganador: str  # "a", "b", "empate"
