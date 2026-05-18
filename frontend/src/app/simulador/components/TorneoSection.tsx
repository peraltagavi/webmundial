"use client";

import { useEffect, useState } from "react";
import { getTorneoFixture, calcularEscenarios } from "@/lib/api";
import type { GrupoFixtureT, EscenariosResponse, PartidoFixtureT } from "@/lib/types";
import styles from "./TorneoSection.module.css";

// ─── Hardcoded group data ─────────────────────────────────────────────────────

const GRUPOS_DATA: Record<string, Array<{ nombre: string; bandera: string }>> = {
  A: [{ nombre: "México", bandera: "🇲🇽" }, { nombre: "Sudáfrica", bandera: "🇿🇦" }, { nombre: "República de Corea", bandera: "🇰🇷" }, { nombre: "República Checa", bandera: "🇨🇿" }],
  B: [{ nombre: "Canadá", bandera: "🇨🇦" }, { nombre: "Bosnia y Herzegovina", bandera: "🇧🇦" }, { nombre: "Catar", bandera: "🇶🇦" }, { nombre: "Suiza", bandera: "🇨🇭" }],
  C: [{ nombre: "Brasil", bandera: "🇧🇷" }, { nombre: "Marruecos", bandera: "🇲🇦" }, { nombre: "Haití", bandera: "🇭🇹" }, { nombre: "Escocia", bandera: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" }],
  D: [{ nombre: "Estados Unidos", bandera: "🇺🇸" }, { nombre: "Paraguay", bandera: "🇵🇾" }, { nombre: "Australia", bandera: "🇦🇺" }, { nombre: "Turquía", bandera: "🇹🇷" }],
  E: [{ nombre: "Alemania", bandera: "🇩🇪" }, { nombre: "Curazao", bandera: "🇨🇼" }, { nombre: "Costa de Marfil", bandera: "🇨🇮" }, { nombre: "Ecuador", bandera: "🇪🇨" }],
  F: [{ nombre: "Países Bajos", bandera: "🇳🇱" }, { nombre: "Japón", bandera: "🇯🇵" }, { nombre: "Suecia", bandera: "🇸🇪" }, { nombre: "Túnez", bandera: "🇹🇳" }],
  G: [{ nombre: "Bélgica", bandera: "🇧🇪" }, { nombre: "Egipto", bandera: "🇪🇬" }, { nombre: "Irán", bandera: "🇮🇷" }, { nombre: "Nueva Zelanda", bandera: "🇳🇿" }],
  H: [{ nombre: "España", bandera: "🇪🇸" }, { nombre: "Cabo Verde", bandera: "🇨🇻" }, { nombre: "Arabia Saudí", bandera: "🇸🇦" }, { nombre: "Uruguay", bandera: "🇺🇾" }],
  I: [{ nombre: "Francia", bandera: "🇫🇷" }, { nombre: "Senegal", bandera: "🇸🇳" }, { nombre: "Irak", bandera: "🇮🇶" }, { nombre: "Noruega", bandera: "🇳🇴" }],
  J: [{ nombre: "Argentina", bandera: "🇦🇷" }, { nombre: "Argelia", bandera: "🇩🇿" }, { nombre: "Austria", bandera: "🇦🇹" }, { nombre: "Jordania", bandera: "🇯🇴" }],
  K: [{ nombre: "Portugal", bandera: "🇵🇹" }, { nombre: "RD de Congo", bandera: "🇨🇩" }, { nombre: "Uzbekistán", bandera: "🇺🇿" }, { nombre: "Colombia", bandera: "🇨🇴" }],
  L: [{ nombre: "Inglaterra", bandera: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { nombre: "Croacia", bandera: "🇭🇷" }, { nombre: "Ghana", bandera: "🇬🇭" }, { nombre: "Panamá", bandera: "🇵🇦" }],
};

const R32_SLOTS: Array<[string, string]> = [
  ["1A", "2B"], ["1C", "2D"], ["1E", "2F"], ["1G", "2H"],
  ["1I", "2J"], ["1K", "2L"], ["2A", "1B"], ["2C", "1D"],
  ["2E", "1F"], ["2G", "1H"], ["2I", "1J"], ["2K", "1L"],
  ["3T1", "3T2"], ["3T3", "3T4"], ["3T5", "3T6"], ["3T7", "3T8"],
];

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamPosVal = "1" | "2" | "3" | null;
type TeamPos = Record<string, Record<string, TeamPosVal>>;

interface BTeam { nombre: string; bandera: string; }
interface BMatch { teamA: BTeam | null; teamB: BTeam | null; winner: BTeam | null; }
interface BracketState {
  r32: BMatch[]; r16: BMatch[]; qf: BMatch[]; sf: BMatch[];
  final: BMatch; third: BMatch;
}

// ─── EscenariosSection (uses API data for real match IDs/dates) ───────────────

interface EscenariosMatch {
  partido_id: string; fecha: string;
  nombre_a: string; codigo_a: string;
  nombre_b: string; codigo_b: string;
  goles_a: string; goles_b: string;
}

function EscenariosSection({ grupos }: { grupos: GrupoFixtureT[] }) {
  const [equipoCodigo, setEquipoCodigo] = useState("");
  const [matches, setMatches] = useState<EscenariosMatch[]>([]);
  const [resultado, setResultado] = useState<EscenariosResponse | null>(null);
  const [calculando, setCalculando] = useState(false);

  const allTeams = grupos.flatMap((g) => g.equipos).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  useEffect(() => {
    if (!equipoCodigo || !grupos.length) { setMatches([]); setResultado(null); return; }
    setResultado(null);
    const grupo = grupos.find((g) => g.equipos.some((e) => e.codigo === equipoCodigo));
    if (!grupo) return;
    setMatches(
      grupo.partidos
        .filter((p: PartidoFixtureT) => p.equipo_a.codigo === equipoCodigo || p.equipo_b.codigo === equipoCodigo)
        .map((p: PartidoFixtureT) => ({
          partido_id: p.id, fecha: p.fecha,
          nombre_a: p.equipo_a.nombre, codigo_a: p.equipo_a.codigo,
          nombre_b: p.equipo_b.nombre, codigo_b: p.equipo_b.codigo,
          goles_a: "", goles_b: "",
        }))
    );
  }, [equipoCodigo, grupos]);

  function setScore(idx: number, side: "a" | "b", val: string) {
    setMatches((prev) => prev.map((m, i) => i === idx ? { ...m, [`goles_${side}`]: val } : m));
  }

  async function handleCalcular() {
    if (!equipoCodigo) return;
    setCalculando(true); setResultado(null);
    try {
      const res = await calcularEscenarios(equipoCodigo, matches.map((m) => ({
        partido_id: m.partido_id,
        goles_local: m.goles_a !== "" ? parseInt(m.goles_a) : null,
        goles_visitante: m.goles_b !== "" ? parseInt(m.goles_b) : null,
      })));
      setResultado(res);
    } finally { setCalculando(false); }
  }

  const estadoIcon = resultado?.estado === "clasifica" ? "✅" : resultado?.estado === "eliminado" ? "❌" : "⚠️";
  const estadoClass = resultado?.estado === "clasifica" ? styles.escEstadoOk : resultado?.estado === "eliminado" ? styles.escEstadoNo : styles.escEstadoDep;

  return (
    <div className={styles.escenariosSection}>
      <div className="container">
        <div className={styles.escenariosHeader}>
          <h2 className={styles.escenariosTitle}>¿Qué necesita mi equipo para clasificar?</h2>
          <p className={styles.escenariosSubtitle}>Ingresa los resultados de tu selección y calcula en cuántos escenarios avanza a eliminatorias.</p>
        </div>
        <div className={styles.escTeamRow}>
          <div className={styles.escSelectWrapper}>
            <select className={styles.escSelect} value={equipoCodigo} onChange={(e) => setEquipoCodigo(e.target.value)}>
              <option value="">Elige tu equipo…</option>
              {allTeams.map((t) => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
            </select>
            <span className={styles.escSelectArrow}>▼</span>
          </div>
        </div>
        {matches.length > 0 && (
          <div className={styles.escMatches}>
            {matches.map((m, idx) => (
              <div key={m.partido_id} className={styles.escMatchRow}>
                <span className={styles.escMatchDate}>{m.fecha}</span>
                <span className={`${styles.escMatchTeam} ${styles.escMatchTeamA}`}>{m.nombre_a}</span>
                <div className={styles.escScoreWrap}>
                  <input type="number" min={0} max={99} className={styles.escScoreInput} value={m.goles_a} onChange={(e) => setScore(idx, "a", e.target.value)} placeholder="–" />
                  <span className={styles.escScoreSep}>:</span>
                  <input type="number" min={0} max={99} className={styles.escScoreInput} value={m.goles_b} onChange={(e) => setScore(idx, "b", e.target.value)} placeholder="–" />
                </div>
                <span className={styles.escMatchTeam}>{m.nombre_b}</span>
              </div>
            ))}
            <div className={styles.escCalcWrap}>
              <button className={styles.btnCalcular} onClick={handleCalcular} disabled={calculando}>
                {calculando ? "Calculando…" : "CALCULAR ESCENARIOS"}
              </button>
            </div>
          </div>
        )}
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
                  {resultado.escenarios_descripcion.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
            {resultado.tabla_actual.length > 0 && (
              <div className={styles.escTablaWrap}>
                <div className={styles.escTablaLabel}>Tabla del grupo (con los resultados ingresados)</div>
                <table className={styles.escTabla}>
                  <thead><tr><th>Pos</th><th>Selección</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>DG</th><th>Pts</th></tr></thead>
                  <tbody>
                    {resultado.tabla_actual.map((fila) => (
                      <tr key={fila.codigo} className={fila.codigo === equipoCodigo ? styles.escTablaRowHighlight : ""}>
                        <td>{fila.posicion}</td><td>{fila.nombre}</td>
                        <td>{fila.pj}</td><td>{fila.pg}</td><td>{fila.pe}</td><td>{fila.pp}</td>
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

// ─── Phase 1: Group selection ─────────────────────────────────────────────────

function GroupCard({ grupo, equipos, teamPos, onPosClick }: {
  grupo: string;
  equipos: Array<{ nombre: string; bandera: string }>;
  teamPos: Record<string, TeamPosVal>;
  onPosClick: (nombre: string, pos: "1" | "2" | "3") => void;
}) {
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHeader}>Grupo {grupo}</div>
      <div className={styles.groupTeams}>
        {equipos.map((eq) => {
          const pos = teamPos[eq.nombre] ?? null;
          return (
            <div key={eq.nombre} className={styles.groupTeamRow}>
              <span className={styles.groupTeamFlag}>{eq.bandera}</span>
              <span className={styles.groupTeamName}>{eq.nombre}</span>
              {(["1", "2", "3"] as const).map((p) => (
                <button
                  key={p}
                  className={`${styles.posBtn} ${pos === p ? (p === "1" ? styles.posBtnFirst : p === "2" ? styles.posBtnSecond : styles.posBtnThird) : ""}`}
                  onClick={() => onPosClick(eq.nombre, p)}
                  aria-label={`${eq.nombre} ${p}°`}
                >
                  {p}°
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase 2: Bracket components ─────────────────────────────────────────────

function TeamCard({ team, isWinner, isLoser, canAdvance, onAdvance }: {
  team: BTeam | null;
  isWinner: boolean;
  isLoser: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
}) {
  if (!team) {
    return <div className={styles.bTeamPlaceholder}>Por definir</div>;
  }
  return (
    <div className={`${styles.bTeamCard} ${isWinner ? styles.bTeamWinner : ""} ${isLoser ? styles.bTeamLoser : ""}`}>
      <span className={styles.bTeamFlag}>{team.bandera}</span>
      <span className={styles.bTeamName}>{team.nombre}</span>
      {canAdvance && (
        <button className={styles.advanceBtn} onClick={onAdvance}>→ Avanza</button>
      )}
      {isWinner && (
        <span className={styles.advancedTag}>✓ Avanzó</span>
      )}
    </div>
  );
}

function BracketMatchCard({ match, round, matchIdx, onAdvance, isGolden }: {
  match: BMatch;
  round: string;
  matchIdx: number;
  onAdvance: (round: string, idx: number, team: BTeam) => void;
  isGolden?: boolean;
}) {
  const canAdvance = match.teamA !== null && match.teamB !== null && match.winner === null;
  const winnerNombre = match.winner?.nombre;
  return (
    <div className={`${styles.bMatch} ${isGolden ? styles.bMatchGolden : ""}`}>
      <TeamCard
        team={match.teamA}
        isWinner={!!winnerNombre && winnerNombre === match.teamA?.nombre}
        isLoser={!!winnerNombre && winnerNombre !== match.teamA?.nombre}
        canAdvance={canAdvance}
        onAdvance={() => match.teamA && onAdvance(round, matchIdx, match.teamA)}
      />
      <div className={styles.bVs}>VS</div>
      <TeamCard
        team={match.teamB}
        isWinner={!!winnerNombre && winnerNombre === match.teamB?.nombre}
        isLoser={!!winnerNombre && winnerNombre !== match.teamB?.nombre}
        canAdvance={canAdvance}
        onAdvance={() => match.teamB && onAdvance(round, matchIdx, match.teamB)}
      />
    </div>
  );
}

function BracketCol({ label, matches, round, startIdx, onAdvance }: {
  label: string;
  matches: BMatch[];
  round: string;
  startIdx: number;
  onAdvance: (round: string, idx: number, team: BTeam) => void;
}) {
  return (
    <div className={styles.bracketCol}>
      <div className={styles.colLabel}>{label}</div>
      <div className={styles.colMatches}>
        {matches.map((m, i) => (
          <div key={i} className={styles.matchSlot}>
            <BracketMatchCard match={m} round={round} matchIdx={startIdx + i} onAdvance={onAdvance} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketView({ bracket, onAdvance, onBack }: {
  bracket: BracketState;
  onAdvance: (round: string, idx: number, team: BTeam) => void;
  onBack: () => void;
}) {
  const campeon = bracket.final.winner;
  return (
    <div className={styles.bracketContainer}>
      <div className={styles.bracketTopBar}>
        <button className={styles.btnBack} onClick={onBack}>← Volver a grupos</button>
        <span className={styles.bracketTitle}>Eliminatorias Mundial 2026</span>
      </div>
      <div className={styles.bracketScroll}>
        <div className={styles.bracketInner}>
          {/* Left half */}
          <BracketCol label="16avos de final" matches={bracket.r32.slice(0, 8)} round="r32" startIdx={0} onAdvance={onAdvance} />
          <BracketCol label="8avos de final" matches={bracket.r16.slice(0, 4)} round="r16" startIdx={0} onAdvance={onAdvance} />
          <BracketCol label="Cuartos de final" matches={bracket.qf.slice(0, 2)} round="qf" startIdx={0} onAdvance={onAdvance} />
          <BracketCol label="Semifinales" matches={bracket.sf.slice(0, 1)} round="sf" startIdx={0} onAdvance={onAdvance} />

          {/* Center: Final + Third */}
          <div className={styles.finalCol}>
            <div className={styles.finalColInner}>
              <div className={styles.finalLabel}>FINAL</div>
              <BracketMatchCard match={bracket.final} round="final" matchIdx={0} onAdvance={onAdvance} isGolden />
              {campeon && (
                <div className={styles.champion}>
                  <div className={styles.championTrophy}>🏆</div>
                  <div className={styles.championName}>{campeon.bandera} {campeon.nombre}</div>
                  <div className={styles.championSub}>Campeón Mundial 2026</div>
                </div>
              )}
              <div className={styles.thirdLabel}>3ER PUESTO</div>
              <BracketMatchCard match={bracket.third} round="third" matchIdx={0} onAdvance={onAdvance} />
            </div>
          </div>

          {/* Right half */}
          <BracketCol label="Semifinales" matches={bracket.sf.slice(1, 2)} round="sf" startIdx={1} onAdvance={onAdvance} />
          <BracketCol label="Cuartos de final" matches={bracket.qf.slice(2, 4)} round="qf" startIdx={2} onAdvance={onAdvance} />
          <BracketCol label="8avos de final" matches={bracket.r16.slice(4, 8)} round="r16" startIdx={4} onAdvance={onAdvance} />
          <BracketCol label="16avos de final" matches={bracket.r32.slice(8, 16)} round="r32" startIdx={8} onAdvance={onAdvance} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const emptyMatch = (): BMatch => ({ teamA: null, teamB: null, winner: null });

export default function TorneoSection() {
  const [apiGrupos, setApiGrupos] = useState<GrupoFixtureT[]>([]);

  const [teamPos, setTeamPos] = useState<TeamPos>(() =>
    Object.fromEntries(
      Object.entries(GRUPOS_DATA).map(([g, eqs]) => [
        g,
        Object.fromEntries(eqs.map((eq) => [eq.nombre, null as TeamPosVal])),
      ])
    )
  );
  const [selectedTerceros, setSelectedTerceros] = useState<string[]>([]);
  const [phase, setPhase] = useState<"grupos" | "bracket">("grupos");
  const [bracket, setBracket] = useState<BracketState | null>(null);

  useEffect(() => {
    getTorneoFixture().then((f) => setApiGrupos(f.grupos)).catch(() => {});
  }, []);

  // Derived
  const priSegs = Object.values(teamPos).reduce(
    (acc, g) => acc + Object.values(g).filter((p) => p === "1" || p === "2").length, 0
  );
  const allTerceros = Object.entries(GRUPOS_DATA).flatMap(([g, eqs]) =>
    eqs.filter((eq) => teamPos[g]?.[eq.nombre] === "3")
  );
  const totalSelected = priSegs + selectedTerceros.length;
  const showTerceros = priSegs >= 24 && allTerceros.length > 0;
  const canGenerate = totalSelected === 32;

  function handlePosClick(grupo: string, nombre: string, pos: "1" | "2" | "3") {
    const currentPos = teamPos[grupo]?.[nombre];
    // Clean selectedTerceros if team was a 3° being changed
    if (currentPos === "3") setSelectedTerceros((st) => st.filter((n) => n !== nombre));

    setTeamPos((prev) => {
      const gp = { ...prev[grupo] };
      if (gp[nombre] === pos) { gp[nombre] = null; return { ...prev, [grupo]: gp }; }
      if (pos === "1" || pos === "2") {
        const holder = Object.keys(gp).find((n) => gp[n] === pos);
        if (holder) gp[holder] = null;
      }
      gp[nombre] = pos;
      return { ...prev, [grupo]: gp };
    });
  }

  function handleTerceroClick(nombre: string) {
    setSelectedTerceros((prev) => {
      if (prev.includes(nombre)) return prev.filter((n) => n !== nombre);
      if (prev.length >= 8) return prev;
      return [...prev, nombre];
    });
  }

  function handleReset() {
    setTeamPos(
      Object.fromEntries(
        Object.entries(GRUPOS_DATA).map(([g, eqs]) => [
          g, Object.fromEntries(eqs.map((eq) => [eq.nombre, null as TeamPosVal])),
        ])
      )
    );
    setSelectedTerceros([]);
  }

  function handleGenerarBracket() {
    if (!canGenerate) return;

    const primeros: Record<string, BTeam> = {};
    const segundos: Record<string, BTeam> = {};

    for (const [g, eqs] of Object.entries(GRUPOS_DATA)) {
      for (const eq of eqs) {
        const pos = teamPos[g]?.[eq.nombre];
        if (pos === "1") primeros[g] = eq;
        else if (pos === "2") segundos[g] = eq;
      }
    }

    const tercerosOrdered: BTeam[] = selectedTerceros.flatMap((nombre) => {
      for (const [g, eqs] of Object.entries(GRUPOS_DATA)) {
        const eq = eqs.find((e) => e.nombre === nombre && teamPos[g]?.[e.nombre] === "3");
        if (eq) return [eq];
      }
      return [];
    });

    const resolveSlot = (slot: string): BTeam | null => {
      const m3 = slot.match(/^3T(\d+)$/);
      if (m3) return tercerosOrdered[parseInt(m3[1]) - 1] || null;
      const p = parseInt(slot[0]);
      const g = slot.slice(1);
      return p === 1 ? (primeros[g] || null) : (segundos[g] || null);
    };

    setBracket({
      r32: R32_SLOTS.map(([sa, sb]) => ({ teamA: resolveSlot(sa), teamB: resolveSlot(sb), winner: null })),
      r16: Array.from({ length: 8 }, emptyMatch),
      qf:  Array.from({ length: 4 }, emptyMatch),
      sf:  Array.from({ length: 2 }, emptyMatch),
      final: emptyMatch(),
      third: emptyMatch(),
    });
    setPhase("bracket");
  }

  function handleAdvance(round: string, matchIdx: number, team: BTeam) {
    setBracket((prev) => {
      if (!prev) return prev;
      const next: BracketState = JSON.parse(JSON.stringify(prev));

      if (round === "r32") {
        next.r32[matchIdx].winner = team;
        if (matchIdx < 8) {
          const ni = Math.floor(matchIdx / 2);
          next.r16[ni][matchIdx % 2 === 0 ? "teamA" : "teamB"] = team;
        } else {
          const mi = matchIdx - 8;
          const ni = 4 + Math.floor(mi / 2);
          next.r16[ni][mi % 2 === 0 ? "teamA" : "teamB"] = team;
        }
      } else if (round === "r16") {
        next.r16[matchIdx].winner = team;
        if (matchIdx < 4) {
          next.qf[Math.floor(matchIdx / 2)][matchIdx % 2 === 0 ? "teamA" : "teamB"] = team;
        } else {
          const mi = matchIdx - 4;
          next.qf[2 + Math.floor(mi / 2)][mi % 2 === 0 ? "teamA" : "teamB"] = team;
        }
      } else if (round === "qf") {
        next.qf[matchIdx].winner = team;
        const sfIdx = matchIdx < 2 ? 0 : 1;
        next.sf[sfIdx][matchIdx % 2 === 0 ? "teamA" : "teamB"] = team;
      } else if (round === "sf") {
        next.sf[matchIdx].winner = team;
        const slot = matchIdx === 0 ? "teamA" : "teamB";
        next.final[slot] = team;
        const sfMatch = prev.sf[matchIdx];
        const loser = sfMatch.teamA?.nombre === team.nombre ? sfMatch.teamB : sfMatch.teamA;
        if (loser) next.third[slot] = loser;
      } else if (round === "final") {
        next.final.winner = team;
      } else if (round === "third") {
        next.third.winner = team;
      }

      return next;
    });
  }

  return (
    <div>
      {/* Escenarios section with API data */}
      <EscenariosSection grupos={apiGrupos} />

      {/* Navy divider */}
      <div className={styles.simuladorDivider}>
        <div className="container">
          <span className={styles.simuladorDividerTitle}>SIMULADOR DEL TORNEO COMPLETO</span>
        </div>
      </div>

      {phase === "grupos" ? (
        <div className={styles.phase1}>
          <div className="container">
            <p className={styles.instruction}>
              Selecciona el 1°, 2° y 3° de cada grupo. Luego elige los 8 mejores terceros.
            </p>

            <div className={styles.groupsGrid}>
              {Object.entries(GRUPOS_DATA).map(([g, eqs]) => (
                <GroupCard
                  key={g}
                  grupo={g}
                  equipos={eqs}
                  teamPos={teamPos[g] || {}}
                  onPosClick={(nombre, pos) => handlePosClick(g, nombre, pos)}
                />
              ))}
            </div>

            {/* Terceros panel */}
            {showTerceros && (
              <div className={styles.tercerosPanel}>
                <div className={styles.tercerosPanelTitle}>
                  Elige los 8 mejores terceros
                  <span className={styles.tercerosCount}>{selectedTerceros.length} de 8 seleccionados</span>
                </div>
                <div className={styles.tercerosGrid}>
                  {allTerceros.map((eq) => {
                    const isSelected = selectedTerceros.includes(eq.nombre);
                    return (
                      <button
                        key={eq.nombre}
                        className={`${styles.terceroChip} ${isSelected ? styles.terceroChipSelected : ""}`}
                        onClick={() => handleTerceroClick(eq.nombre)}
                        disabled={!isSelected && selectedTerceros.length >= 8}
                      >
                        <span>{eq.bandera}</span>
                        <span>{eq.nombre}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.generateWrap}>
                  <button
                    className={styles.btnGenerar}
                    disabled={!canGenerate}
                    onClick={handleGenerarBracket}
                  >
                    {canGenerate ? "GENERAR BRACKET →" : `GENERAR BRACKET (${totalSelected}/32)`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky bottom bar */}
          <div className={styles.stickyBar}>
            <div className="container">
              <div className={styles.stickyBarInner}>
                <span className={styles.stickyCounter}>
                  PAÍSES SELECCIONADOS: <strong>{totalSelected}</strong> de 32
                </span>
                <button className={styles.btnReset} onClick={handleReset}>
                  Reiniciar grupos
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        bracket && (
          <BracketView
            bracket={bracket}
            onAdvance={handleAdvance}
            onBack={() => setPhase("grupos")}
          />
        )
      )}
    </div>
  );
}
