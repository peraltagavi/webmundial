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
from app.schemas.bracket import (
    BracketStatusResponse,
    BracketEstadoResponse,
    SimularCruceRequest,
    AvanzarRequest,
    LimpiarCruceRequest,
    CruceRead,
)
from app.services import torneo as svc
from app.services import bracket as bsvc

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


# ─── Bracket endpoints ────────────────────────────────────────────────────────

@router.get("/bracket/status", response_model=BracketStatusResponse)
async def bracket_status(db=Depends(get_db)):
    return await bsvc.get_bracket_status(db)


@router.get("/bracket/estado", response_model=BracketEstadoResponse)
async def bracket_estado(db=Depends(get_db)):
    return await bsvc.get_bracket_estado(db)


@router.post("/bracket/simular-cruce", response_model=CruceRead)
async def bracket_simular_cruce(body: SimularCruceRequest, db=Depends(get_db)):
    try:
        return await bsvc.simular_cruce(db, body.cruce_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bracket/avanzar", response_model=CruceRead)
async def bracket_avanzar(body: AvanzarRequest, db=Depends(get_db)):
    try:
        return await bsvc.avanzar(db, body.cruce_id, body.ganador.upper())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bracket/limpiar-cruce", response_model=CruceRead)
async def bracket_limpiar_cruce(body: LimpiarCruceRequest, db=Depends(get_db)):
    try:
        return await bsvc.limpiar_cruce(db, body.cruce_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bracket/reiniciar")
async def bracket_reiniciar(db=Depends(get_db)):
    await bsvc.reiniciar_bracket(db)
    return {"ok": True}
