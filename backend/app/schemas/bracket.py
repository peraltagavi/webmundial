from pydantic import BaseModel


class CruceRead(BaseModel):
    id: int
    ronda: str
    posicion: int
    equipo_a: str | None
    equipo_b: str | None
    goles_a: int | None
    goles_b: int | None
    ganador: str | None
    fue_penales: bool

    model_config = {"from_attributes": True}


class BracketStatusResponse(BaseModel):
    desbloqueado: bool
    mensaje_bloqueado: str
    cruces: list[CruceRead]


class BracketEstadoResponse(BaseModel):
    desbloqueado: bool
    mensaje_bloqueado: str
    rondas: dict[str, list[CruceRead]]


class SimularCruceRequest(BaseModel):
    cruce_id: int


class AvanzarRequest(BaseModel):
    cruce_id: int
    ganador: str

class LimpiarCruceRequest(BaseModel):
    cruce_id: int
