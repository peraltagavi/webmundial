from pydantic import BaseModel, field_serializer
from typing import Optional
import datetime as dt


class RegistroRequest(BaseModel):
    nombre: str
    email: str


class UsuarioRead(BaseModel):
    id: int
    nombre: str
    email: str

    model_config = {"from_attributes": True}


class PartidoPickRead(BaseModel):
    id: str
    grupo: str
    fecha: str
    equipo_local: str
    codigo_local: str
    equipo_visitante: str
    codigo_visitante: str
    goles_local_real: Optional[int] = None
    goles_visitante_real: Optional[int] = None
    cerrado: bool
    bloqueado: bool = False
    fecha_hora: Optional[dt.datetime] = None

    model_config = {"from_attributes": True}

    @field_serializer("fecha_hora")
    def serialize_fecha_hora(self, v: Optional[dt.datetime]) -> Optional[str]:
        return v.isoformat() if v else None


class PickInput(BaseModel):
    partido_id: str
    goles_local: int
    goles_visitante: int


class PicksRequest(BaseModel):
    usuario_id: int
    picks: list[PickInput]


class PickRead(BaseModel):
    partido_id: str
    goles_local: int
    goles_visitante: int
    puntos: Optional[int] = None

    model_config = {"from_attributes": True}


class LiderEntry(BaseModel):
    usuario_id: int
    nombre: str
    puntos: int
    picks_completados: int
