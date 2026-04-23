from pydantic import BaseModel
import datetime


class PartidoBase(BaseModel):
    edicion: int
    fase: str
    grupo: str | None = None
    fecha: datetime.date | None = None
    equipo_local_id: int
    equipo_visitante_id: int
    goles_local: int | None = None
    goles_visitante: int | None = None
    penales_local: int | None = None
    penales_visitante: int | None = None


class PartidoRead(PartidoBase):
    id: int
    es_simulado: bool

    model_config = {"from_attributes": True}


class SimularPartidoRequest(BaseModel):
    equipo_local_id: int
    equipo_visitante_id: int
    fase: str = "grupos"
    grupo: str | None = None


class SimularPartidoResponse(BaseModel):
    goles_local: int
    goles_visitante: int
    penales_local: int | None = None
    penales_visitante: int | None = None
    probabilidad_local: float
    probabilidad_empate: float
    probabilidad_visitante: float
