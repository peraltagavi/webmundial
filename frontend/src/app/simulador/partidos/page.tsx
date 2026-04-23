"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSelecciones, getProbabilidades, simularPorCodigo } from "@/lib/api";
import type {
  Seleccion,
  ProbabilidadesResponse,
  SimularResponse,
  UltimoPartidoEquipo,
} from "@/lib/types";
import styles from "./page.module.css";

function matchDesc(
  ga: number,
  gb: number,
  nameA: string,
  nameB: string
): string {
  const total = ga + gb;
  const diff = Math.abs(ga - gb);
  const winner = ga > gb ? nameA : nameB;
  if (total === 0) return "Un partido de cero a cero. Defensas impenetrables.";
  if (ga === gb && total <= 2) return "Empate parejo. Los dos equipos se neutralizaron.";
  if (ga === gb) return `Empate vibrante con ${total} goles en el marcador.`;
  if (diff >= 4) return `Demolición total. ${winner} no tuvo piedad esta noche.`;
  if (diff >= 3) return `Goleada contundente de ${winner}. Sin discusión posible.`;
  if (total >= 6) return "¡Festival de goles! Un partido histórico en el marcador.";
  if (total === 1) return `Un gol solitario de ${winner}. Partido extremadamente cerrado.`;
  if (diff === 1) return "Partido intenso, definido por el mínimo margen.";
  return `Victoria clara de ${winner}. Se impuso con autoridad.`;
}

type Counter = { a: number; e: number; b: number; n: number };

function FormPills({ partidos }: { partidos: UltimoPartidoEquipo[] }) {
  if (partidos.length === 0)
    return <span className={styles.formEmpty}>Sin datos históricos</span>;
  return (
    <>
      {partidos.map((p, i) => (
        <div
          key={i}
          className={`${styles.pill} ${
            p.resultado === "G"
              ? styles.pillG
              : p.resultado === "E"
              ? styles.pillE
              : p.resultado === "P"
              ? styles.pillP
              : styles.pillN
          }`}
          title={`vs ${p.rival}  ${p.goles_favor ?? "?"}–${p.goles_contra ?? "?"}${p.fecha ? `  (${p.fecha})` : ""}`}
        >
          {p.resultado === "?" ? "–" : p.resultado}
        </div>
      ))}
    </>
  );
}

export default function PartidosPage() {
  const [selecciones, setSelecciones] = useState<Seleccion[]>([]);
  const [codigoA, setCodigoA] = useState("");
  const [codigoB, setCodigoB] = useState("");
  const [data, setData] = useState<ProbabilidadesResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  const [simulating, setSimulating] = useState(false);
  const [dispA, setDispA] = useState<number | null>(null);
  const [dispB, setDispB] = useState<number | null>(null);
  const [fixed, setFixed] = useState(false);
  const [result, setResult] = useState<SimularResponse | null>(null);
  const [counter, setCounter] = useState<Counter>({ a: 0, e: 0, b: 0, n: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getSelecciones().then(setSelecciones).catch(() => {});
  }, []);

  useEffect(() => {
    if (!codigoA || !codigoB || codigoA === codigoB) {
      setData(null);
      setBarsReady(false);
      setResult(null);
      setDispA(null);
      setDispB(null);
      setFixed(false);
      return;
    }
    setLoadingData(true);
    setBarsReady(false);
    setResult(null);
    setDispA(null);
    setDispB(null);
    setFixed(false);
    getProbabilidades(codigoA, codigoB)
      .then((d) => {
        setData(d);
        setLoadingData(false);
        requestAnimationFrame(() => setBarsReady(true));
      })
      .catch(() => setLoadingData(false));
  }, [codigoA, codigoB]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  async function simular() {
    if (!codigoA || !codigoB || simulating) return;
    setSimulating(true);
    setFixed(false);
    setResult(null);
    setDispA(Math.floor(Math.random() * 5));
    setDispB(Math.floor(Math.random() * 5));

    try {
      const res = await simularPorCodigo(codigoA, codigoB);
      if (timerRef.current) clearInterval(timerRef.current);
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 80;
        setDispA(Math.floor(Math.random() * 6));
        setDispB(Math.floor(Math.random() * 6));
        if (elapsed >= 1200) {
          clearInterval(timerRef.current!);
          setDispA(res.goles_a);
          setDispB(res.goles_b);
          setFixed(true);
          setResult(res);
          setCounter((prev) => ({
            a: prev.a + (res.ganador === "a" ? 1 : 0),
            e: prev.e + (res.ganador === "empate" ? 1 : 0),
            b: prev.b + (res.ganador === "b" ? 1 : 0),
            n: prev.n + 1,
          }));
          setSimulating(false);
        }
      }, 80);
    } catch {
      setSimulating(false);
    }
  }

  const teamA = selecciones.find((s) => s.codigo_fifa === codigoA);
  const teamB = selecciones.find((s) => s.codigo_fifa === codigoB);
  const bothSelected = !!(codigoA && codigoB && codigoA !== codigoB);

  return (
    <div className={styles.page}>
      {/* ══════════════════════════════════════════════
          BLOQUE 1 — EL ENFRENTAMIENTO
          ══════════════════════════════════════════════ */}
      <section className={styles.blockMatch}>
        <div className="container">
          <div className={styles.pageHeader}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Inicio</Link>
              <span aria-hidden>›</span>
              <Link href="/simulador">Simulador</Link>
              <span aria-hidden>›</span>
              <span>Partidos</span>
            </nav>
            <h1 className={styles.pageTitle}>Simulador de Partidos</h1>
            <p className={styles.pageSubtitle}>
              Probabilidades basadas en historial, ranking FIFA y rendimiento en Mundiales
            </p>
          </div>

          {/* Selectors */}
          <div className={styles.selectorRow}>
            {/* Equipo A */}
            <div className={styles.selectorCard}>
              <div className={`${styles.selectorLabel} ${styles.selectorLabelA}`}>
                Equipo A
              </div>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectDark}
                  value={codigoA}
                  onChange={(e) => setCodigoA(e.target.value)}
                  aria-label="Seleccionar equipo A"
                >
                  <option value="">Seleccionar equipo…</option>
                  {selecciones.map((s) => (
                    <option
                      key={s.id}
                      value={s.codigo_fifa}
                      disabled={s.codigo_fifa === codigoB}
                    >
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden>▼</span>
              </div>
              <div className={styles.teamPreview}>
                {teamA ? (
                  <>
                    <div className={`${styles.teamChip} ${styles.teamChipA}`}>
                      {teamA.codigo_fifa}
                    </div>
                    <div className={styles.teamPreviewInfo}>
                      <div className={styles.teamPreviewName}>{teamA.nombre}</div>
                      <div className={styles.teamPreviewRank}>
                        {teamA.ranking_fifa ? `#${teamA.ranking_fifa} FIFA` : "Sin ranking"}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className={styles.teamPreviewEmpty}>
                    Ningún equipo seleccionado
                  </span>
                )}
              </div>
            </div>

            {/* VS center */}
            <div className={styles.vsCenter} aria-hidden>
              <div className={`${styles.teamCodeLarge} ${styles.teamCodeLargeA}`}>
                {teamA ? teamA.codigo_fifa : "—"}
              </div>
              <div className={styles.vsLabel}>VS</div>
              <div className={`${styles.teamCodeLarge} ${styles.teamCodeLargeB}`}>
                {teamB ? teamB.codigo_fifa : "—"}
              </div>
            </div>

            {/* Equipo B */}
            <div className={styles.selectorCard}>
              <div className={`${styles.selectorLabel} ${styles.selectorLabelB}`}>
                Equipo B
              </div>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectDark}
                  value={codigoB}
                  onChange={(e) => setCodigoB(e.target.value)}
                  aria-label="Seleccionar equipo B"
                >
                  <option value="">Seleccionar equipo…</option>
                  {selecciones.map((s) => (
                    <option
                      key={s.id}
                      value={s.codigo_fifa}
                      disabled={s.codigo_fifa === codigoA}
                    >
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden>▼</span>
              </div>
              <div className={styles.teamPreview}>
                {teamB ? (
                  <>
                    <div className={`${styles.teamChip} ${styles.teamChipB}`}>
                      {teamB.codigo_fifa}
                    </div>
                    <div className={styles.teamPreviewInfo}>
                      <div className={styles.teamPreviewName}>{teamB.nombre}</div>
                      <div className={styles.teamPreviewRank}>
                        {teamB.ranking_fifa ? `#${teamB.ranking_fifa} FIFA` : "Sin ranking"}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className={styles.teamPreviewEmpty}>
                    Ningún equipo seleccionado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Probability bars */}
          {loadingData && (
            <div className={styles.probLoading}>
              <div className={styles.probSpinner} />
              <span>Calculando probabilidades…</span>
            </div>
          )}

          {data && !loadingData && (
            <div className={styles.probSection}>
              <div className={styles.probSectionTitle}>
                Probabilidades de resultado
              </div>
              <div className={styles.probBars}>
                {(
                  [
                    {
                      label: data.equipo_a.nombre,
                      pct: data.prob_a,
                      fillClass: styles.probFillA,
                    },
                    {
                      label: "Empate",
                      pct: data.prob_empate,
                      fillClass: styles.probFillE,
                    },
                    {
                      label: data.equipo_b.nombre,
                      pct: data.prob_b,
                      fillClass: styles.probFillB,
                    },
                  ] as const
                ).map(({ label, pct, fillClass }) => (
                  <div key={label} className={styles.probBar}>
                    <div className={styles.probBarHeader}>
                      <span className={styles.probTeamName}>{label}</span>
                      <span className={styles.probPct}>{pct}%</span>
                    </div>
                    <div className={styles.probTrack}>
                      <div
                        className={`${styles.probFill} ${fillClass}`}
                        style={{ width: barsReady ? `${pct}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {data.total_h2h > 0 && (
                <p className={styles.h2hNote}>
                  Incluye {data.total_h2h} enfrentamiento
                  {data.total_h2h > 1 ? "s" : ""} directo
                  {data.total_h2h > 1 ? "s" : ""} en Mundiales FIFA
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BLOQUE 2 — ANÁLISIS COMPARATIVO
          ══════════════════════════════════════════════ */}
      {data && (
        <section className={styles.blockAnalysis}>
          <div className="container">
            <div className={styles.sectionTitle}>Análisis comparativo</div>

            {/* Rank + form cards */}
            <div className={styles.rankGrid}>
              {(
                [
                  { team: data.equipo_a, cardClass: styles.rankCardA, labelClass: styles.rankTeamLabelA, numClass: styles.rankNumA },
                  { team: data.equipo_b, cardClass: styles.rankCardB, labelClass: styles.rankTeamLabelB, numClass: styles.rankNumB },
                ] as const
              ).map(({ team, cardClass, labelClass, numClass }) => (
                <div key={team.codigo_fifa} className={`${styles.rankCard} ${cardClass}`}>
                  <div className={`${styles.rankTeamLabel} ${labelClass}`}>
                    {team.codigo_fifa}
                  </div>
                  <div className={styles.rankTeamName}>{team.nombre}</div>
                  <div className={`${styles.rankNum} ${numClass}`}>
                    {team.ranking_fifa ? `#${team.ranking_fifa}` : "N/R"}
                  </div>
                  {team.puntos_fifa != null && (
                    <div className={styles.rankPoints}>
                      {Math.round(team.puntos_fifa)} pts FIFA
                    </div>
                  )}
                  <div className={styles.formRow}>
                    <span className={styles.formLabel}>Forma</span>
                    <FormPills partidos={team.ultimos_5} />
                  </div>
                </div>
              ))}
            </div>

            {/* 3 comparative metrics */}
            <div className={styles.metricsGrid}>
              {(
                [
                  {
                    label: "Goles promedio / partido",
                    valA: data.equipo_a.goles_promedio.toFixed(2),
                    valB: data.equipo_b.goles_promedio.toFixed(2),
                    numA: data.equipo_a.goles_promedio,
                    numB: data.equipo_b.goles_promedio,
                  },
                  {
                    label: "Porterías en cero",
                    valA: `${data.equipo_a.porcentaje_porteria_cero}%`,
                    valB: `${data.equipo_b.porcentaje_porteria_cero}%`,
                    numA: data.equipo_a.porcentaje_porteria_cero,
                    numB: data.equipo_b.porcentaje_porteria_cero,
                  },
                  {
                    label: "Mundiales disputados",
                    valA: String(data.equipo_a.mundiales_disputados),
                    valB: String(data.equipo_b.mundiales_disputados),
                    numA: data.equipo_a.mundiales_disputados,
                    numB: data.equipo_b.mundiales_disputados,
                  },
                ] as const
              ).map(({ label, valA, valB, numA, numB }) => {
                const aLeads = numA > numB;
                const bLeads = numB > numA;
                return (
                  <div key={label} className={styles.metricCard}>
                    <div className={styles.metricLabel}>{label}</div>
                    <div className={styles.metricValues}>
                      <span
                        className={`${styles.metricVal} ${styles.metricValA} ${bLeads ? styles.metricDim : ""}`}
                      >
                        {valA}
                      </span>
                      <span className={styles.metricVs}>vs</span>
                      <span
                        className={`${styles.metricVal} ${styles.metricValB} ${aLeads ? styles.metricDim : ""}`}
                      >
                        {valB}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          BLOQUE 3 — EL SIMULADOR
          ══════════════════════════════════════════════ */}
      {bothSelected && (
        <section className={styles.blockSim}>
          <div className="container">
            <div className={styles.simContent}>
              <div className={styles.simTitle}>El Simulador</div>

              <button
                className={styles.btnSimular}
                onClick={simular}
                disabled={simulating || !data}
              >
                {simulating ? "Simulando…" : "Simular Partido"}
              </button>

              {dispA !== null && dispB !== null && (
                <div className={styles.scoreboard}>
                  <div className={styles.scoreTeam}>
                    <span className={styles.scoreTeamName}>
                      {teamA?.nombre ?? codigoA}
                    </span>
                  </div>
                  <div className={styles.scoreNums}>
                    <span
                      className={`${styles.scoreDigit} ${
                        fixed ? styles.scoreDigitA : styles.scoreDigitRolling
                      }`}
                    >
                      {dispA}
                    </span>
                    <span className={styles.scoreSep}>–</span>
                    <span
                      className={`${styles.scoreDigit} ${
                        fixed ? styles.scoreDigitB : styles.scoreDigitRolling
                      }`}
                    >
                      {dispB}
                    </span>
                  </div>
                  <div className={styles.scoreTeam}>
                    <span
                      className={`${styles.scoreTeamName} ${styles.scoreTeamNameB}`}
                    >
                      {teamB?.nombre ?? codigoB}
                    </span>
                  </div>
                </div>
              )}

              {result && fixed && data && (
                <>
                  <p className={styles.matchDesc}>
                    {matchDesc(
                      result.goles_a,
                      result.goles_b,
                      data.equipo_a.nombre,
                      data.equipo_b.nombre
                    )}
                  </p>

                  <button className={styles.btnSimAgain} onClick={simular}>
                    Simular de nuevo ↺
                  </button>

                  {counter.n > 0 && (
                    <div className={styles.counter}>
                      En <strong>{counter.n}</strong> simulación
                      {counter.n > 1 ? "es" : ""}:{" "}
                      <span className={styles.counterA}>
                        {data.equipo_a.nombre} ganó {counter.a}
                      </span>
                      {" · "}Empató {counter.e}{" · "}
                      <span className={styles.counterB}>
                        {data.equipo_b.nombre} ganó {counter.b}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
