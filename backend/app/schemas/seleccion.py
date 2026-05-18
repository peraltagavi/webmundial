from pydantic import BaseModel


class SeleccionBase(BaseModel):
    nombre: str
    codigo_fifa: str
    confederacion: str | None = None
    ranking_fifa: int | None = None
    puntos_fifa: float | None = None
    puntos_fifa_ant: float | None = None
    posicion_anterior: int | None = None


class SeleccionRead(SeleccionBase):
    id: int

    model_config = {"from_attributes": True}


class SeleccionMundialRead(SeleccionBase):
    id: int
    grupo: str

    model_config = {"from_attributes": True}
