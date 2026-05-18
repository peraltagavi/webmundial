from pydantic import BaseModel


class JugadorAlineacionRead(BaseModel):
    id: int
    nombre: str
    posicion: str | None
    club: str | None
    edad: int | None
    valor_mercado_eur: float | None
    internacionalidades: int | None
    goles_seleccion: int | None
    numero_camiseta: int | None
    score: float  # 0–100, calculado con normalización global


class RatingRequest(BaseModel):
    jugadores_ids: list[int]


class RatingResponse(BaseModel):
    defensa: float
    mediocampo: float
    ataque: float
    overall: float
    scores: dict[int, float]  # player_id → score individual
