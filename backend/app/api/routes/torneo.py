from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db
from app.schemas.torneo import (
    FixtureResponse,
    SimularGrupoRequest, SimularGrupoResponse,
    SimularTodosRequest, SimularTodosResponse,
    MejoresTercerosRequest, MejoresTercerosResponse,
    SimularKORequest, SimularKOResponse,
    EscenariosRequest, EscenariosResponse,
)
from app.services import torneo as svc

router = APIRouter(prefix="/torneo", tags=["torneo"])


@router.get("/fixture", response_model=FixtureResponse)
async def fixture(db=Depends(get_db)):
    return await svc.get_fixture(db)


@router.post("/simular-grupo", response_model=SimularGrupoResponse)
async def simular_grupo(body: SimularGrupoRequest, db=Depends(get_db)):
    try:
        return await svc.simular_grupo(db, body.grupo, body.resultados_previos)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/simular-todos", response_model=SimularTodosResponse)
async def simular_todos(body: SimularTodosRequest, db=Depends(get_db)):
    return await svc.simular_todos(db, body.resultados_previos)


@router.post("/mejores-terceros", response_model=MejoresTercerosResponse)
async def mejores_terceros(body: MejoresTercerosRequest):
    return svc.mejores_terceros(body.tablas)


@router.post("/simular-ko", response_model=SimularKOResponse)
async def simular_ko(body: SimularKORequest, db=Depends(get_db)):
    return await svc.simular_partido_ko(db, body.codigo_a, body.codigo_b)


@router.post("/calcular-escenarios", response_model=EscenariosResponse)
async def calcular_escenarios(body: EscenariosRequest):
    try:
        return svc.calcular_escenarios(body.equipo_codigo.upper(), body.resultados)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
