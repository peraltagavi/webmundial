export interface Seleccion {
  id: number;
  nombre: string;
  codigo_fifa: string;
  confederacion: string | null;
  ranking_fifa: number | null;
  puntos_fifa: number | null;
  puntos_fifa_ant: number | null;
  posicion_anterior: number | null;
}

export interface StatsSeleccion {
  partidos: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  porcentaje_victorias: number;
  mundiales_disputados: number;
}

export interface ResultadoSimulacion {
  goles_local: number;
  goles_visitante: number;
  penales_local: number | null;
  penales_visitante: number | null;
  probabilidad_local: number;
  probabilidad_empate: number;
  probabilidad_visitante: number;
}

export interface Jugador {
  id: number;
  nombre: string;
  seleccion_codigo: string | null;
  seleccion_nombre: string | null;
  posicion: string | null;
  fecha_nacimiento: string | null;
  estatura_cm: number | null;
  pie_dominante: string | null;
  club: string | null;
  liga: string | null;
  internacionalidades: number | null;
  goles_seleccion: number | null;
  valor_mercado_eur: number | null;
}

export interface Quiniela {
  id: number;
  codigo_publico: string;
  nombre_usuario: string;
  predicciones: Record<string, unknown>;
  puntos: number;
  creado_en: string;
  es_publica: boolean;
}

export interface Duelo {
  id: number;
  codigo_sala: string;
  quiniela_retador_id: number;
  quiniela_rival_id: number | null;
  activo: boolean;
}

export type Fase =
  | "grupos"
  | "octavos"
  | "cuartos"
  | "semifinal"
  | "tercer_lugar"
  | "final";

// ── Simulador de Partidos ────────────────────────────────────────────────────

export interface UltimoPartidoEquipo {
  fecha: string | null;
  rival: string;
  goles_favor: number | null;
  goles_contra: number | null;
  resultado: string; // "G", "E", "P"
}

export interface TeamAnalisis {
  nombre: string;
  codigo_fifa: string;
  ranking_fifa: number | null;
  puntos_fifa: number | null;
  goles_promedio: number;
  porcentaje_porteria_cero: number;
  mundiales_disputados: number;
  porcentaje_victorias: number;
  ultimos_5: UltimoPartidoEquipo[];
}

export interface ProbabilidadesResponse {
  equipo_a: TeamAnalisis;
  equipo_b: TeamAnalisis;
  prob_a: number;
  prob_empate: number;
  prob_b: number;
  total_h2h: number;
}

export interface SimularResponse {
  goles_a: number;
  goles_b: number;
  ganador: string; // "a", "b", "empate"
}

// ── Alineaciones ─────────────────────────────────────────────────────────────

export interface JugadorAlineacion {
  id: number;
  nombre: string;
  posicion: string | null;
  club: string | null;
  edad: number | null;
  valor_mercado_eur: number | null;
  internacionalidades: number | null;
  numero_camiseta: number | null;
}

// ── Torneo ───────────────────────────────────────────────────────────────────

export interface EquipoFixture {
  nombre: string;
  codigo: string;
  ranking_fifa: number | null;
}

export interface PartidoFixtureT {
  id: string;
  fecha: string;
  equipo_a: EquipoFixture;
  equipo_b: EquipoFixture;
}

export interface GrupoFixtureT {
  nombre: string;
  equipos: EquipoFixture[];
  partidos: PartidoFixtureT[];
}

export interface FixtureResponse {
  grupos: GrupoFixtureT[];
}

export interface ResultadoPartido {
  partido_id: string;
  goles_a: number;
  goles_b: number;
}

export interface FilaTabla {
  nombre: string;
  codigo: string;
  ranking_fifa: number | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export interface SimularGrupoResponse {
  grupo: string;
  tabla: FilaTabla[];
  partidos: ResultadoPartido[];
}

export interface SimularTodosResponse {
  grupos: SimularGrupoResponse[];
}

export interface MejoresTercerosResponse {
  clasificados: FilaTabla[];
  grupos_origen: string[];
}

export interface SimularKOResponse {
  goles_a: number;
  goles_b: number;
  ganador: string;
  penales: boolean;
  penales_a: number | null;
  penales_b: number | null;
}

// ── Quiniela Picks ───────────────────────────────────────────────────────────

export interface QuinielaUsuario {
  id: number;
  nombre: string;
  email: string;
}

export interface QuinielaPartido {
  id: string;
  grupo: string;
  fecha: string;
  equipo_local: string;
  codigo_local: string;
  equipo_visitante: string;
  codigo_visitante: string;
  goles_local_real: number | null;
  goles_visitante_real: number | null;
  cerrado: boolean;
}

export interface PickRead {
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  puntos: number | null;
}

export interface LiderEntry {
  usuario_id: number;
  nombre: string;
  puntos: number;
  picks_completados: number;
}

// ── Comparador ──────────────────────────────────────────────────────────────

export interface H2HStats {
  total: number;
  victorias_a: number;
  victorias_b: number;
  empates: number;
  goles_a: number;
  goles_b: number;
}

export interface PartidoResumen {
  fecha: string | null;
  torneo: string | null;
  equipo_local: string;
  equipo_visitante: string;
  goles_local: number | null;
  goles_visitante: number | null;
  ronda: string | null;
  penales_local: number | null;
  penales_visitante: number | null;
}

export interface Rendimiento {
  partidos: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  porcentaje_victorias: number;
  mundiales_disputados: number;
}

export interface MejorResultado {
  label: string;
  torneos: string[];
}

export interface ComparadorResponse {
  equipo_a: Seleccion;
  equipo_b: Seleccion;
  head_to_head: H2HStats;
  ultimos_5: PartidoResumen[];
  rendimiento_a: Rendimiento;
  rendimiento_b: Rendimiento;
  mejor_resultado_a: MejorResultado;
  mejor_resultado_b: MejorResultado;
}
