import type {
  Seleccion,
  StatsSeleccion,
  ResultadoSimulacion,
  Jugador,
  Quiniela,
  Duelo,
  Fase,
  ComparadorResponse,
  ProbabilidadesResponse,
  SimularResponse,
  JugadorAlineacion,
  FixtureResponse,
  ResultadoPartido,
  SimularGrupoResponse,
  SimularTodosResponse,
  MejoresTercerosResponse,
  SimularKOResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchAPI<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// Simulador
export const getSelecciones = () =>
  fetchAPI<Seleccion[]>("/simulador/selecciones");

export const getStatsSeleccion = (id: number) =>
  fetchAPI<{ seleccion: Seleccion; stats: StatsSeleccion }>(
    `/simulador/selecciones/${id}/stats`
  );

export const simularPartido = (
  equipo_local_id: number,
  equipo_visitante_id: number,
  fase: Fase = "grupos"
) =>
  fetchAPI<ResultadoSimulacion>("/simulador/partido", {
    method: "POST",
    body: JSON.stringify({ equipo_local_id, equipo_visitante_id, fase }),
  });

export const getAlineacion = (seleccion_id: number) =>
  fetchAPI<{ jugadores: Jugador[] }>(
    `/simulador/selecciones/${seleccion_id}/alineacion`
  );

export const getComparador = (codigo_a: string, codigo_b: string) =>
  fetchAPI<ComparadorResponse>(
    `/simulador/comparador?codigo_a=${codigo_a}&codigo_b=${codigo_b}`
  );

export const getProbabilidades = (codigo_a: string, codigo_b: string) =>
  fetchAPI<ProbabilidadesResponse>(
    `/simulador/probabilidades?codigo_a=${codigo_a}&codigo_b=${codigo_b}`
  );

export const simularPorCodigo = (codigo_a: string, codigo_b: string) =>
  fetchAPI<SimularResponse>("/simulador/simular", {
    method: "POST",
    body: JSON.stringify({ codigo_a, codigo_b }),
  });

// Quiniela Picks
export const quinielaRegistro = (nombre: string, email: string) =>
  fetchAPI<import("./types").QuinielaUsuario>("/quiniela/registro", {
    method: "POST",
    body: JSON.stringify({ nombre, email }),
  });

export const getQuinielaPartidos = () =>
  fetchAPI<import("./types").QuinielaPartido[]>("/quiniela/partidos");

export const guardarPicks = (
  usuario_id: number,
  picks: { partido_id: string; goles_local: number; goles_visitante: number }[]
) =>
  fetchAPI<void>("/quiniela/picks", {
    method: "POST",
    body: JSON.stringify({ usuario_id, picks }),
  });

export const getPicksUsuario = (usuario_id: number) =>
  fetchAPI<import("./types").PickRead[]>(`/quiniela/picks/${usuario_id}`);

export const getLideres = () =>
  fetchAPI<import("./types").LiderEntry[]>("/quiniela/lideres");

// Quiniela
export const crearQuiniela = (
  nombre_usuario: string,
  predicciones: Record<string, unknown>,
  es_publica = true
) =>
  fetchAPI<Quiniela>("/quiniela", {
    method: "POST",
    body: JSON.stringify({ nombre_usuario, predicciones, es_publica }),
  });

export const getQuiniela = (codigo_publico: string) =>
  fetchAPI<Quiniela>(`/quiniela/${codigo_publico}`);

export const crearDuelo = (quiniela_retador_id: number) =>
  fetchAPI<Duelo>("/quiniela/duelo", {
    method: "POST",
    body: JSON.stringify({ quiniela_retador_id }),
  });

export const unirseaDuelo = (codigo_sala: string, quiniela_rival_id: number) =>
  fetchAPI<Duelo>(`/quiniela/duelo/${codigo_sala}/unirse?quiniela_rival_id=${quiniela_rival_id}`, {
    method: "POST",
  });

// Alineaciones
export const getJugadoresAlineacion = (codigo: string) =>
  fetchAPI<JugadorAlineacion[]>(`/alineaciones/jugadores/${codigo}`);

// Torneo
export const getTorneoFixture = () =>
  fetchAPI<FixtureResponse>("/torneo/fixture");

export const simularGrupo = (grupo: string, resultados_previos: ResultadoPartido[]) =>
  fetchAPI<SimularGrupoResponse>("/torneo/simular-grupo", {
    method: "POST",
    body: JSON.stringify({ grupo, resultados_previos }),
  });

export const simularTodos = (resultados_previos: ResultadoPartido[]) =>
  fetchAPI<SimularTodosResponse>("/torneo/simular-todos", {
    method: "POST",
    body: JSON.stringify({ resultados_previos }),
  });

export const getMejoresTerceros = (tablas: SimularGrupoResponse[]) =>
  fetchAPI<MejoresTercerosResponse>("/torneo/mejores-terceros", {
    method: "POST",
    body: JSON.stringify({ tablas }),
  });

export const simularKO = (codigo_a: string, codigo_b: string) =>
  fetchAPI<SimularKOResponse>("/torneo/simular-ko", {
    method: "POST",
    body: JSON.stringify({ codigo_a, codigo_b }),
  });

export const calcularEscenarios = (
  equipo_codigo: string,
  resultados: import("./types").ResultadoEscenario[]
) =>
  fetchAPI<import("./types").EscenariosResponse>("/torneo/calcular-escenarios", {
    method: "POST",
    body: JSON.stringify({ equipo_codigo, resultados }),
  });
