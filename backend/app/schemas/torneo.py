from pydantic import BaseModel


class EquipoFixture(BaseModel):
    nombre: str
    codigo: str
    ranking_fifa: int | None = None


class PartidoFixture(BaseModel):
    id: str
    fecha: str
    equipo_a: EquipoFixture
    equipo_b: EquipoFixture


class GrupoFixture(BaseModel):
    nombre: str
    equipos: list[EquipoFixture]
    partidos: list[PartidoFixture]


class FixtureResponse(BaseModel):
    grupos: list[GrupoFixture]


class ResultadoPartido(BaseModel):
    partido_id: str
    goles_a: int
    goles_b: int


class FilaTabla(BaseModel):
    nombre: str
    codigo: str
    ranking_fifa: int | None = None
    pj: int = 0
    pg: int = 0
    pe: int = 0
    pp: int = 0
    gf: int = 0
    gc: int = 0
    dg: int = 0
    pts: int = 0


class SimularGrupoRequest(BaseModel):
    grupo: str
    resultados_previos: list[ResultadoPartido] = []


class SimularGrupoResponse(BaseModel):
    grupo: str
    tabla: list[FilaTabla]
    partidos: list[ResultadoPartido]


class SimularTodosRequest(BaseModel):
    resultados_previos: list[ResultadoPartido] = []


class SimularTodosResponse(BaseModel):
    grupos: list[SimularGrupoResponse]


class MejoresTercerosRequest(BaseModel):
    tablas: list[SimularGrupoResponse]


class MejoresTercerosResponse(BaseModel):
    clasificados: list[FilaTabla]
    grupos_origen: list[str]


class SimularKORequest(BaseModel):
    codigo_a: str
    codigo_b: str


class SimularKOResponse(BaseModel):
    goles_a: int
    goles_b: int
    ganador: str  # "a" or "b" — never "empate"
    penales: bool = False
    penales_a: int | None = None
    penales_b: int | None = None


# ─── Escenarios ───────────────────────────────────────────────────────────────

class ResultadoEscenario(BaseModel):
    partido_id: str
    goles_local: int | None = None
    goles_visitante: int | None = None


class FilaTablaEscenario(BaseModel):
    nombre: str
    codigo: str
    pts: int
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    dg: int
    posicion: int


class EscenariosRequest(BaseModel):
    equipo_codigo: str
    resultados: list[ResultadoEscenario]


class EscenariosResponse(BaseModel):
    estado: str  # "clasifica" | "eliminado" | "depende"
    puntos: int
    posicion_actual: int
    mensaje: str
    escenarios_favorables: int
    escenarios_totales: int
    escenarios_descripcion: list[str]
    tabla_actual: list[FilaTablaEscenario]
