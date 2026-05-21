"use client";

import { useState, useEffect } from "react";
import { getSelecciones, getProbabilidades } from "@/lib/api";
import type {
  Seleccion,
  ProbabilidadesResponse,
} from "@/lib/types";
import styles from "../partidos/page.module.css";

const GRUPOS_ORDEN = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

interface Props {
  presetEquipoA?: string;
  presetEquipoB?: string;
}

export default function SimuladorPartidosSection({ presetEquipoA, presetEquipoB }: Props) {
  const [selecciones, setSelecciones] = useState<Seleccion[]>([]);
  const [codigoA, setCodigoA] = useState(presetEquipoA ?? "");
  const [codigoB, setCodigoB] = useState(presetEquipoB ?? "");
  const [data, setData] = useState<ProbabilidadesResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    getSelecciones().then(setSelecciones).catch(() => {});
  }, []);

  useEffect(() => {
    if (presetEquipoA) setCodigoA(presetEquipoA);
  }, [presetEquipoA]);

  useEffect(() => {
    if (presetEquipoB) setCodigoB(presetEquipoB);
  }, [presetEquipoB]);

  useEffect(() => {
    if (!codigoA || !codigoB || codigoA === codigoB) {
      setData(null);
      setBarsReady(false);
      return;
    }
    setLoadingData(true);
    setBarsReady(false);
    getProbabilidades(codigoA, codigoB)
      .then((d) => {
        setData(d);
        setLoadingData(false);
        requestAnimationFrame(() => setBarsReady(true));
      })
      .catch(() => setLoadingData(false));
  }, [codigoA, codigoB]);

  const teamA = selecciones.find((s) => s.codigo_fifa === codigoA);
  const teamB = selecciones.find((s) => s.codigo_fifa === codigoB);

  return (
    <div>
      {/* BLOQUE 1 — EL ENFRENTAMIENTO */}
      <section className={styles.blockMatch}>
        <div className="container">
          {/* Selectors */}
          <div className={styles.selectorRow}>
            <div className={styles.selectorCard}>
              <div className={`${styles.selectorLabel} ${styles.selectorLabelA}`}>Equipo A</div>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectDark}
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
              <div className={styles.teamPreview}>
                {teamA ? (
                  <>
                    <div className={`${styles.teamChip} ${styles.teamChipA}`}>{teamA.codigo_fifa}</div>
                    <div className={styles.teamPreviewInfo}>
                      <div className={styles.teamPreviewName}>{teamA.nombre}</div>
                      <div className={styles.teamPreviewRank}>
                        {teamA.ranking_fifa ? `#${teamA.ranking_fifa} FIFA` : "Sin ranking"}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className={styles.teamPreviewEmpty}>Ningún equipo seleccionado</span>
                )}
              </div>
            </div>

            <div className={styles.vsCenter} aria-hidden>
              <div className={`${styles.teamCodeLarge} ${styles.teamCodeLargeA}`}>
                {teamA ? teamA.codigo_fifa : "—"}
              </div>
              <div className={styles.vsLabel}>VS</div>
              <div className={`${styles.teamCodeLarge} ${styles.teamCodeLargeB}`}>
                {teamB ? teamB.codigo_fifa : "—"}
              </div>
            </div>

            <div className={styles.selectorCard}>
              <div className={`${styles.selectorLabel} ${styles.selectorLabelB}`}>Equipo B</div>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectDark}
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
              <div className={styles.teamPreview}>
                {teamB ? (
                  <>
                    <div className={`${styles.teamChip} ${styles.teamChipB}`}>{teamB.codigo_fifa}</div>
                    <div className={styles.teamPreviewInfo}>
                      <div className={styles.teamPreviewName}>{teamB.nombre}</div>
                      <div className={styles.teamPreviewRank}>
                        {teamB.ranking_fifa ? `#${teamB.ranking_fifa} FIFA` : "Sin ranking"}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className={styles.teamPreviewEmpty}>Ningún equipo seleccionado</span>
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
              <div className={styles.probSectionTitle}>Probabilidades de resultado</div>
              <div className={styles.probBars}>
                {([
                  { label: data.equipo_a.nombre, pct: data.prob_a, fillClass: styles.probFillA },
                  { label: "Empate", pct: data.prob_empate, fillClass: styles.probFillE },
                  { label: data.equipo_b.nombre, pct: data.prob_b, fillClass: styles.probFillB },
                ] as const).map(({ label, pct, fillClass }) => (
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
                  Incluye {data.total_h2h} enfrentamiento{data.total_h2h > 1 ? "s" : ""} directo{data.total_h2h > 1 ? "s" : ""} en Mundiales FIFA
                </p>
              )}

              {/* GOLES ESPERADOS */}
              <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 20, alignItems: "flex-end" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.6rem", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.04em" }}>
                    {data.lambda_a.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                    {data.equipo_a.nombre}
                  </div>
                </div>
                <div style={{ textAlign: "center", paddingBottom: 6 }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    goles esperados
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    Según el modelo Poisson
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.6rem", fontWeight: 900, color: "#D0021B", lineHeight: 1, letterSpacing: "-0.04em" }}>
                    {data.lambda_b.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                    {data.equipo_b.nombre}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MATRIZ DE MARCADORES */}
      {data && !loadingData && (
        <section style={{ background: "#0A1628", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
              Marcadores más probables
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxWidth: 480 }}>
              {data.matriz.slice(0, 9).map((m, idx) => {
                const isTop = idx === 0;
                return (
                  <div key={`${m.i}-${m.j}`} style={{
                    background: isTop ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                    border: isTop ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    textAlign: "center",
                    position: "relative",
                  }}>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: isTop ? "#fff" : "rgba(255,255,255,0.8)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {m.i}–{m.j}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: isTop ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 600 }}>
                      {(m.prob * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONCLUSIÓN DEL MODELO */}
            {(() => {
              const la = data.lambda_a, lb = data.lambda_b;
              const na = data.equipo_a.nombre, nb = data.equipo_b.nombre;
              let texto: string;
              if (la > 1.5 && lb < 1.0)
                texto = `Partido de baja anotación esperado para ${nb}. ${na} llega como claro favorito.`;
              else if (lb > 1.5 && la < 1.0)
                texto = `Partido de baja anotación esperado para ${na}. ${nb} llega como claro favorito.`;
              else if (la < 1.2 && lb < 1.2)
                texto = "Se anticipa un partido cerrado con pocas anotaciones. Alta probabilidad de empate.";
              else if (la > 2.0 || lb > 2.0)
                texto = "Partido de alta intensidad ofensiva esperado.";
              else
                texto = "Encuentro equilibrado según el modelo.";
              return (
                <p style={{ marginTop: 14, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic", maxWidth: 480 }}>
                  {texto}
                </p>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
}
