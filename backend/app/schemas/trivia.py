from pydantic import BaseModel
import datetime


class TriviaRecordCreate(BaseModel):
    nombre: str
    puntuacion: int
    racha_maxima: int = 0


class TriviaRecordRead(BaseModel):
    id: int
    nombre: str
    puntuacion: int
    racha_maxima: int
    fecha: datetime.datetime

    model_config = {"from_attributes": True}
