from pydantic import BaseModel
from typing import Optional


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

    model_config = {"from_attributes": True}


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
