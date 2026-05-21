"use client";

import { useEffect, useState } from "react";
import {
  getTorneoFixture,
  calcularEscenarios,
  getBracketEstado,
  simularCruce,
  avanzarCruce,
  limpiarCruce,
  reiniciarBracket,
} from "@/lib/api";
import type {
  GrupoFixtureT,
  EscenariosResponse,
  PartidoFixtureT,
  BracketEstadoResponse,
  BracketCruce,
} from "@/lib/types";
import styles from "./TorneoSection.module.css";

// ─── Layout constants ─────────────────────────────────────────────────────────

const H = 1120;       // canvas content height (px)
const CARD_H = 60;    // match card height (px)
const COL_W = 180;    // column width (px)
const COL_GAP = 50;   // gap between columns (px)
const COL_STRIDE = COL_W + COL_GAP; // 230
const TOTAL_W = 5 * COL_W + 4 * COL_GAP; // 1100
const HEADER_H = 32;
const RONDA_NAMES = ["dieciseisavos", "octavos", "cuartos", "semis", "final"] as const;
const RONDA_COUNTS = [16, 8, 4, 2, 1] as const;
const RONDA_LABELS = ["Ronda de 32", "Octavos", "Cuartos de Final", "Semifinales", "Final"];

function xLeft(r: number) { return r * COL_STRIDE; }
function yCenter(r: number, i: number) {
  const slot = H / RONDA_COUNTS[r];
  return i * slot + slot / 2;
}

// SF[0]=280 SF[1]=840 Final=560 (midpoint ✓)
const FINAL_Y    = yCenter(4, 0);          // 560
const FINAL_TOP  = FINAL_Y - CARD_H / 2;  // 530
const TERCERO_TOP = yCenter(3, 1) - CARD_H / 2; // 810

// ─── Code → display ───────────────────────────────────────────────────────────

const CODE_TO_TEAM: Record<string, { nombre: string; bandera: string }> = {
  MEX: { nombre: "México",             bandera: "🇲🇽" },
  RSA: { nombre: "Sudáfrica",          bandera: "🇿🇦" },
  KOR: { nombre: "Rep. de Corea",      bandera: "🇰🇷" },
  CZE: { nombre: "Rep. Checa",         bandera: "🇨🇿" },
  CAN: { nombre: "Canadá",             bandera: "🇨🇦" },
  BIH: { nombre: "Bosnia-Herz.",       bandera: "🇧🇦" },
  QAT: { nombre: "Catar",              bandera: "🇶🇦" },
  CHE: { nombre: "Suiza",              bandera: "🇨🇭" },
  BRA: { nombre: "Brasil",             bandera: "🇧🇷" },
  MAR: { nombre: "Marruecos",          bandera: "🇲🇦" },
  HTI: { nombre: "Haití",              bandera: "🇭🇹" },
  SCO: { nombre: "Escocia",            bandera: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { nombre: "EE.UU.",             bandera: "🇺🇸" },
  PRY: { nombre: "Paraguay",           bandera: "🇵🇾" },
  AUS: { nombre: "Australia",          bandera: "🇦🇺" },
  TUR: { nombre: "Turquía",            bandera: "🇹🇷" },
  DEU: { nombre: "Alemania",           bandera: "🇩🇪" },
  CUW: { nombre: "Curazao",            bandera: "🇨🇼" },
  CIV: { nombre: "Costa de Marfil",    bandera: "🇨🇮" },
  ECU: { nombre: "Ecuador",            bandera: "🇪🇨" },
  NLD: { nombre: "Países Bajos",       bandera: "🇳🇱" },
  JPN: { nombre: "Japón",              bandera: "🇯🇵" },
  SWE: { nombre: "Suecia",             bandera: "🇸🇪" },
  TUN: { nombre: "Túnez",              bandera: "🇹🇳" },
  BEL: { nombre: "Bélgica",            bandera: "🇧🇪" },
  EGY: { nombre: "Egipto",             bandera: "🇪🇬" },
  IRN: { nombre: "Irán",               bandera: "🇮🇷" },
  NZL: { nombre: "Nueva Zelanda",      bandera: "🇳🇿" },
  ESP: { nombre: "España",             bandera: "🇪🇸" },
  CPV: { nombre: "Cabo Verde",         bandera: "🇨🇻" },
  KSA: { nombre: "Arabia Saudí",       bandera: "🇸🇦" },
  URY: { nombre: "Uruguay",            bandera: "🇺🇾" },
  FRA: { nombre: "Francia",            bandera: "🇫🇷" },
  SEN: { nombre: "Senegal",            bandera: "🇸🇳" },
  IRQ: { nombre: "Irak",               bandera: "🇮🇶" },
  NOR: { nombre: "Noruega",            bandera: "🇳🇴" },
  ARG: { nombre: "Argentina",          bandera: "🇦🇷" },
  ALG: { nombre: "Argelia",            bandera: "🇩🇿" },
  AUT: { nombre: "Austria",            bandera: "🇦🇹" },
  JOR: { nombre: "Jordania",           bandera: "🇯🇴" },
  PRT: { nombre: "Portugal",           bandera: "🇵🇹" },
  COD: { nombre: "RD Congo",           bandera: "🇨🇩" },
  UZB: { nombre: "Uzbekistán",         bandera: "🇺🇿" },
  COL: { nombre: "Colombia",           bandera: "🇨🇴" },
  ENG: { nombre: "Inglaterra",         bandera: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  HRV: { nombre: "Croacia",            bandera: "🇭🇷" },
  GHA: { nombre: "Ghana",              bandera: "🇬🇭" },
  PAN: { nombre: "Panamá",             bandera: "🇵🇦" },
};

// ─── EscenariosSection ────────────────────────────────────────────────────────

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

// ─── SVG connector lines ──────────────────────────────────────────────────────

function ConnectorLines({ estado }: { estado: BracketEstadoResponse }) {
  const lines: React.ReactNode[] = [];

  for (let r = 0; r < 4; r++) {
    const rondaName = RONDA_NAMES[r];
    const cruces = [...(estado.rondas[rondaName] ?? [])].sort((a, b) => a.posicion - b.posicion);
    const xR = xLeft(r) + COL_W;          // right edge of current col
    const xM = xR + COL_GAP / 2;          // mid of gap
    const xL = xLeft(r + 1);              // left edge of next col
    const numNext = RONDA_COUNTS[r + 1];

    for (let j = 0; j < numNext; j++) {
      const c1 = cruces.find((c) => c.posicion === j * 2 + 1);
      const c2 = cruces.find((c) => c.posicion === j * 2 + 2);
      const y1 = yCenter(r, j * 2);
      const y2 = yCenter(r, j * 2 + 1);
      const yN = yCenter(r + 1, j);
      const lit1 = !!c1?.ganador;
      const lit2 = !!c2?.ganador;
      const colH = (lit: boolean) => lit ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.14)";
      const colV = "rgba(255,255,255,0.14)";
      const colIn = (lit1 && lit2) ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.14)";

      lines.push(
        <g key={`${r}-${j}`}>
          <line x1={xR} y1={y1} x2={xM} y2={y1} stroke={colH(lit1)} strokeWidth={1.5} />
          <line x1={xR} y1={y2} x2={xM} y2={y2} stroke={colH(lit2)} strokeWidth={1.5} />
          <line x1={xM} y1={y1} x2={xM} y2={y2} stroke={colV} strokeWidth={1.5} />
          <line x1={xM} y1={yN} x2={xL} y2={yN} stroke={colIn} strokeWidth={1.5} />
        </g>
      );
    }
  }

  return (
    <svg
      width={TOTAL_W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {lines}
    </svg>
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function TeamRow({
  codigo, isWinner, isLoser, clickable, onClick,
}: {
  codigo: string | null;
  isWinner: boolean;
  isLoser: boolean;
  clickable: boolean;
  onClick?: () => void;
}) {
  const team = codigo ? (CODE_TO_TEAM[codigo] ?? { nombre: codigo, bandera: "🏳" }) : null;
  return (
    <div
      className={[
        styles.cTeam,
        isWinner ? styles.cTeamWinner : "",
        isLoser  ? styles.cTeamLoser  : "",
        clickable ? styles.cTeamClickable : "",
      ].join(" ")}
      onClick={clickable && onClick ? onClick : undefined}
    >
      {team ? (
        <>
          <span className={styles.cFlag}>{team.bandera}</span>
          <span className={`${styles.cName} ${isWinner ? styles.cNameWinner : ""}`}>{team.nombre}</span>
          {isWinner && <span className={styles.cCheck}>✓</span>}
        </>
      ) : (
        <span className={styles.cEmpty}>Por definir</span>
      )}
    </div>
  );
}

function CruceCard({
  cruce,
  isGolden,
  simulandoIds,
  onSimular,
  onAvanzar,
  onLimpiar,
}: {
  cruce: BracketCruce | null;
  isGolden?: boolean;
  simulandoIds: Set<number>;
  onSimular: (id: number) => void;
  onAvanzar: (id: number, ganador: string) => void;
  onLimpiar: (id: number) => void;
}) {
  if (!cruce) {
    return (
      <div className={`${styles.cCard} ${styles.cCardEmpty}`}>
        <div className={styles.cTeam}><span className={styles.cEmpty}>Por definir</span></div>
        <div className={styles.cSep} />
        <div className={styles.cTeam}><span className={styles.cEmpty}>Por definir</span></div>
      </div>
    );
  }

  const hasResult = cruce.ganador !== null;
  const canSim = !hasResult && !!(cruce.equipo_a && cruce.equipo_b);
  const isSim = simulandoIds.has(cruce.id);

  return (
    <div className={`${styles.cCard} ${isGolden ? styles.cCardGolden : ""}`}>
      {hasResult && (
        <button className={styles.cBtnCambiar} onClick={() => onLimpiar(cruce.id)} title="Cambiar resultado">
          ✏️
        </button>
      )}
      <TeamRow
        codigo={cruce.equipo_a}
        isWinner={hasResult && cruce.ganador === cruce.equipo_a}
        isLoser={hasResult && cruce.ganador !== cruce.equipo_a}
        clickable={!hasResult && !!cruce.equipo_a && !!cruce.equipo_b}
        onClick={() => cruce.equipo_a && onAvanzar(cruce.id, cruce.equipo_a)}
      />
      <div className={styles.cSep}>
        {hasResult ? (
          <span className={styles.cScore}>
            {cruce.goles_a ?? "–"}–{cruce.goles_b ?? "–"}
            {cruce.fue_penales && <span className={styles.cScorePen}> pen</span>}
          </span>
        ) : null}
      </div>
      <TeamRow
        codigo={cruce.equipo_b}
        isWinner={hasResult && cruce.ganador === cruce.equipo_b}
        isLoser={hasResult && cruce.ganador !== cruce.equipo_b}
        clickable={!hasResult && !!cruce.equipo_a && !!cruce.equipo_b}
        onClick={() => cruce.equipo_b && onAvanzar(cruce.id, cruce.equipo_b)}
      />
      {canSim && (
        <div className={styles.cSimBar}>
          <button
            className={styles.cBtnSim}
            onClick={() => onSimular(cruce.id)}
            disabled={isSim}
          >
            {isSim ? "Simulando…" : "⚡ Simular"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Bracket canvas ───────────────────────────────────────────────────────────

function BracketCanvas({
  estado,
  simulandoIds,
  simulandoTodo,
  reiniciando,
  onSimular,
  onAvanzar,
  onLimpiar,
  onSimularTodo,
  onReiniciar,
}: {
  estado: BracketEstadoResponse;
  simulandoIds: Set<number>;
  simulandoTodo: boolean;
  reiniciando: boolean;
  onSimular: (id: number) => void;
  onAvanzar: (id: number, ganador: string) => void;
  onLimpiar: (id: number) => void;
  onSimularTodo: () => void;
  onReiniciar: () => void;
}) {
  const r = estado.rondas;
  const cruceFinal   = (r.final   ?? [])[0] ?? null;
  const cruceTercero = (r.tercero ?? [])[0] ?? null;
  const campeon = cruceFinal?.ganador ? CODE_TO_TEAM[cruceFinal.ganador] : null;

  const cardProps = { simulandoIds, onSimular, onAvanzar, onLimpiar };

  return (
    <div className={styles.bWrapper}>
      {/* Column headers */}
      <div className={styles.bScroll}>
        <div style={{ position: "relative", width: TOTAL_W, height: HEADER_H, marginBottom: 4 }}>
          {RONDA_LABELS.map((label, i) => (
            <div
              key={i}
              className={styles.bHeaderCell}
              style={{ position: "absolute", left: xLeft(i), width: COL_W }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ position: "relative", width: TOTAL_W, height: H }}>
          <ConnectorLines estado={estado} />

          {/* Rounds 0–3: R32, R16, QF, SF */}
          {([0, 1, 2, 3] as const).map((rIdx) => {
            const rondaName = RONDA_NAMES[rIdx];
            const cruces = [...(r[rondaName] ?? [])].sort((a, b) => a.posicion - b.posicion);
            return Array.from({ length: RONDA_COUNTS[rIdx] }, (_, i) => {
              const cruce = cruces.find((c) => c.posicion === i + 1) ?? null;
              return (
                <div
                  key={`${rIdx}-${i}`}
                  className={styles.cCardWrapper}
                  style={{
                    position: "absolute",
                    top: yCenter(rIdx, i) - CARD_H / 2,
                    left: xLeft(rIdx),
                    width: COL_W,
                  }}
                >
                  <CruceCard cruce={cruce} {...cardProps} />
                </div>
              );
            });
          })}

          {/* Final column */}
          <div
            className={styles.finalRondaLabel}
            style={{ position: "absolute", top: FINAL_TOP - 22, left: xLeft(4), width: COL_W }}
          >
            FINAL
          </div>
          <div
            className={styles.cCardWrapper}
            style={{ position: "absolute", top: FINAL_TOP, left: xLeft(4), width: COL_W }}
          >
            <CruceCard cruce={cruceFinal} isGolden {...cardProps} />
          </div>

          {campeon && (
            <div
              className={styles.champion}
              style={{ position: "absolute", top: FINAL_TOP + CARD_H + 18, left: xLeft(4), width: COL_W }}
            >
              <div className={styles.championTrophy}>🏆</div>
              <div className={styles.championName}>{campeon.bandera} {campeon.nombre}</div>
              <div className={styles.championSub}>Campeón Mundial 2026</div>
            </div>
          )}

          <div
            className={styles.terceroRondaLabel}
            style={{ position: "absolute", top: TERCERO_TOP - 22, left: xLeft(4), width: COL_W }}
          >
            3ER PUESTO
          </div>
          <div
            className={styles.cCardWrapper}
            style={{ position: "absolute", top: TERCERO_TOP, left: xLeft(4), width: COL_W }}
          >
            <CruceCard cruce={cruceTercero} {...cardProps} />
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className={styles.bActionBar}>
        <button
          className={styles.btnSimAll}
          onClick={onSimularTodo}
          disabled={simulandoTodo || reiniciando}
        >
          {simulandoTodo ? "Simulando…" : "⚡ Simular todo automáticamente"}
        </button>
        <button
          className={styles.btnReiniciar}
          onClick={onReiniciar}
          disabled={simulandoTodo || reiniciando}
        >
          {reiniciando ? "Reiniciando…" : "↺ Reiniciar bracket"}
        </button>
      </div>
    </div>
  );
}

// ─── BracketFromDB ────────────────────────────────────────────────────────────

function BracketFromDB() {
  const [estado, setEstado] = useState<BracketEstadoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulandoIds, setSimulandoIds] = useState<Set<number>>(new Set());
  const [simulandoTodo, setSimulandoTodo] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const [tiempo, setTiempo] = useState({ dias: 0, horas: 0, minutos: 0 });

  useEffect(() => {
    const TARGET = new Date("2026-06-28T00:00:00Z").getTime();
    function tick() {
      const diff = TARGET - Date.now();
      if (diff <= 0) { setTiempo({ dias: 0, horas: 0, minutos: 0 }); return; }
      setTiempo({
        dias: Math.floor(diff / 86400000),
        horas: Math.floor((diff % 86400000) / 3600000),
        minutos: Math.floor((diff % 3600000) / 60000),
      });
    }
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  async function fetchEstado() {
    try {
      const data = await getBracketEstado();
      setEstado(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEstado(); }, []);

  async function handleSimular(cruceId: number) {
    setSimulandoIds((prev) => new Set([...prev, cruceId]));
    try {
      await simularCruce(cruceId);
      await fetchEstado();
    } finally {
      setSimulandoIds((prev) => { const s = new Set(prev); s.delete(cruceId); return s; });
    }
  }

  async function handleAvanzar(cruceId: number, ganador: string) {
    setSimulandoIds((prev) => new Set([...prev, cruceId]));
    try {
      await avanzarCruce(cruceId, ganador);
      await fetchEstado();
    } finally {
      setSimulandoIds((prev) => { const s = new Set(prev); s.delete(cruceId); return s; });
    }
  }

  async function handleLimpiar(cruceId: number) {
    setSimulandoIds((prev) => new Set([...prev, cruceId]));
    try {
      await limpiarCruce(cruceId);
      await fetchEstado();
    } finally {
      setSimulandoIds((prev) => { const s = new Set(prev); s.delete(cruceId); return s; });
    }
  }

  async function handleSimularTodo() {
    setSimulandoTodo(true);
    try {
      for (let pass = 0; pass < 6; pass++) {
        const fresh = await getBracketEstado();
        setEstado(fresh);
        const pending = RONDA_NAMES.flatMap((ronda) =>
          (fresh.rondas[ronda] ?? []).filter((c) => c.equipo_a && c.equipo_b && !c.ganador)
        );
        if (pending.length === 0) break;
        for (const c of pending) {
          setSimulandoIds((prev) => new Set([...prev, c.id]));
          try { await simularCruce(c.id); }
          finally { setSimulandoIds((prev) => { const s = new Set(prev); s.delete(c.id); return s; }); }
        }
      }
    } finally {
      setSimulandoTodo(false);
      await fetchEstado();
    }
  }

  async function handleReiniciar() {
    setReiniciando(true);
    try {
      await reiniciarBracket();
      await fetchEstado();
    } finally {
      setReiniciando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.bWrapper} style={{ display: "flex", justifyContent: "center", padding: "60px 20px" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem" }}>Cargando bracket…</span>
      </div>
    );
  }

  if (!estado?.desbloqueado) {
    return (
      <div className={styles.bWrapper}>
        <div className={styles.lockedOverlay}>
          <div className={styles.lockedCard}>
            <div className={styles.lockedIcon}>🔒</div>
            <div className={styles.lockedTitle}>Bracket de Eliminatorias</div>
            <p className={styles.lockedMsg}>
              {estado?.mensaje_bloqueado ?? "El bracket se habilitará cuando los 32 clasificados a dieciseisavos estén definidos."}
            </p>
            <div className={styles.lockedCountdown}>
              <div className={styles.lockedCountdownLabel}>Disponible en</div>
              <div className={styles.lockedCountdownTime}>
                {tiempo.dias}d · {tiempo.horas}h · {tiempo.minutos}m
              </div>
            </div>
            <p className={styles.lockedFootnote}>Los 32 clasificados se definirán al término de la fase de grupos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BracketCanvas
      estado={estado}
      simulandoIds={simulandoIds}
      simulandoTodo={simulandoTodo}
      reiniciando={reiniciando}
      onSimular={handleSimular}
      onAvanzar={handleAvanzar}
      onLimpiar={handleLimpiar}
      onSimularTodo={handleSimularTodo}
      onReiniciar={handleReiniciar}
    />
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function TorneoSection() {
  const [apiGrupos, setApiGrupos] = useState<GrupoFixtureT[]>([]);

  useEffect(() => {
    getTorneoFixture().then((f) => setApiGrupos(f.grupos)).catch(() => {});
  }, []);

  return (
    <div>
      <EscenariosSection grupos={apiGrupos} />
      <div className={styles.simuladorDivider}>
        <div className="container">
          <span className={styles.simuladorDividerTitle}>ELIMINATORIAS MUNDIAL 2026</span>
        </div>
      </div>
      <BracketFromDB />
    </div>
  );
}
