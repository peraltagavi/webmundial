from pydantic import BaseModel


class JugadorAlineacionRead(BaseModel):
    id: int
    nombre: str
    posicion: str | None
    club: str | None
    edad: int | None
    valor_mercado_eur: float | None
    internacionalidades: int | None
    numero_camiseta: int | None
