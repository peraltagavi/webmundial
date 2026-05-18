from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.trivia import TriviaRecord
from app.schemas.trivia import TriviaRecordCreate, TriviaRecordRead

router = APIRouter(prefix="/trivia", tags=["trivia"])


@router.get("/records", response_model=list[TriviaRecordRead])
async def get_records(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TriviaRecord)
        .order_by(TriviaRecord.puntuacion.desc(), TriviaRecord.racha_maxima.desc())
        .limit(10)
    )
    return result.scalars().all()


@router.post("/record", response_model=TriviaRecordRead, status_code=201)
async def create_record(body: TriviaRecordCreate, db: AsyncSession = Depends(get_db)):
    record = TriviaRecord(
        nombre=body.nombre,
        puntuacion=body.puntuacion,
        racha_maxima=body.racha_maxima,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
