"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTorneoFixture,
  simularGrupo,
  simularTodos,
  getMejoresTerceros,
  simularKO,
  calcularEscenarios,
} from "@/lib/api";
import type {
  GrupoFixtureT,
  FilaTabla,
  SimularGrupoResponse,
  ResultadoPartido,
  SimularKOResponse,
  EscenariosResponse,
  PartidoFixtureT,
} from "@/lib/types";
import styles from "./page.module.css";

// ─── Escenarios section ───────────────────────────────────────────────────────

interface EscenariosMatch {
  partido_id: string;
  fecha: string;
  nombre_a: string;
  codigo_a: string;
  nombre_b: string;
  codigo_b: string;
  goles_a: string;
  goles_b: string;
}

function EscenariosSection({ grupos }: { grupos: GrupoFixtureT[] }) {
  const [equipoCodigo, setEquipoCodigo] = useState("");
  const [matches, setMatches]           = useState<EscenariosMatch[]>([]);
  const [resultado, setResultado]       = useState<EscenariosResponse | null>(null);
  const [calculando, setCalculando]     = useState(false);

  // All 48 teams sorted alphabetically
  const allTeams = grupos
    .flatMap((g) => g.equipos)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  // When team selected, find their 3 matches
  useEffect(() => {
    if (!equipoCodigo || !grupos.length) {
      setMatches([]);
      setResultado(null);
      return;
    }
    setResultado(null);
    const grupo = grupos.find((g) =>
      g.equipos.some((e) => e.codigo === equipoCodigo)
    );
    if (!grupo) return;
    const teamMatches: EscenariosMatch[] = grupo.partidos
      .filter(
        (p: PartidoFixtureT) =>
          p.equipo_a.codigo === equipoCodigo || p.equipo_b.codigo === equipoCodigo
      )
      .map((p: PartidoFixtureT) => ({
        partido_id: p.id,
        fecha: p.fecha,
        nombre_a: p.equipo_a.nombre,
        codigo_a: p.equipo_a.codigo,
        nombre_b: p.equipo_b.nombre,
        codigo_b: p.equipo_b.codigo,
        goles_a: "",
        goles_b: "",
      }));
    setMatches(teamMatches);
  }, [equipoCodigo, grupos]);

  function setScore(idx: number, side: "a" | "b", val: string) {
    setMatches((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, [`goles_${side}`]: val } : m
      )
    );
  }

  async function handleCalcular() {
    if (!equipoCodigo) return;
    setCalculando(true);
    setResultado(null);
    try {
      const resultados = matches.map((m) => ({
        partido_id: m.partido_id,
        goles_local: m.goles_a !== "" ? parseInt(m.goles_a) : null,
        goles_visitante: m.goles_b !== "" ? parseInt(m.goles_b) : null,
      }));
      const res = await calcularEscenarios(equipoCodigo, resultados);
      setResultado(res);
    } finally {
      setCalculando(false);
    }
  }

  const estadoIcon = resultado?.estado === "clasifica" ? "✅"
    : resultado?.estado === "eliminado" ? "❌" : "⚠️";

  const estadoClass =
    resultado?.estado === "clasifica" ? styles.escEstadoOk
    : resultado?.estado === "eliminado" ? styles.escEstadoNo
    : styles.escEstadoDep;

  return (
    <div className={styles.escenariosSection}>
      <div className="container">
        <div className={styles.escenariosHeader}>
          <h2 className={styles.escenariosTitle}>¿Qué necesita mi equipo para clasificar?</h2>
          <p className={styles.escenariosSubtitle}>
            Ingresa los resultados de tu selección y calcula en cuántos escenarios avanza a eliminatorias.
          </p>
        </div>

        {/* Team selector */}
        <div className={styles.escTeamRow}>
          <div className={styles.escSelectWrapper}>
            <select
              className={styles.escSelect}
              value={equipoCodigo}
              onChange={(e) => setEquipoCodigo(e.target.value)}
            >
              <option value="">Elige tu equipo…</option>
              {allTeams.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.nombre}</option>
              ))}
            </select>
            <span className={styles.escSelectArrow}>▼</span>
          </div>
        </div>

        {/* Match inputs */}
        {matches.length > 0 && (
          <div className={styles.escMatches}>
            {matches.map((m, idx) => (
              <div key={m.partido_id} className={styles.escMatchRow}>
                <span className={styles.escMatchDate}>{m.fecha}</span>
                <span className={`${styles.escMatchTeam} ${styles.escMatchTeamA}`}>{m.nombre_a}</span>
                <div className={styles.escScoreWrap}>
                  <input
                    type="number" min={0} max={99}
                    className={styles.escScoreInput}
                    value={m.goles_a}
                    onChange={(e) => setScore(idx, "a", e.target.value)}
                    placeholder="–"
                  />
                  <span className={styles.escScoreSep}>:</span>
                  <input
                    type="number" min={0} max={99}
                    className={styles.escScoreInput}
                    value={m.goles_b}
                    onChange={(e) => setScore(idx, "b", e.target.value)}
                    placeholder="–"
                  />
                </div>
                <span className={styles.escMatchTeam}>{m.nombre_b}</span>
              </div>
            ))}

            <div className={styles.escCalcWrap}>
              <button
                className={styles.btnCalcular}
                onClick={handleCalcular}
                disabled={calculando}
              >
                {calculando ? "Calculando…" : "CALCULAR ESCENARIOS"}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {resultado && (
          <div className={`${styles.escResultado} ${estadoClass}`}>
            <div className={styles.escResultadoTop}>
              <span className={styles.escEstadoIcon}>{estadoIcon}</span>
              <p className={styles.escMensaje}>{resultado.mensaje}</p>
            </div>

            {resultado.estado === "depende" && resultado.escenarios_descripcion.length > 0 && (
              <div className={styles.escEscenarios}>
                <div className={styles.escEscenariosLabel}>Escenarios favorables (muestra)</div>
                <ul className={styles.escEscenariosLista}>
                  {resultado.escenarios_descripcion.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Group table */}
            {resultado.tabla_actual.length > 0 && (
              <div className={styles.escTablaWrap}>
                <div className={styles.escTablaLabel}>Tabla del grupo (con los resultados ingresados)</div>
                <table className={styles.escTabla}>
                  <thead>
                    <tr>
                      <th>Pos</th><th>Selección</th>
                      <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
                      <th>DG</th><th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.tabla_actual.map((fila) => (
                      <tr
                        key={fila.codigo}
                        className={fila.codigo === equipoCodigo ? styles.escTablaRowHighlight : ""}
                      >
                        <td>{fila.posicion}</td>
                        <td>{fila.nombre}</td>
                        <td>{fila.pj}</td><td>{fila.pg}</td>
                        <td>{fila.pe}</td><td>{fila.pp}</td>
                        <td>{fila.dg > 0 ? `+${fila.dg}` : fila.dg}</td>
                        <td className={styles.escTablapts}>{fila.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bracket seeding ──────────────────────────────────────────────────────────
// 32 teams → R32 (16) → Octavos (8) → Cuartos (4) → Semis (2) → Final (1)
const R32_SLOTS: Array<[string, string]> = [
  ["1A", "2B"], ["1C", "2D"], ["1E", "2F"], ["1G", "2H"],
  ["1I", "2J"], ["1K", "2L"], ["2A", "1B"], ["2C", "1D"],
  ["2E", "1F"], ["2G", "1H"], ["2I", "1J"], ["2K", "1L"],
  ["3T1", "3T2"], ["3T3", "3T4"], ["3T5", "3T6"], ["3T7", "3T8"],
];
// Consecutive bracket pairing: adjacent winners always meet
const PAIRS_8  = Array.from({ length: 8  }, (_, i) => [i * 2, i * 2 + 1] as [number, number]);
const PAIRS_4  = Array.from({ length: 4  }, (_, i) => [i * 2, i * 2 + 1] as [number, number]);
const PAIRS_2  = Array.from({ length: 2  }, (_, i) => [i * 2, i * 2 + 1] as [number, number]);

interface KOTeam { nombre: string; codigo: string; }
interface KOMatch {
  id: string;
  team_a?: KOTeam;
  team_b?: KOTeam;
  resultado?: SimularKOResponse;
  simulating?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function winner(m: KOMatch): KOTeam | undefined {
  if (!m.resultado) return undefined;
  return m.resultado.ganador === "a" ? m.team_a : m.team_b;
}

function loser(m: KOMatch): KOTeam | undefined {
  if (!m.resultado) return undefined;
  return m.resultado.ganador === "a" ? m.team_b : m.team_a;
}

function buildNextRound(
  prev: KOMatch[],
  prefix: string,
  pairs: [number, number][]
): KOMatch[] {
  return pairs.map(([ia, ib], i) => ({
    id: `${prefix}_${i}`,
    team_a: prev[ia] ? winner(prev[ia]) : undefined,
    team_b: prev[ib] ? winner(prev[ib]) : undefined,
  }));
}

function calcTabla(
  grupo: GrupoFixtureT,
  resultados: Record<string, [number, number]>
): FilaTabla[] {
  const stats: Record<string, FilaTabla> = {};
  for (const eq of grupo.equipos) {
    stats[eq.codigo] = {
      nombre: eq.nombre, codigo: eq.codigo, ranking_fifa: eq.ranking_fifa,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0,
    };
  }
  for (const p of grupo.partidos) {
    const r = resultados[p.id];
    if (!r) continue;
    const [ga, gb] = r;
    const sa = stats[p.equipo_a.codigo];
    const sb = stats[p.equipo_b.codigo];
    sa.pj++; sb.pj++;
    sa.gf += ga; sa.gc += gb;
    sb.gf += gb; sb.gc += ga;
    if (ga > gb) { sa.pg++; sa.pts += 3; sb.pp++; }
    else if (ga < gb) { sb.pg++; sb.pts += 3; sa.pp++; }
    else { sa.pe++; sa.pts++; sb.pe++; sb.pts++; }
  }
  for (const s of Object.values(stats)) { s.dg = s.gf - s.gc; }
  return Object.values(stats).sort((a, b) =>
    b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || (a.ranking_fifa ?? 999) - (b.ranking_fifa ?? 999)
  );
}

function allGroupsComplete(
  grupos: GrupoFixtureT[],
  resultados: Record<string, [number, number]>
): boolean {
  return grupos.length > 0 && grupos.every((g) => g.partidos.every((p) => p.id in resultados));
}

function resolveSlot(
  slot: string,
  tablas: Record<string, FilaTabla[]>,
  terceros: FilaTabla[]
): KOTeam | undefined {
  const m3 = slot.match(/^3T(\d+)$/);
  if (m3) {
    const t = terceros[parseInt(m3[1]) - 1];
    return t ? { nombre: t.nombre, codigo: t.codigo } : undefined;
  }
  const pos = parseInt(slot[0]) - 1;
  const grupo = slot.slice(1);
  const t = tablas[grupo]?.[pos];
  return t ? { nombre: t.nombre, codigo: t.codigo } : undefined;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function PosCircle({ pos }: { pos: number }) {
  const cls = `${styles.pos} ${pos === 0 ? styles.pos1 : pos === 1 ? styles.pos2 : pos === 2 ? styles.pos3 : styles.pos4}`;
  return <span className={cls}>{pos + 1}</span>;
}

function GrupoCard({
  grupo, resultados, simulando, onScoreChange, onSimPartido, onSimGrupo,
}: {
  grupo: GrupoFixtureT;
  resultados: Record<string, [number, number]>;
  simulando: Set<string>;
  onScoreChange: (pid: string, side: "a" | "b", val: string) => void;
  onSimPartido: (pid: string) => void;
  onSimGrupo: (g: string) => void;
}) {
  const tabla = calcTabla(grupo, resultados);
  const isSimGroup = simulando.has(`grupo_${grupo.nombre}`);

  return (
    <div className={styles.grupoCard}>
      <div className={styles.grupoHeader}>
        <span className={styles.grupoNombre}>Grupo {grupo.nombre}</span>
        <button
          className={styles.btnGrupo}
          onClick={() => onSimGrupo(grupo.nombre)}
          disabled={isSimGroup || simulando.size > 0}
        >
          {isSimGroup ? "..." : "Simular"}
        </button>
      </div>

      <table className={styles.tabla}>
        <thead>
          <tr>
            <th>Selección</th>
            <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
            <th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((fila, i) => (
            <tr key={fila.codigo} className={styles.tablaFila}>
              <td>
                <span className={styles.equipoNombreTabla}>
                  <PosCircle pos={i} />
                  {fila.nombre}
                </span>
              </td>
              <td>{fila.pj}</td><td>{fila.pg}</td><td>{fila.pe}</td><td>{fila.pp}</td>
              <td>{fila.gf}</td><td>{fila.gc}</td>
              <td>{fila.dg > 0 ? `+${fila.dg}` : fila.dg}</td>
              <td className={styles.pts}>{fila.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.partidos}>
        {grupo.partidos.map((p) => {
          const r = resultados[p.id];
          const isSimP = simulando.has(p.id);
          return (
            <div key={p.id} className={styles.partido}>
              <span className={styles.fechaTag}>{p.fecha.replace(" jun", "/6")}</span>
              <span className={styles.equipoPartido}>{p.equipo_a.nombre}</span>
              <div className={styles.scoreWrap}>
                <input
                  type="number" min={0} max={99}
                  className={`${styles.scoreInput} ${r ? styles.scoreFilled : ""}`}
                  value={r !== undefined ? r[0] : ""}
                  onChange={(e) => onScoreChange(p.id, "a", e.target.value)}
                  placeholder="–"
                />
                <span className={styles.scoreSep}>:</span>
                <input
                  type="number" min={0} max={99}
                  className={`${styles.scoreInput} ${r ? styles.scoreFilled : ""}`}
                  value={r !== undefined ? r[1] : ""}
                  onChange={(e) => onScoreChange(p.id, "b", e.target.value)}
                  placeholder="–"
                />
              </div>
              <span className={`${styles.equipoPartido} ${styles.equipoPartidoB}`}>{p.equipo_b.nombre}</span>
              <button
                className={styles.btnSim}
                onClick={() => onSimPartido(p.id)}
                disabled={isSimP || simulando.size > 0}
              >
                {isSimP ? "..." : "Sim"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatchCard({
  match, label, onSim, disabled,
}: {
  match: KOMatch;
  label: string;
  onSim: () => void;
  disabled: boolean;
}) {
  const { team_a, team_b, resultado } = match;
  const penStr = resultado?.penales
    ? ` (${resultado.penales_a}–${resultado.penales_b} pen)` : "";

  return (
    <div className={styles.bracketMatch}>
      <div className={styles.bracketMatchHeader}>
        <span>{label}</span>
        {team_a && team_b && !resultado && (
          <button className={styles.btnSimBracket} onClick={onSim} disabled={disabled || match.simulating}>
            {match.simulating ? "..." : "Simular"}
          </button>
        )}
        {resultado && penStr && (
          <span style={{ fontSize: "0.55rem", opacity: 0.6 }}>{penStr}</span>
        )}
      </div>
      {[
        { team: team_a, goles: resultado?.goles_a, isWinner: resultado?.ganador === "a" },
        { team: team_b, goles: resultado?.goles_b, isWinner: resultado?.ganador === "b" },
      ].map(({ team, goles, isWinner }, idx) =>
        team ? (
          <div
            key={team.codigo}
            className={`${styles.bracketEquipo} ${isWinner ? styles.bracketGanador : ""}`}
          >
            <span className={styles.bracketEquipoNombre}>{team.nombre}</span>
            {resultado !== undefined && (
              <span className={styles.bracketGoles}>{goles}</span>
            )}
          </div>
        ) : (
          <div key={idx} className={styles.bracketEquipoPlaceholder}>Por definir</div>
        )
      )}
    </div>
  );
}

function RoundColumn({
  label, matches, startNum, onSim, disabled,
}: {
  label: string;
  matches: KOMatch[];
  startNum: number;
  onSim: (m: KOMatch) => void;
  disabled: boolean;
}) {
  if (matches.length === 0) return null;
  return (
    <div className={styles.ronda}>
      <div className={styles.rondaLabel}>{label}</div>
      {matches.map((m, i) => (
        <BracketMatchCard
          key={m.id}
          match={m}
          label={`P${startNum + i}`}
          onSim={() => onSim(m)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TorneoPage() {
  const [grupos, setGrupos] = useState<GrupoFixtureT[]>([]);
  const [resultados, setResultados] = useState<Record<string, [number, number]>>({});
  const [simulando, setSimulando] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"grupos" | "eliminatorias">("grupos");

  // KO bracket state — one array per round
  const [terceros, setTerceros] = useState<FilaTabla[]>([]);
  const [r32, setR32] = useState<KOMatch[]>([]);
  const [oct, setOct] = useState<KOMatch[]>([]);
  const [cua, setCua] = useState<KOMatch[]>([]);
  const [sem, setSem] = useState<KOMatch[]>([]);
  const [fin, setFin] = useState<KOMatch | undefined>();
  const [ter, setTer] = useState<KOMatch | undefined>();

  useEffect(() => {
    getTorneoFixture().then((f) => setGrupos(f.grupos));
  }, []);

  const tablas: Record<string, FilaTabla[]> = {};
  for (const g of grupos) tablas[g.nombre] = calcTabla(g, resultados);

  const allComplete = allGroupsComplete(grupos, resultados);

  // Fetch best thirds when groups are done
  useEffect(() => {
    if (!allComplete) return;
    const tablasList: SimularGrupoResponse[] = Object.entries(tablas).map(([grupo, tabla]) => ({
      grupo,
      tabla,
      partidos: grupos
        .find((g) => g.nombre === grupo)!
        .partidos.filter((p) => resultados[p.id])
        .map((p) => ({ partido_id: p.id, goles_a: resultados[p.id][0], goles_b: resultados[p.id][1] })),
    }));
    getMejoresTerceros(tablasList).then((res) => setTerceros(res.clasificados));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete]);

  // Build R32 when standings + terceros are ready
  useEffect(() => {
    if (!allComplete || terceros.length === 0) return;
    setR32(
      R32_SLOTS.map(([sa, sb], i) => ({
        id: `R32_${i}`,
        team_a: resolveSlot(sa, tablas, terceros),
        team_b: resolveSlot(sb, tablas, terceros),
      }))
    );
    setOct([]); setCua([]); setSem([]);
    setFin(undefined); setTer(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, terceros]);

  // Cascade: when a round is fully simulated, unlock the next
  useEffect(() => {
    if (r32.length > 0 && r32.every((m) => m.resultado))
      setOct(buildNextRound(r32, "OCT", PAIRS_8));
  }, [r32]);

  useEffect(() => {
    if (oct.length > 0 && oct.every((m) => m.resultado))
      setCua(buildNextRound(oct, "CUA", PAIRS_4));
  }, [oct]);

  useEffect(() => {
    if (cua.length > 0 && cua.every((m) => m.resultado))
      setSem(buildNextRound(cua, "SEM", PAIRS_2));
  }, [cua]);

  useEffect(() => {
    if (sem.length < 2 || !sem.every((m) => m.resultado)) return;
    setFin({ id: "FIN", team_a: winner(sem[0]), team_b: winner(sem[1]) });
    setTer({ id: "TER", team_a: loser(sem[0]),  team_b: loser(sem[1]) });
  }, [sem]);

  // ── Simulando helpers ────────────────────────────────────────────────────────

  const addSim    = (k: string) => setSimulando((s) => new Set([...s, k]));
  const removeSim = (k: string) => setSimulando((s) => { const n = new Set(s); n.delete(k); return n; });

  // ── Group phase handlers ─────────────────────────────────────────────────────

  const handleScoreChange = useCallback(
    (pid: string, side: "a" | "b", val: string) => {
      const n = parseInt(val);
      if (val === "" || isNaN(n) || n < 0) {
        setResultados((r) => { const next = { ...r }; delete next[pid]; return next; });
        return;
      }
      setResultados((r) => {
        const prev = r[pid] ?? [0, 0];
        const next: [number, number] = side === "a"
          ? [Math.max(0, n), prev[1]]
          : [prev[0], Math.max(0, n)];
        return { ...r, [pid]: next };
      });
    }, []
  );

  const handleSimPartido = useCallback(async (pid: string) => {
    addSim(pid);
    try {
      const grupoNombre = pid[0];
      const grupoData = grupos.find((g) => g.nombre === grupoNombre)!;
      const previos: ResultadoPartido[] = grupoData.partidos
        .filter((p) => p.id !== pid && resultados[p.id])
        .map((p) => ({ partido_id: p.id, goles_a: resultados[p.id][0], goles_b: resultados[p.id][1] }));
      const res = await simularGrupo(grupoNombre, previos);
      const match = res.partidos.find((p) => p.partido_id === pid);
      if (match) setResultados((r) => ({ ...r, [pid]: [match.goles_a, match.goles_b] }));
    } finally { removeSim(pid); }
  }, [grupos, resultados]);

  const handleSimGrupo = useCallback(async (grupoNombre: string) => {
    const key = `grupo_${grupoNombre}`;
    addSim(key);
    try {
      const grupoData = grupos.find((g) => g.nombre === grupoNombre)!;
      const previos: ResultadoPartido[] = grupoData.partidos
        .filter((p) => resultados[p.id])
        .map((p) => ({ partido_id: p.id, goles_a: resultados[p.id][0], goles_b: resultados[p.id][1] }));
      const res = await simularGrupo(grupoNombre, previos);
      const update: Record<string, [number, number]> = {};
      for (const p of res.partidos) update[p.partido_id] = [p.goles_a, p.goles_b];
      setResultados((r) => ({ ...r, ...update }));
    } finally { removeSim(key); }
  }, [grupos, resultados]);

  const handleSimTodos = useCallback(async () => {
    addSim("todos");
    try {
      const previos: ResultadoPartido[] = Object.entries(resultados).map(
        ([pid, [ga, gb]]) => ({ partido_id: pid, goles_a: ga, goles_b: gb })
      );
      const res = await simularTodos(previos);
      const update: Record<string, [number, number]> = {};
      for (const g of res.grupos)
        for (const p of g.partidos)
          update[p.partido_id] = [p.goles_a, p.goles_b];
      setResultados((r) => ({ ...r, ...update }));
    } finally { removeSim("todos"); }
  }, [resultados]);

  // ── KO simulation ────────────────────────────────────────────────────────────

  const simInRound = useCallback(async (
    match: KOMatch,
    setter: React.Dispatch<React.SetStateAction<KOMatch[]>>
  ) => {
    if (!match.team_a || !match.team_b) return;
    setter((prev) => prev.map((m) => m.id === match.id ? { ...m, simulating: true } : m));
    try {
      const res = await simularKO(match.team_a.codigo, match.team_b.codigo);
      setter((prev) => prev.map((m) => m.id === match.id ? { ...m, resultado: res, simulating: false } : m));
    } catch {
      setter((prev) => prev.map((m) => m.id === match.id ? { ...m, simulating: false } : m));
    }
  }, []);

  const simSingle = useCallback(async (
    match: KOMatch,
    setter: React.Dispatch<React.SetStateAction<KOMatch | undefined>>
  ) => {
    if (!match.team_a || !match.team_b) return;
    setter((m) => m ? { ...m, simulating: true } : m);
    try {
      const res = await simularKO(match.team_a!.codigo, match.team_b!.codigo);
      setter((m) => m ? { ...m, resultado: res, simulating: false } : m);
    } catch {
      setter((m) => m ? { ...m, simulating: false } : m);
    }
  }, []);

  const isSimulando = simulando.size > 0;
  const campeon = fin?.resultado
    ? (fin.resultado.ganador === "a" ? fin.team_a : fin.team_b)
    : undefined;

  return (
    <div className={styles.page}>
      {/* ── Escenarios ── */}
      <EscenariosSection grupos={grupos} />

      <div className={styles.sectionDivider}>
        <div className="container">
          <div className={styles.dividerLine} />
        </div>
      </div>

      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div>
              <h1 className={styles.heroTitle}>Simulador del Torneo</h1>
              <p className={styles.heroSub}>Mundial 2026 · 12 grupos · 48 selecciones</p>
            </div>
            <button
              className={styles.btnSimularTodos}
              onClick={handleSimTodos}
              disabled={isSimulando}
            >
              {simulando.has("todos") ? "Simulando..." : "Simular todos los grupos"}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "grupos" ? styles.tabActive : ""}`}
            onClick={() => setTab("grupos")}
          >
            Fase de Grupos
          </button>
          <button
            className={`${styles.tab} ${tab === "eliminatorias" ? styles.tabActive : ""} ${!allComplete ? styles.tabDisabled : ""}`}
            onClick={() => allComplete && setTab("eliminatorias")}
          >
            Eliminatorias {!allComplete && "🔒"}
          </button>
        </div>

        {tab === "grupos" && (
          <div className={styles.gruposGrid}>
            {grupos.map((g) => (
              <GrupoCard
                key={g.nombre}
                grupo={g}
                resultados={resultados}
                simulando={simulando}
                onScoreChange={handleScoreChange}
                onSimPartido={handleSimPartido}
                onSimGrupo={handleSimGrupo}
              />
            ))}
          </div>
        )}

        {tab === "eliminatorias" && (
          !allComplete ? (
            <div className={styles.emptyBracket}>
              <div className={styles.emptyBracketIcon}>🏆</div>
              <p className={styles.emptyBracketText}>Completa la fase de grupos primero</p>
              <p className={styles.emptyBracketSub}>Simula o ingresa todos los resultados para desbloquear el bracket</p>
            </div>
          ) : (
            <div className={styles.bracket}>
              <div className={styles.bracketInner}>
                <RoundColumn
                  label="Ronda de 32"
                  matches={r32}
                  startNum={49}
                  onSim={(m) => simInRound(m, setR32)}
                  disabled={isSimulando}
                />
                <RoundColumn
                  label="Octavos de final"
                  matches={oct}
                  startNum={65}
                  onSim={(m) => simInRound(m, setOct)}
                  disabled={isSimulando}
                />
                <RoundColumn
                  label="Cuartos de final"
                  matches={cua}
                  startNum={73}
                  onSim={(m) => simInRound(m, setCua)}
                  disabled={isSimulando}
                />
                <RoundColumn
                  label="Semifinales"
                  matches={sem}
                  startNum={77}
                  onSim={(m) => simInRound(m, setSem)}
                  disabled={isSimulando}
                />

                {/* Final + 3er lugar */}
                {fin && (
                  <div className={styles.ronda}>
                    <div className={styles.rondaLabel}>Final</div>
                    {ter && (
                      <BracketMatchCard
                        match={ter}
                        label="3er y 4to lugar"
                        onSim={() => simSingle(ter, setTer)}
                        disabled={isSimulando}
                      />
                    )}
                    <BracketMatchCard
                      match={fin}
                      label="Gran Final"
                      onSim={() => simSingle(fin, setFin)}
                      disabled={isSimulando}
                    />
                  </div>
                )}

                {campeon && (
                  <div className={styles.campeonCard}>
                    <div className={styles.campeonLabel}>Campeón Mundial 2026</div>
                    <div className={styles.campeonNombre}>{campeon.nombre}</div>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
