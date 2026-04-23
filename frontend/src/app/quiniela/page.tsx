"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  quinielaRegistro,
  getQuinielaPartidos,
  guardarPicks,
  getPicksUsuario,
  getLideres,
} from "@/lib/api";
import type { QuinielaUsuario, QuinielaPartido, PickRead, LiderEntry } from "@/lib/types";

// ── Flag emoji helper ─────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿",
  CAN: "🇨🇦", BIH: "🇧🇦", QAT: "🇶🇦", CHE: "🇨🇭",
  BRA: "🇧🇷", MAR: "🇲🇦", HTI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA: "🇺🇸", PRY: "🇵🇾", AUS: "🇦🇺", TUR: "🇹🇷",
  DEU: "🇩🇪", CUW: "🇨🇼", CIV: "🇨🇮", ECU: "🇪🇨",
  NLD: "🇳🇱", JPN: "🇯🇵", SWE: "🇸🇪", TUN: "🇹🇳",
  BEL: "🇧🇪", EGY: "🇪🇬", IRN: "🇮🇷", NZL: "🇳🇿",
  ESP: "🇪🇸", CPV: "🇨🇻", KSA: "🇸🇦", URY: "🇺🇾",
  FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴",
  PRT: "🇵🇹", JAM: "🇯🇲", UZB: "🇺🇿", COL: "🇨🇴",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", HRV: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
};

// ── Scoring ───────────────────────────────────────────────────────────────────

function calcPuntos(
  gl: number, gv: number,
  rl: number | null, rv: number | null
): number | null {
  if (rl === null || rv === null) return null;
  if (gl === rl && gv === rv) return 3;
  if (gl - gv === rl - rv) return 2;
  if ((gl > gv && rl > rv) || (gl === gv && rl === rv) || (gl < gv && rl < rv)) return 1;
  return 0;
}

// ── Group data by date ────────────────────────────────────────────────────────

function groupByFecha(partidos: QuinielaPartido[]) {
  const map = new Map<string, QuinielaPartido[]>();
  for (const p of partidos) {
    if (!map.has(p.fecha)) map.set(p.fecha, []);
    map.get(p.fecha)!.push(p);
  }
  return map;
}

function formatFecha(iso: string) {
  const [, m, d] = iso.split("-");
  const months = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(d)} ${months[parseInt(m)]} 2026`;
}

const LS_KEY = "quiniela_usuario";

// ─────────────────────────────────────────────────────────────────────────────
// Registration screen
// ─────────────────────────────────────────────────────────────────────────────

function RegScreen({ onLogin }: { onLogin: (u: QuinielaUsuario) => void }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const u = await quinielaRegistro(nombre.trim(), email.trim().toLowerCase());
      localStorage.setItem(LS_KEY, JSON.stringify(u));
      onLogin(u);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.regScreen}>
      <div className={styles.regCard}>
        <div className={styles.regLogo}>
          <span className={styles.regLogoEl}>El</span>
          <span className={styles.regLogoSim}>Simulador</span>
        </div>
        <h1 className={styles.regTitle}>Quiniela Mundial 2026</h1>
        <p className={styles.regSub}>Predice los 72 partidos de la fase de grupos</p>

        <form className={styles.regForm} onSubmit={submit}>
          <label className={styles.regLabel}>
            Nombre completo
            <input
              className={styles.regInput}
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </label>
          <label className={styles.regLabel}>
            Correo electrónico
            <input
              className={styles.regInput}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </label>
          {error && <p className={styles.regError}>{error}</p>}
          <button className={styles.regBtn} type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar a la Quiniela"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Picks screen
// ─────────────────────────────────────────────────────────────────────────────

function PicksScreen({ usuario, onLogout }: { usuario: QuinielaUsuario; onLogout: () => void }) {
  const [partidos, setPartidos]     = useState<QuinielaPartido[]>([]);
  const [picks, setPicks]           = useState<Record<string, [string, string]>>({});
  const [savedPicks, setSavedPicks] = useState<Record<string, PickRead>>({});
  const [lideres, setLideres]       = useState<LiderEntry[]>([]);
  const [saving, setSaving]         = useState(false);
  const [savedMsg, setSavedMsg]     = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      getQuinielaPartidos(),
      getPicksUsuario(usuario.id),
      getLideres(),
    ]).then(([ps, myPicks, ls]) => {
      setPartidos(ps);
      setLideres(ls);
      const init: Record<string, [string, string]> = {};
      const saved: Record<string, PickRead> = {};
      for (const p of myPicks) {
        init[p.partido_id] = [String(p.goles_local), String(p.goles_visitante)];
        saved[p.partido_id] = p;
      }
      setPicks(init);
      setSavedPicks(saved);
    });
  }, [usuario.id]);

  function setScore(partidoId: string, side: 0 | 1, val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 2);
    setPicks(prev => {
      const cur = prev[partidoId] ?? ["", ""];
      const next: [string, string] = [...cur] as [string, string];
      next[side] = digits;
      return { ...prev, [partidoId]: next };
    });
  }

  const completados = partidos.filter(p => {
    const v = picks[p.id];
    return v && v[0] !== "" && v[1] !== "";
  }).length;

  async function handleSave() {
    setSaving(true);
    try {
      const payload = partidos
        .filter(p => {
          const v = picks[p.id];
          return v && v[0] !== "" && v[1] !== "";
        })
        .map(p => ({
          partido_id: p.id,
          goles_local: parseInt(picks[p.id][0]),
          goles_visitante: parseInt(picks[p.id][1]),
        }));
      await guardarPicks(usuario.id, payload);
      const [myPicks, ls] = await Promise.all([
        getPicksUsuario(usuario.id),
        getLideres(),
      ]);
      const saved: Record<string, PickRead> = {};
      for (const p of myPicks) saved[p.partido_id] = p;
      setSavedPicks(saved);
      setLideres(ls);
      if (msgTimer.current) clearTimeout(msgTimer.current);
      setSavedMsg(true);
      msgTimer.current = setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const byFecha = groupByFecha(partidos);
  const fechas = Array.from(byFecha.keys());

  return (
    <div className={styles.picksScreen}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Quiniela</h1>
          <p className={styles.heroSub}>Predice los resultados de la fase de grupos</p>
          <div className={styles.heroMeta}>
            <span className={styles.heroBadge}>
              {completados} / 72 partidos
            </span>
            <span className={styles.heroUser}>Hola, {usuario.nombre}</span>
            <button className={styles.heroLogout} onClick={onLogout}>Salir</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Matches column */}
          <div className={styles.gruposWrap}>
            {fechas.map(fecha => (
              <div key={fecha}>
                <p className={styles.grupoTitle}>{formatFecha(fecha)}</p>
                {byFecha.get(fecha)!.map(partido => {
                  const v = picks[partido.id] ?? ["", ""];
                  const filled = v[0] !== "" && v[1] !== "";
                  const sp = savedPicks[partido.id];
                  const pts = sp
                    ? calcPuntos(
                        sp.goles_local, sp.goles_visitante,
                        partido.goles_local_real, partido.goles_visitante_real
                      )
                    : null;

                  return (
                    <div
                      key={partido.id}
                      className={`${styles.matchCard} ${filled ? styles.filled : ""}`}
                    >
                      {/* Local */}
                      <div className={styles.teamLocal}>
                        <span className={styles.flag}>{FLAG[partido.codigo_local] ?? "🏳"}</span>
                        <span className={styles.teamName}>{partido.equipo_local}</span>
                      </div>

                      {/* Score inputs */}
                      <div>
                        <div className={styles.scoreWrap}>
                          <input
                            className={styles.scoreInput}
                            type="number"
                            min={0}
                            max={20}
                            value={v[0]}
                            onChange={e => setScore(partido.id, 0, e.target.value)}
                            placeholder="–"
                          />
                          <span className={styles.scoreDash}>:</span>
                          <input
                            className={styles.scoreInput}
                            type="number"
                            min={0}
                            max={20}
                            value={v[1]}
                            onChange={e => setScore(partido.id, 1, e.target.value)}
                            placeholder="–"
                          />
                        </div>
                        <div className={styles.ptsWrap}>
                          <span className={styles.matchFecha}>Grupo {partido.grupo}</span>
                          {filled && partido.cerrado && pts !== null && (
                            <span className={`${styles.ptsBadge} ${
                              pts === 3 ? styles.ptsBadge3 :
                              pts === 2 ? styles.ptsBadge2 :
                              pts === 1 ? styles.ptsBadge1 :
                              styles.ptsBadge0
                            }`}>
                              {pts} pt{pts !== 1 ? "s" : ""}
                            </span>
                          )}
                          {filled && !partido.cerrado && (
                            <span className={`${styles.ptsBadge} ${styles.ptsBadgePending}`}>
                              pendiente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visitante */}
                      <div className={styles.teamVisitante}>
                        <span className={`${styles.teamName} ${styles.teamNameRight}`}>
                          {partido.equipo_visitante}
                        </span>
                        <span className={styles.flag}>{FLAG[partido.codigo_visitante] ?? "🏳"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Save bar */}
            <div className={styles.saveBar}>
              <div className={styles.saveBarInner}>
                <span className={styles.saveCounter}>
                  <span className={styles.saveCounterNum}>{completados}</span> de 72 partidos completados
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                  {savedMsg && <span className={styles.saveMsg}>✓ Picks guardados</span>}
                  <button
                    className={styles.btnSave}
                    onClick={handleSave}
                    disabled={saving || completados === 0}
                  >
                    {saving ? "Guardando…" : "Guardar mis picks"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarHeader}>
                <p className={styles.sidebarTitle}>Tabla de lideres</p>
              </div>
              <div className={styles.sidebarList}>
                {lideres.length === 0 ? (
                  <p className={styles.sidebarEmpty}>Aún no hay resultados</p>
                ) : (
                  lideres.map((l, i) => (
                    <div
                      key={l.usuario_id}
                      className={`${styles.sidebarRow} ${l.usuario_id === usuario.id ? styles.sidebarRowMe : ""}`}
                    >
                      <span className={styles.sidebarRank}>{i + 1}</span>
                      <span className={`${styles.sidebarNombre} ${l.usuario_id === usuario.id ? styles.sidebarNombreMe : ""}`}>
                        {l.nombre}
                      </span>
                      <span className={styles.sidebarPts}>{l.puntos} pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page — router between screens
// ─────────────────────────────────────────────────────────────────────────────

export default function QuinielaPage() {
  const [usuario, setUsuario] = useState<QuinielaUsuario | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        localStorage.removeItem(LS_KEY);
      }
    }
    setHydrated(true);
  }, []);

  function handleLogin(u: QuinielaUsuario) {
    setUsuario(u);
  }

  function handleLogout() {
    localStorage.removeItem(LS_KEY);
    setUsuario(null);
  }

  if (!hydrated) return null;

  if (!usuario) return <RegScreen onLogin={handleLogin} />;

  return <PicksScreen usuario={usuario} onLogout={handleLogout} />;
}
