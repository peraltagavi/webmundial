"use client";

import { useState, useEffect, Fragment } from "react";
import { getSelecciones, getComparador } from "@/lib/api";
import type { Seleccion, ComparadorResponse, PartidoResumen } from "@/lib/types";
import styles from "./ComparadorSection.module.css";

function formatFecha(fecha: string | null): string {
  if (!fecha) return "–";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function MatchCard({ p }: { p: PartidoResumen }) {
  const hasResult = p.goles_local !== null && p.goles_visitante !== null;
  const localWins = hasResult && p.goles_local! > p.goles_visitante!;
  const visitanteWins = hasResult && p.goles_visitante! > p.goles_local!;

  return (
    <div className={styles.matchCard}>
      <div className={styles.matchCardMeta}>
        <span className={styles.matchCardDate}>{formatFecha(p.fecha)}</span>
        <span className={styles.matchCardTorneo}>{p.torneo}</span>
        {p.ronda && <span className={styles.matchCardRonda}>{p.ronda}</span>}
      </div>
      <div className={styles.matchCardTeams}>
        <div className={`${styles.matchCardTeam} ${styles.matchCardTeamHome} ${localWins ? styles.matchTeamWinner : visitanteWins ? styles.matchTeamLoser : ""}`}>
          {p.equipo_local}
        </div>
        <div className={styles.matchCardScore}>
          <span className={`${styles.matchCardScoreNum} ${localWins ? styles.matchScoreWin : visitanteWins ? styles.matchScoreLose : ""}`}>
            {p.goles_local ?? "–"}
          </span>
          <span className={styles.matchCardScoreSep}>–</span>
          <span className={`${styles.matchCardScoreNum} ${visitanteWins ? styles.matchScoreWin : localWins ? styles.matchScoreLose : ""}`}>
            {p.goles_visitante ?? "–"}
          </span>
          {p.penales_local !== null && p.penales_visitante !== null && (
            <span className={styles.matchCardPen}>
              ({p.penales_local}–{p.penales_visitante} pen)
            </span>
          )}
        </div>
        <div className={`${styles.matchCardTeam} ${visitanteWins ? styles.matchTeamWinner : localWins ? styles.matchTeamLoser : ""}`}>
          {p.equipo_visitante}
        </div>
      </div>
    </div>
  );
}

interface Props {
  onSimularPartido?: (codigoA: string, codigoB: string) => void;
}

interface Stat {
  key: string;
  label: string;
  getA: (r: ComparadorResponse) => number;
  getB: (r: ComparadorResponse) => number;
  invertWin?: boolean;
}

const STATS: Stat[] = [
  { key: "partidos",  label: "Partidos jugados",    getA: (r) => r.rendimiento_a.partidos,             getB: (r) => r.rendimiento_b.partidos },
  { key: "victorias", label: "Victorias",           getA: (r) => r.rendimiento_a.ganados,              getB: (r) => r.rendimiento_b.ganados },
  { key: "derrotas",  label: "Derrotas",            getA: (r) => r.rendimiento_a.perdidos,             getB: (r) => r.rendimiento_b.perdidos,    invertWin: true },
  { key: "empates",   label: "Empates",             getA: (r) => r.rendimiento_a.empatados,            getB: (r) => r.rendimiento_b.empatados },
  { key: "dif_goles", label: "Dif. de goles",       getA: (r) => r.rendimiento_a.diferencia_goles,     getB: (r) => r.rendimiento_b.diferencia_goles },
  { key: "mundiales", label: "Mundiales disputados",getA: (r) => r.rendimiento_a.mundiales_disputados, getB: (r) => r.rendimiento_b.mundiales_disputados },
];

const GRUPOS_ORDEN = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

export default function ComparadorSection({ onSimularPartido }: Props) {
  const [selecciones, setSelecciones] = useState<Seleccion[]>([]);
  const [codigoA, setCodigoA] = useState("");
  const [codigoB, setCodigoB] = useState("");
  const [data, setData] = useState<ComparadorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    getSelecciones().then(setSelecciones).catch(() => {});
  }, []);

  useEffect(() => {
    if (!codigoA || !codigoB || codigoA === codigoB) {
      setData(null);
      return;
    }
    setLoading(true);
    setAnimated(false);
    getComparador(codigoA, codigoB)
      .then((d) => {
        setData(d);
        setLoading(false);
        requestAnimationFrame(() => setAnimated(true));
      })
      .catch(() => setLoading(false));
  }, [codigoA, codigoB]);

  const teamA = selecciones.find((s) => s.codigo_fifa === codigoA);
  const teamB = selecciones.find((s) => s.codigo_fifa === codigoB);

  const canSimulate = !!(codigoA && codigoB);

  function handleSimular() {
    if (canSimulate && onSimularPartido) {
      onSimularPartido(codigoA, codigoB);
    } else if (canSimulate) {
      document.getElementById("simulador-partidos")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleTorneo() {
    document.getElementById("torneo")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div>
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
              {GRUPOS_ORDEN.map((g) => {
                const equipos = selecciones.filter((s) => s.grupo === g);
                if (!equipos.length) return null;
                return (
                  <optgroup key={g} label={`Grupo ${g}`}>
                    {equipos.map((s) => (
                      <option key={s.id} value={s.codigo_fifa} disabled={s.codigo_fifa === codigoB}>
                        {s.nombre}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <span className={styles.selectArrow} aria-hidden>▼</span>
          </div>
          {teamA && (
            <div className={styles.teamPreview}>
              <div className={`${styles.teamBadge} ${styles.teamBadgeA}`}>{teamA.codigo_fifa}</div>
              <div>
                <div className={styles.teamPreviewName}>{teamA.nombre}</div>
                <div className={styles.teamPreviewRank}>
                  {teamA.ranking_fifa ? `#${teamA.ranking_fifa} FIFA` : "Sin ranking FIFA"}
                </div>
              </div>
            </div>
          )}
        </div>

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
              {GRUPOS_ORDEN.map((g) => {
                const equipos = selecciones.filter((s) => s.grupo === g);
                if (!equipos.length) return null;
                return (
                  <optgroup key={g} label={`Grupo ${g}`}>
                    {equipos.map((s) => (
                      <option key={s.id} value={s.codigo_fifa} disabled={s.codigo_fifa === codigoA}>
                        {s.nombre}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <span className={styles.selectArrow} aria-hidden>▼</span>
          </div>
          {teamB && (
            <div className={styles.teamPreview}>
              <div className={`${styles.teamBadge} ${styles.teamBadgeB}`}>{teamB.codigo_fifa}</div>
              <div>
                <div className={styles.teamPreviewName}>{teamB.nombre}</div>
                <div className={styles.teamPreviewRank}>
                  {teamB.ranking_fifa ? `#${teamB.ranking_fifa} FIFA` : "Sin ranking FIFA"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden />
          Cargando estadísticas…
        </div>
      )}

      {/* Empty */}
      {!loading && !data && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚽</div>
          <div className={styles.emptyText}>
            Selecciona dos selecciones para ver su historial y estadísticas en Mundiales FIFA
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <div className={styles.results}>

          {/* H2H Hero */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionLabel}>Enfrentamientos directos en Mundiales</div>
            <div className={styles.h2hHero}>
              <div className={`${styles.h2hHeroTeam} ${styles.h2hHeroTeamA}`}>
                <span className={`${styles.h2hHeroCode} ${styles.h2hHeroCodeA}`}>{data.equipo_a.codigo_fifa}</span>
                <span className={styles.h2hHeroName}>{data.equipo_a.nombre}</span>
                {data.equipo_a.ranking_fifa && (
                  <span className={styles.h2hHeroRanking}>#{data.equipo_a.ranking_fifa} FIFA</span>
                )}
              </div>

              <div className={styles.h2hHeroScoreBox}>
                {data.head_to_head.total > 0 ? (
                  <div className={styles.h2hBigScore}>
                    <div className={styles.h2hWinsBlock}>
                      <span className={data.head_to_head.victorias_a > data.head_to_head.victorias_b ? styles.h2hBigWin : styles.h2hBigLose}>
                        {data.head_to_head.victorias_a}
                      </span>
                    </div>
                    <div className={styles.h2hDrawBlock}>
                      <span className={styles.h2hBigDraw}>{data.head_to_head.empates}</span>
                      <span className={styles.h2hBigDrawLabel}>EMPATES</span>
                    </div>
                    <div className={styles.h2hWinsBlock}>
                      <span className={data.head_to_head.victorias_b > data.head_to_head.victorias_a ? styles.h2hBigWin : styles.h2hBigLose}>
                        {data.head_to_head.victorias_b}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.h2hNoData}>Sin enfrentamientos directos</div>
                )}
              </div>

              <div className={`${styles.h2hHeroTeam} ${styles.h2hHeroTeamB}`}>
                <span className={`${styles.h2hHeroCode} ${styles.h2hHeroCodeB}`}>{data.equipo_b.codigo_fifa}</span>
                <span className={styles.h2hHeroName}>{data.equipo_b.nombre}</span>
                {data.equipo_b.ranking_fifa && (
                  <span className={styles.h2hHeroRanking}>#{data.equipo_b.ranking_fifa} FIFA</span>
                )}
              </div>
            </div>

            {/* Last 5 matches */}
            {data.ultimos_5.length > 0 && (
              <>
                <div className={styles.matchListTitle}>
                  Últimos {data.ultimos_5.length} enfrentamientos directos
                </div>
                <div className={styles.matchList}>
                  {data.ultimos_5.map((p, i) => (
                    <MatchCard key={i} p={p} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stats grid */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionLabel}>Rendimiento en Mundiales FIFA</div>
            <div className={styles.statsGrid}>
              <div className={`${styles.statsHeader} ${styles.statsHeaderA}`}>{data.equipo_a.nombre}</div>
              <div className={styles.statsHeaderCenter}>Estadística</div>
              <div className={`${styles.statsHeader} ${styles.statsHeaderB}`}>{data.equipo_b.nombre}</div>

              {STATS.map((stat, i) => {
                const valA = stat.getA(data);
                const valB = stat.getB(data);
                const aWins = stat.invertWin ? valA < valB : valA > valB;
                const bWins = stat.invertWin ? valB < valA : valB > valA;
                const posA = Math.max(valA, 0);
                const posB = Math.max(valB, 0);
                const barTotal = posA + posB;
                const barWidthA = barTotal > 0 ? (posA / barTotal) * 100 : 0;
                const barWidthB = barTotal > 0 ? (posB / barTotal) * 100 : 0;
                const delay = `${i * 0.08}s`;

                return (
                  <Fragment key={stat.key}>
                    <div className={`${styles.statCell} ${aWins ? styles.statCellAWin : bWins ? styles.statCellALose : styles.statCellANeutral}`}>
                      {valA}
                    </div>
                    <div className={styles.statLabel}>{stat.label}</div>
                    <div className={`${styles.statCell} ${bWins ? styles.statCellBWin : aWins ? styles.statCellBLose : styles.statCellBNeutral}`}>
                      {valB}
                    </div>
                    <div className={styles.statBarRow}>
                      <div className={styles.statBarTrack}>
                        <div
                          className={styles.statBarA}
                          style={{
                            width: animated ? `${barWidthA}%` : "0%",
                            transitionDelay: delay,
                            opacity: bWins ? 0.25 : 1,
                            boxShadow: aWins ? "0 2px 8px rgba(10,22,40,0.5)" : "none",
                          }}
                        />
                        <div
                          className={styles.statBarB}
                          style={{
                            width: animated ? `${barWidthB}%` : "0%",
                            transitionDelay: delay,
                            opacity: aWins ? 0.25 : 1,
                            boxShadow: bWins ? "0 2px 8px rgba(208,2,27,0.5)" : "none",
                          }}
                        />
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* CTAs */}
          <div className={styles.ctaSimular}>
            <button
              className={`${styles.btnSimular} ${!canSimulate ? styles.btnDisabled : ""}`}
              onClick={handleSimular}
              disabled={!canSimulate}
            >
              ⚡ SIMULAR ESTE PARTIDO
            </button>
            <button
              style={{
                display: "block", width: "100%", marginTop: "var(--space-3)",
                background: "var(--color-navy)", color: "#fff",
                border: "none", borderRadius: "var(--radius-lg)",
                padding: "var(--space-4) var(--space-8)",
                fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 800,
                letterSpacing: "0.02em", cursor: "pointer", textAlign: "center",
                transition: "opacity 0.15s",
              }}
              onClick={handleTorneo}
            >
              🏆 SIMULAR EL TORNEO COMPLETO
            </button>
          </div>
        </div>
      )}

      {/* CTAs even when no data but teams selected */}
      {!loading && !data && canSimulate && (
        <div className={styles.ctaSimular}>
          <button className={styles.btnSimular} onClick={handleSimular}>
            ⚡ SIMULAR ESTE PARTIDO
          </button>
        </div>
      )}
    </div>
  );
}
