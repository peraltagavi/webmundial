"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { getSelecciones, getComparador } from "@/lib/api";
import type { Seleccion, ComparadorResponse, PartidoResumen } from "@/lib/types";
import styles from "./page.module.css";

function formatFecha(fecha: string | null): string {
  if (!fecha) return "–";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

function formatGoles(val: number | null): string {
  return val === null ? "–" : String(val);
}

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function MatchRow({ p }: { p: PartidoResumen }) {
  return (
    <div className={styles.matchItem}>
      <div>
        <div className={styles.matchDate}>{formatFecha(p.fecha)}</div>
        <div className={styles.matchTorneo}>{p.torneo}</div>
      </div>
      <div className={`${styles.matchTeamName} ${styles.matchTeamHome}`}>
        {p.equipo_local}
      </div>
      <div className={styles.matchScore}>
        <span className={styles.matchScoreNum}>{formatGoles(p.goles_local)}</span>
        <span className={styles.matchScoreSep}>–</span>
        <span className={styles.matchScoreNum}>{formatGoles(p.goles_visitante)}</span>
        {p.penales_local !== null && p.penales_visitante !== null && (
          <span className={styles.matchScorePen}>
            ({p.penales_local} – {p.penales_visitante} pen)
          </span>
        )}
      </div>
      <div className={styles.matchTeamName}>{p.equipo_visitante}</div>
      <div className={styles.matchRound}>{p.ronda ?? ""}</div>
    </div>
  );
}

export default function ComparadorPage() {
  const [selecciones, setSelecciones] = useState<Seleccion[]>([]);
  const [codigoA, setCodigoA] = useState("");
  const [codigoB, setCodigoB] = useState("");
  const [data, setData] = useState<ComparadorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSelecciones().then(setSelecciones).catch(() => {});
  }, []);

  useEffect(() => {
    if (!codigoA || !codigoB || codigoA === codigoB) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    getComparador(codigoA, codigoB)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [codigoA, codigoB]);

  const teamA = selecciones.find((s) => s.codigo_fifa === codigoA);
  const teamB = selecciones.find((s) => s.codigo_fifa === codigoB);

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (!data) { setAnimated(false); return; }
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  const totalWins = data ? data.head_to_head.victorias_a + data.head_to_head.victorias_b : 0;
  const pctA = data ? pct(data.head_to_head.victorias_a, totalWins) : 0;
  const pctB = data ? pct(data.head_to_head.victorias_b, totalWins) : 0;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Inicio</Link>
            <span aria-hidden>›</span>
            <Link href="/simulador">Simulador</Link>
            <span aria-hidden>›</span>
            <span>Comparador</span>
          </nav>
          <h1 className={styles.pageTitle}>Comparador Histórico</h1>
          <p className={styles.pageSubtitle}>
            Estadísticas históricas en Mundiales FIFA — enfrentamientos, rendimiento y mejores resultados
          </p>
        </div>

        {/* Team selectors */}
        <div className={styles.selectorRow}>
          {/* Equipo A */}
          <div className={styles.selectorCard}>
            <div className={`${styles.selectorLabel} ${styles.selectorLabelA}`}>Equipo A</div>
            <div className={styles.selectWrapper}>
              <select
                className={`${styles.select} ${codigoA ? styles.selectActive : ""}`}
                value={codigoA}
                onChange={(e) => setCodigoA(e.target.value)}
                aria-label="Seleccionar equipo A"
              >
                <option value="">Seleccionar equipo…</option>
                {selecciones.map((s) => (
                  <option key={s.id} value={s.codigo_fifa} disabled={s.codigo_fifa === codigoB}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <span className={styles.selectArrow} aria-hidden>▼</span>
            </div>
            <div className={styles.selectedTeamPreview}>
              {teamA ? (
                <>
                  <div className={`${styles.teamCodeBadge} ${styles.teamCodeBadgeA}`}>
                    {teamA.codigo_fifa}
                  </div>
                  <div className={styles.teamPreviewInfo}>
                    <div className={styles.teamPreviewName}>{teamA.nombre}</div>
                    <div className={styles.teamPreviewRanking}>
                      {teamA.ranking_fifa ? `Ranking FIFA: #${teamA.ranking_fifa}` : "Sin ranking FIFA"}
                    </div>
                  </div>
                </>
              ) : (
                <span style={{ color: "var(--color-gray-400)", fontSize: "var(--text-sm)" }}>
                  Ningún equipo seleccionado
                </span>
              )}
            </div>
          </div>

          {/* VS badge */}
          <div className={styles.vsBadge} aria-hidden>VS</div>

          {/* Equipo B */}
          <div className={styles.selectorCard}>
            <div className={`${styles.selectorLabel} ${styles.selectorLabelB}`}>Equipo B</div>
            <div className={styles.selectWrapper}>
              <select
                className={`${styles.select} ${codigoB ? styles.selectActive : ""}`}
                value={codigoB}
                onChange={(e) => setCodigoB(e.target.value)}
                aria-label="Seleccionar equipo B"
              >
                <option value="">Seleccionar equipo…</option>
                {selecciones.map((s) => (
                  <option key={s.id} value={s.codigo_fifa} disabled={s.codigo_fifa === codigoA}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <span className={styles.selectArrow} aria-hidden>▼</span>
            </div>
            <div className={styles.selectedTeamPreview}>
              {teamB ? (
                <>
                  <div className={`${styles.teamCodeBadge} ${styles.teamCodeBadgeB}`}>
                    {teamB.codigo_fifa}
                  </div>
                  <div className={styles.teamPreviewInfo}>
                    <div className={styles.teamPreviewName}>{teamB.nombre}</div>
                    <div className={styles.teamPreviewRanking}>
                      {teamB.ranking_fifa ? `Ranking FIFA: #${teamB.ranking_fifa}` : "Sin ranking FIFA"}
                    </div>
                  </div>
                </>
              ) : (
                <span style={{ color: "var(--color-gray-400)", fontSize: "var(--text-sm)" }}>
                  Ningún equipo seleccionado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Results area */}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} aria-hidden />
            Cargando estadísticas…
          </div>
        )}

        {error && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>⚠️</div>
            <div className={styles.placeholderText}>Error al cargar datos</div>
            <div className={styles.placeholderSub}>{error}</div>
          </div>
        )}

        {!loading && !error && !data && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>⚽</div>
            <div className={styles.placeholderText}>Selecciona dos selecciones</div>
            <div className={styles.placeholderSub}>
              Elige los dos equipos para ver sus estadísticas históricas en Mundiales FIFA
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className={styles.results}>

            {/* H2H card */}
            <div className={styles.h2hCard}>
              <div className={styles.sectionTitle}>Enfrentamientos directos en Mundiales</div>
              <div className={styles.h2hTeams}>
                <div className={`${styles.h2hTeam} ${styles.h2hTeamA}`}>
                  <span className={`${styles.h2hTeamCode} ${styles.h2hTeamCodeA}`}>
                    {data.equipo_a.codigo_fifa}
                  </span>
                  <span className={styles.h2hTeamName}>{data.equipo_a.nombre}</span>
                  {data.equipo_a.ranking_fifa && (
                    <span className={styles.h2hTeamRanking}>#{data.equipo_a.ranking_fifa} FIFA</span>
                  )}
                </div>
                <div className={styles.h2hScoreBox}>
                  <span className={styles.h2hTotalLabel}>Partidos jugados</span>
                  <span className={styles.h2hTotalNum}>{data.head_to_head.total}</span>
                  <span className={styles.h2hTotalSub}>en Mundiales FIFA</span>
                </div>
                <div className={`${styles.h2hTeam} ${styles.h2hTeamB}`}>
                  <span className={`${styles.h2hTeamCode} ${styles.h2hTeamCodeB}`}>
                    {data.equipo_b.codigo_fifa}
                  </span>
                  <span className={styles.h2hTeamName}>{data.equipo_b.nombre}</span>
                  {data.equipo_b.ranking_fifa && (
                    <span className={styles.h2hTeamRanking}>#{data.equipo_b.ranking_fifa} FIFA</span>
                  )}
                </div>
              </div>

              {data.head_to_head.total > 0 ? (
                <>
                  <div className={styles.domBar}>
                    <div className={styles.domBarTrack}>
                      <div
                        className={styles.domBarFillA}
                        style={{ width: `${pctA}%` }}
                        aria-label={`${data.equipo_a.nombre}: ${pctA}% victorias`}
                      />
                    </div>
                    <div className={styles.domBarCenter}>
                      {data.head_to_head.victorias_a} – {data.head_to_head.empates} – {data.head_to_head.victorias_b}
                    </div>
                    <div className={styles.domBarTrack}>
                      <div
                        className={styles.domBarFillB}
                        style={{ width: `${pctB}%` }}
                        aria-label={`${data.equipo_b.nombre}: ${pctB}% victorias`}
                      />
                    </div>
                  </div>

                  <div className={styles.h2hStatsRow}>
                    <div className={styles.h2hStat}>
                      <span className={`${styles.h2hStatVal} ${styles.h2hStatValA}`}>
                        {data.head_to_head.victorias_a}
                      </span>
                      <span className={styles.h2hStatLbl}>Wins A</span>
                    </div>
                    <div className={styles.h2hStat}>
                      <span className={styles.h2hStatVal}>{data.head_to_head.empates}</span>
                      <span className={styles.h2hStatLbl}>Empates</span>
                    </div>
                    <div className={styles.h2hStat}>
                      <span className={`${styles.h2hStatVal} ${styles.h2hStatValB}`}>
                        {data.head_to_head.victorias_b}
                      </span>
                      <span className={styles.h2hStatLbl}>Wins B</span>
                    </div>
                    <div className={styles.h2hStat}>
                      <span className={`${styles.h2hStatVal} ${styles.h2hStatValA}`}>
                        {data.head_to_head.goles_a}
                      </span>
                      <span className={styles.h2hStatLbl}>Goles A</span>
                    </div>
                    <div className={styles.h2hStat}>
                      <span className={`${styles.h2hStatVal} ${styles.h2hStatValB}`}>
                        {data.head_to_head.goles_b}
                      </span>
                      <span className={styles.h2hStatLbl}>Goles B</span>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ textAlign: "center", color: "var(--color-gray-400)", fontSize: "var(--text-sm)", padding: "var(--space-4) 0" }}>
                  Estos dos equipos nunca se han enfrentado en un Mundial FIFA
                </p>
              )}
            </div>

            {/* Comparison table */}
            <div className={styles.compCard}>
              <div style={{ padding: "var(--space-6) var(--space-6) 0" }}>
                <div className={styles.sectionTitle}>Rendimiento general en Mundiales</div>
              </div>
              <table className={styles.compTable}>
                <thead className={styles.compTableHead}>
                  <tr>
                    <th className={styles.compHeaderA}>{data.equipo_a.nombre}</th>
                    <th className={styles.compHeaderLabel}>Estadística</th>
                    <th className={styles.compHeaderB}>{data.equipo_b.nombre}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Partidos jugados",
                      a: data.rendimiento_a.partidos,
                      b: data.rendimiento_b.partidos,
                    },
                    {
                      label: "Victorias",
                      a: data.rendimiento_a.ganados,
                      b: data.rendimiento_b.ganados,
                    },
                    {
                      label: "Empates",
                      a: data.rendimiento_a.empatados,
                      b: data.rendimiento_b.empatados,
                    },
                    {
                      label: "Derrotas",
                      a: data.rendimiento_a.perdidos,
                      b: data.rendimiento_b.perdidos,
                      invertWin: true,
                    },
                    {
                      label: "Goles a favor",
                      a: data.rendimiento_a.goles_favor,
                      b: data.rendimiento_b.goles_favor,
                    },
                    {
                      label: "Goles en contra",
                      a: data.rendimiento_a.goles_contra,
                      b: data.rendimiento_b.goles_contra,
                      invertWin: true,
                    },
                    {
                      label: "Dif. goles",
                      a: data.rendimiento_a.diferencia_goles,
                      b: data.rendimiento_b.diferencia_goles,
                    },
                    {
                      label: "% victorias",
                      a: `${data.rendimiento_a.porcentaje_victorias}%`,
                      b: `${data.rendimiento_b.porcentaje_victorias}%`,
                      numA: data.rendimiento_a.porcentaje_victorias,
                      numB: data.rendimiento_b.porcentaje_victorias,
                    },
                    {
                      label: "Mundiales disputados",
                      a: data.rendimiento_a.mundiales_disputados,
                      b: data.rendimiento_b.mundiales_disputados,
                    },
                  ].map((row, i) => {
                    const numA = row.numA ?? (typeof row.a === "number" ? row.a : 0);
                    const numB = row.numB ?? (typeof row.b === "number" ? row.b : 0);
                    const aWins = row.invertWin ? numA < numB : numA > numB;
                    const bWins = row.invertWin ? numB < numA : numB > numA;
                    // Clamp to 0 for bar (diferencia_goles can be negative)
                    const posA = Math.max(numA, 0);
                    const posB = Math.max(numB, 0);
                    const barTotal = posA + posB;
                    const barA = barTotal > 0 ? (posA / barTotal) * 100 : 0;
                    const barB = barTotal > 0 ? (posB / barTotal) * 100 : 0;
                    const delay = `${i * 0.07}s`;
                    const even = i % 2 === 0;
                    return (
                      <Fragment key={row.label}>
                        <tr className={`${styles.compRow} ${even ? styles.compRowEven : ""}`}>
                          <td className={`${styles.compCellA} ${bWins ? styles.compCellLose : ""}`}>
                            {row.a}
                          </td>
                          <td className={styles.compCellLabel}>{row.label}</td>
                          <td className={`${styles.compCellB} ${aWins ? styles.compCellLose : ""}`}>
                            {row.b}
                          </td>
                        </tr>
                        <tr className={`${styles.compBarRow} ${even ? styles.compRowEven : ""}`}>
                          <td colSpan={3} className={styles.compBarCell}>
                            <div className={styles.compBarTrack}>
                              <div
                                className={styles.compBarA}
                                style={{ width: animated ? `${barA}%` : "0%", transitionDelay: delay }}
                              />
                              <div
                                className={styles.compBarB}
                                style={{ width: animated ? `${barB}%` : "0%", transitionDelay: delay }}
                              />
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Last 5 matches */}
            {data.ultimos_5.length > 0 && (
              <div>
                <div className={styles.sectionTitle}>
                  Últimos {data.ultimos_5.length} enfrentamientos directos
                </div>
                <div className={styles.matchList}>
                  {data.ultimos_5.map((p, i) => (
                    <MatchRow key={i} p={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Best historical result */}
            <div>
              <div className={styles.sectionTitle}>Mejor resultado histórico en Mundiales</div>
              <div className={styles.mejorGrid}>
                <div className={`${styles.mejorCard} ${styles.mejorCardA}`}>
                  <div className={styles.mejorTeamName}>{data.equipo_a.nombre}</div>
                  <div className={styles.mejorLabel}>{data.mejor_resultado_a.label}</div>
                  <div className={styles.mejorTorneos}>
                    {data.mejor_resultado_a.torneos.map((t) => (
                      <div key={t} className={`${styles.mejorTorneo} ${styles.mejorTorneoA}`}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${styles.mejorCard} ${styles.mejorCardB}`}>
                  <div className={styles.mejorTeamName}>{data.equipo_b.nombre}</div>
                  <div className={styles.mejorLabel}>{data.mejor_resultado_b.label}</div>
                  <div className={styles.mejorTorneos}>
                    {data.mejor_resultado_b.torneos.map((t) => (
                      <div key={t} className={`${styles.mejorTorneo} ${styles.mejorTorneoB}`}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            {codigoA && codigoB && (
              <div className={styles.cta}>
                <div className={styles.ctaText}>
                  <h3>¿Quién ganaría hoy?</h3>
                  <p>
                    Simula un partido entre {data.equipo_a.nombre} y {data.equipo_b.nombre} con el motor de probabilidades
                  </p>
                </div>
                <Link
                  href={`/simulador?local=${codigoA}&visitante=${codigoB}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-3) var(--space-6)",
                    background: "var(--color-red)",
                    color: "var(--color-white)",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 700,
                    fontSize: "var(--text-sm)",
                    letterSpacing: "0.02em",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Simular partido →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
