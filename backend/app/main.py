from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import simulador, quiniela, torneo, alineaciones

app = FastAPI(
    title="Mundial 2026 API",
    description="Backend para simulador y quiniela del Mundial 2026",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulador.router, prefix="/api/v1")
app.include_router(quiniela.router, prefix="/api/v1")
app.include_router(torneo.router, prefix="/api/v1")
app.include_router(alineaciones.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
