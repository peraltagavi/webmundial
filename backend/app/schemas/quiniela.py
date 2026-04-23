from pydantic import BaseModel
import datetime


class QuinielaCreate(BaseModel):
    nombre_usuario: str
    predicciones: dict
    es_publica: bool = True


class QuinielaRead(BaseModel):
    id: int
    codigo_publico: str
    nombre_usuario: str
    predicciones: dict
    puntos: int
    creado_en: datetime.datetime
    es_publica: bool

    model_config = {"from_attributes": True}


class DueloCreate(BaseModel):
    quiniela_retador_id: int


class DueloRead(BaseModel):
    id: int
    codigo_sala: str
    quiniela_retador_id: int
    quiniela_rival_id: int | None
    activo: bool

    model_config = {"from_attributes": True}
