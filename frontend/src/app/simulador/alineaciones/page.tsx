"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getJugadoresAlineacion } from "@/lib/api";
import type { JugadorAlineacion } from "@/lib/types";
import styles from "./page.module.css";

// ─── Match fixture ────────────────────────────────────────────────────────────

interface MatchTeam { nombre: string; codigo: string; }
interface MatchDef  { id: string; grupo: string; fecha: string; local: MatchTeam; visitante: MatchTeam; }

const PARTIDOS: MatchDef[] = [
  // Grupo A
  { id:"A1", grupo:"A", fecha:"11 jun", local:{nombre:"México",               codigo:"MEX"}, visitante:{nombre:"Sudáfrica",            codigo:"RSA"} },
  { id:"A2", grupo:"A", fecha:"11 jun", local:{nombre:"República de Corea",   codigo:"KOR"}, visitante:{nombre:"República Checa",       codigo:"CZE"} },
  { id:"A3", grupo:"A", fecha:"18 jun", local:{nombre:"República Checa",      codigo:"CZE"}, visitante:{nombre:"Sudáfrica",             codigo:"RSA"} },
  { id:"A4", grupo:"A", fecha:"18 jun", local:{nombre:"México",               codigo:"MEX"}, visitante:{nombre:"República de Corea",    codigo:"KOR"} },
  { id:"A5", grupo:"A", fecha:"24 jun", local:{nombre:"República Checa",      codigo:"CZE"}, visitante:{nombre:"México",                codigo:"MEX"} },
  { id:"A6", grupo:"A", fecha:"24 jun", local:{nombre:"Sudáfrica",            codigo:"RSA"}, visitante:{nombre:"República de Corea",    codigo:"KOR"} },
  // Grupo B
  { id:"B1", grupo:"B", fecha:"12 jun", local:{nombre:"Canadá",               codigo:"CAN"}, visitante:{nombre:"Bosnia y Herzegovina",  codigo:"BIH"} },
  { id:"B2", grupo:"B", fecha:"13 jun", local:{nombre:"Catar",                codigo:"QAT"}, visitante:{nombre:"Suiza",                 codigo:"CHE"} },
  { id:"B3", grupo:"B", fecha:"18 jun", local:{nombre:"Suiza",                codigo:"CHE"}, visitante:{nombre:"Bosnia y Herzegovina",  codigo:"BIH"} },
  { id:"B4", grupo:"B", fecha:"18 jun", local:{nombre:"Canadá",               codigo:"CAN"}, visitante:{nombre:"Catar",                 codigo:"QAT"} },
  { id:"B5", grupo:"B", fecha:"24 jun", local:{nombre:"Suiza",                codigo:"CHE"}, visitante:{nombre:"Canadá",                codigo:"CAN"} },
  { id:"B6", grupo:"B", fecha:"24 jun", local:{nombre:"Bosnia y Herzegovina", codigo:"BIH"}, visitante:{nombre:"Catar",                 codigo:"QAT"} },
  // Grupo C
  { id:"C1", grupo:"C", fecha:"13 jun", local:{nombre:"Brasil",               codigo:"BRA"}, visitante:{nombre:"Marruecos",             codigo:"MAR"} },
  { id:"C2", grupo:"C", fecha:"13 jun", local:{nombre:"Haití",                codigo:"HTI"}, visitante:{nombre:"Escocia",               codigo:"SCO"} },
  { id:"C3", grupo:"C", fecha:"19 jun", local:{nombre:"Escocia",              codigo:"SCO"}, visitante:{nombre:"Marruecos",             codigo:"MAR"} },
  { id:"C4", grupo:"C", fecha:"19 jun", local:{nombre:"Brasil",               codigo:"BRA"}, visitante:{nombre:"Haití",                 codigo:"HTI"} },
  { id:"C5", grupo:"C", fecha:"24 jun", local:{nombre:"Brasil",               codigo:"BRA"}, visitante:{nombre:"Escocia",               codigo:"SCO"} },
  { id:"C6", grupo:"C", fecha:"24 jun", local:{nombre:"Marruecos",            codigo:"MAR"}, visitante:{nombre:"Haití",                 codigo:"HTI"} },
  // Grupo D
  { id:"D1", grupo:"D", fecha:"12 jun", local:{nombre:"Estados Unidos",       codigo:"USA"}, visitante:{nombre:"Paraguay",              codigo:"PRY"} },
  { id:"D2", grupo:"D", fecha:"13 jun", local:{nombre:"Australia",            codigo:"AUS"}, visitante:{nombre:"Turquía",               codigo:"TUR"} },
  { id:"D3", grupo:"D", fecha:"19 jun", local:{nombre:"Estados Unidos",       codigo:"USA"}, visitante:{nombre:"Australia",             codigo:"AUS"} },
  { id:"D4", grupo:"D", fecha:"19 jun", local:{nombre:"Turquía",              codigo:"TUR"}, visitante:{nombre:"Paraguay",              codigo:"PRY"} },
  { id:"D5", grupo:"D", fecha:"25 jun", local:{nombre:"Turquía",              codigo:"TUR"}, visitante:{nombre:"Estados Unidos",        codigo:"USA"} },
  { id:"D6", grupo:"D", fecha:"25 jun", local:{nombre:"Paraguay",             codigo:"PRY"}, visitante:{nombre:"Australia",             codigo:"AUS"} },
  // Grupo E
  { id:"E1", grupo:"E", fecha:"14 jun", local:{nombre:"Alemania",             codigo:"DEU"}, visitante:{nombre:"Curazao",               codigo:"CUW"} },
  { id:"E2", grupo:"E", fecha:"14 jun", local:{nombre:"Costa de Marfil",      codigo:"CIV"}, visitante:{nombre:"Ecuador",               codigo:"ECU"} },
  { id:"E3", grupo:"E", fecha:"20 jun", local:{nombre:"Alemania",             codigo:"DEU"}, visitante:{nombre:"Costa de Marfil",       codigo:"CIV"} },
  { id:"E4", grupo:"E", fecha:"20 jun", local:{nombre:"Ecuador",              codigo:"ECU"}, visitante:{nombre:"Curazao",               codigo:"CUW"} },
  { id:"E5", grupo:"E", fecha:"25 jun", local:{nombre:"Curazao",              codigo:"CUW"}, visitante:{nombre:"Costa de Marfil",       codigo:"CIV"} },
  { id:"E6", grupo:"E", fecha:"25 jun", local:{nombre:"Ecuador",              codigo:"ECU"}, visitante:{nombre:"Alemania",              codigo:"DEU"} },
  // Grupo F
  { id:"F1", grupo:"F", fecha:"14 jun", local:{nombre:"Países Bajos",         codigo:"NLD"}, visitante:{nombre:"Japón",                 codigo:"JPN"} },
  { id:"F2", grupo:"F", fecha:"14 jun", local:{nombre:"Suecia",               codigo:"SWE"}, visitante:{nombre:"Túnez",                 codigo:"TUN"} },
  { id:"F3", grupo:"F", fecha:"20 jun", local:{nombre:"Países Bajos",         codigo:"NLD"}, visitante:{nombre:"Suecia",                codigo:"SWE"} },
  { id:"F4", grupo:"F", fecha:"20 jun", local:{nombre:"Túnez",                codigo:"TUN"}, visitante:{nombre:"Japón",                 codigo:"JPN"} },
  { id:"F5", grupo:"F", fecha:"25 jun", local:{nombre:"Japón",                codigo:"JPN"}, visitante:{nombre:"Suecia",                codigo:"SWE"} },
  { id:"F6", grupo:"F", fecha:"25 jun", local:{nombre:"Túnez",                codigo:"TUN"}, visitante:{nombre:"Países Bajos",          codigo:"NLD"} },
  // Grupo G
  { id:"G1", grupo:"G", fecha:"15 jun", local:{nombre:"Bélgica",              codigo:"BEL"}, visitante:{nombre:"Egipto",                codigo:"EGY"} },
  { id:"G2", grupo:"G", fecha:"15 jun", local:{nombre:"Irán",                 codigo:"IRN"}, visitante:{nombre:"Nueva Zelanda",         codigo:"NZL"} },
  { id:"G3", grupo:"G", fecha:"21 jun", local:{nombre:"Bélgica",              codigo:"BEL"}, visitante:{nombre:"Irán",                  codigo:"IRN"} },
  { id:"G4", grupo:"G", fecha:"21 jun", local:{nombre:"Nueva Zelanda",        codigo:"NZL"}, visitante:{nombre:"Egipto",                codigo:"EGY"} },
  { id:"G5", grupo:"G", fecha:"26 jun", local:{nombre:"Egipto",               codigo:"EGY"}, visitante:{nombre:"Irán",                  codigo:"IRN"} },
  { id:"G6", grupo:"G", fecha:"26 jun", local:{nombre:"Nueva Zelanda",        codigo:"NZL"}, visitante:{nombre:"Bélgica",               codigo:"BEL"} },
  // Grupo H
  { id:"H1", grupo:"H", fecha:"15 jun", local:{nombre:"España",               codigo:"ESP"}, visitante:{nombre:"Cabo Verde",            codigo:"CPV"} },
  { id:"H2", grupo:"H", fecha:"15 jun", local:{nombre:"Arabia Saudí",         codigo:"KSA"}, visitante:{nombre:"Uruguay",               codigo:"URY"} },
  { id:"H3", grupo:"H", fecha:"21 jun", local:{nombre:"España",               codigo:"ESP"}, visitante:{nombre:"Arabia Saudí",          codigo:"KSA"} },
  { id:"H4", grupo:"H", fecha:"21 jun", local:{nombre:"Uruguay",              codigo:"URY"}, visitante:{nombre:"Cabo Verde",            codigo:"CPV"} },
  { id:"H5", grupo:"H", fecha:"26 jun", local:{nombre:"Cabo Verde",           codigo:"CPV"}, visitante:{nombre:"Arabia Saudí",          codigo:"KSA"} },
  { id:"H6", grupo:"H", fecha:"26 jun", local:{nombre:"Uruguay",              codigo:"URY"}, visitante:{nombre:"España",                codigo:"ESP"} },
  // Grupo I
  { id:"I1", grupo:"I", fecha:"16 jun", local:{nombre:"Francia",              codigo:"FRA"}, visitante:{nombre:"Senegal",               codigo:"SEN"} },
  { id:"I2", grupo:"I", fecha:"16 jun", local:{nombre:"Irak",                 codigo:"IRQ"}, visitante:{nombre:"Noruega",               codigo:"NOR"} },
  { id:"I3", grupo:"I", fecha:"22 jun", local:{nombre:"Francia",              codigo:"FRA"}, visitante:{nombre:"Irak",                  codigo:"IRQ"} },
  { id:"I4", grupo:"I", fecha:"22 jun", local:{nombre:"Noruega",              codigo:"NOR"}, visitante:{nombre:"Senegal",               codigo:"SEN"} },
  { id:"I5", grupo:"I", fecha:"26 jun", local:{nombre:"Noruega",              codigo:"NOR"}, visitante:{nombre:"Francia",               codigo:"FRA"} },
  { id:"I6", grupo:"I", fecha:"26 jun", local:{nombre:"Senegal",              codigo:"SEN"}, visitante:{nombre:"Irak",                  codigo:"IRQ"} },
  // Grupo J
  { id:"J1", grupo:"J", fecha:"16 jun", local:{nombre:"Argentina",            codigo:"ARG"}, visitante:{nombre:"Argelia",               codigo:"ALG"} },
  { id:"J2", grupo:"J", fecha:"16 jun", local:{nombre:"Austria",              codigo:"AUT"}, visitante:{nombre:"Jordania",              codigo:"JOR"} },
  { id:"J3", grupo:"J", fecha:"22 jun", local:{nombre:"Argentina",            codigo:"ARG"}, visitante:{nombre:"Austria",               codigo:"AUT"} },
  { id:"J4", grupo:"J", fecha:"22 jun", local:{nombre:"Jordania",             codigo:"JOR"}, visitante:{nombre:"Argelia",               codigo:"ALG"} },
  { id:"J5", grupo:"J", fecha:"27 jun", local:{nombre:"Argelia",              codigo:"ALG"}, visitante:{nombre:"Austria",               codigo:"AUT"} },
  { id:"J6", grupo:"J", fecha:"27 jun", local:{nombre:"Jordania",             codigo:"JOR"}, visitante:{nombre:"Argentina",             codigo:"ARG"} },
  // Grupo K
  { id:"K1", grupo:"K", fecha:"17 jun", local:{nombre:"Portugal",             codigo:"PRT"}, visitante:{nombre:"Jamaica",               codigo:"JAM"} },
  { id:"K2", grupo:"K", fecha:"17 jun", local:{nombre:"Uzbekistán",           codigo:"UZB"}, visitante:{nombre:"Colombia",              codigo:"COL"} },
  { id:"K3", grupo:"K", fecha:"23 jun", local:{nombre:"Portugal",             codigo:"PRT"}, visitante:{nombre:"Uzbekistán",            codigo:"UZB"} },
  { id:"K4", grupo:"K", fecha:"23 jun", local:{nombre:"Colombia",             codigo:"COL"}, visitante:{nombre:"Jamaica",               codigo:"JAM"} },
  { id:"K5", grupo:"K", fecha:"27 jun", local:{nombre:"Colombia",             codigo:"COL"}, visitante:{nombre:"Portugal",              codigo:"PRT"} },
  { id:"K6", grupo:"K", fecha:"27 jun", local:{nombre:"Jamaica",              codigo:"JAM"}, visitante:{nombre:"Uzbekistán",            codigo:"UZB"} },
  // Grupo L
  { id:"L1", grupo:"L", fecha:"17 jun", local:{nombre:"Inglaterra",           codigo:"ENG"}, visitante:{nombre:"Croacia",               codigo:"HRV"} },
  { id:"L2", grupo:"L", fecha:"17 jun", local:{nombre:"Ghana",                codigo:"GHA"}, visitante:{nombre:"Panamá",                codigo:"PAN"} },
  { id:"L3", grupo:"L", fecha:"23 jun", local:{nombre:"Inglaterra",           codigo:"ENG"}, visitante:{nombre:"Ghana",                 codigo:"GHA"} },
  { id:"L4", grupo:"L", fecha:"23 jun", local:{nombre:"Panamá",               codigo:"PAN"}, visitante:{nombre:"Croacia",               codigo:"HRV"} },
  { id:"L5", grupo:"L", fecha:"27 jun", local:{nombre:"Panamá",               codigo:"PAN"}, visitante:{nombre:"Inglaterra",            codigo:"ENG"} },
  { id:"L6", grupo:"L", fecha:"27 jun", local:{nombre:"Croacia",              codigo:"HRV"}, visitante:{nombre:"Ghana",                 codigo:"GHA"} },
];

// ─── Formation logic ──────────────────────────────────────────────────────────

type PosType = "GK" | "DEF" | "MID" | "FWD";

const FORMATIONS: Record<string, number[]> = {
  "4-3-3":   [4, 3, 3],
  "4-4-2":   [4, 4, 2],
  "4-2-3-1": [4, 2, 3, 1],
  "3-5-2":   [3, 5, 2],
  "5-3-2":   [5, 3, 2],
  "3-4-3":   [3, 4, 3],
};
const FORMATION_OPTIONS = Object.keys(FORMATIONS);

const CY = 260; // SVG pitch center-y (800×520 viewBox)

function distributeY(n: number): number[] {
  const spacing = n <= 4 ? 90 : 72;
  return Array.from({ length: n }, (_, i) => CY + (i - (n - 1) / 2) * spacing);
}

interface Slot { id: string; posType: PosType; svgX: number; svgY: number; lineLabel: string; }

function makeSlots(formation: string, side: "home" | "away"): Slot[] {
  const lines = FORMATIONS[formation] ?? [4, 3, 3];
  const homeX = lines.length <= 3 ? [165, 305, 408] : [155, 245, 338, 408];
  const xArr  = side === "home" ? homeX : homeX.map((x) => 800 - x);
  const slots: Slot[] = [];

  slots.push({ id:`${side}_GK_0`, posType:"GK", svgX: side==="home"?54:746, svgY:CY, lineLabel:"Portero" });

  lines.forEach((count, lineIdx) => {
    const posType: PosType = lineIdx === 0 ? "DEF" : lineIdx === lines.length - 1 ? "FWD" : "MID";
    const x = xArr[lineIdx];
    const lineLabel = posType === "DEF" ? "Defensa" : posType === "MID" ? "Medio" : "Delantero";
    distributeY(count).forEach((y, slotIdx) => {
      slots.push({ id:`${side}_${posType}_${lineIdx}_${slotIdx}`, posType, svgX:x, svgY:y, lineLabel });
    });
  });
  return slots;
}

// ─── Player helpers ───────────────────────────────────────────────────────────

const POS_GROUP: Record<string, PosType> = {
  "Portero":"GK","Defensa central":"DEF","Lateral izquierdo":"DEF","Lateral derecho":"DEF",
  "Pivote":"MID","Mediocentro":"MID","Mediocentro ofensivo":"MID",
  "Interior izquierdo":"MID","Interior derecho":"MID","Mediapunta":"MID",
  "Extremo izquierdo":"FWD","Extremo derecho":"FWD","Delantero centro":"FWD",
};
function posGroup(p: string | null): PosType { return (p && POS_GROUP[p]) || "MID"; }

function apellido(nombre: string): string {
  const last = nombre.trim().split(" ").pop() ?? nombre;
  return last.length > 9 ? last.slice(0, 8) + "." : last;
}

function formatValue(v: number | null): string {
  if (!v) return "–";
  if (v >= 1_000_000) return `€${Math.round(v/1_000_000)}M`;
  if (v >= 1_000)     return `€${Math.round(v/1_000)}K`;
  return `€${v}`;
}

// ─── SVG Pitch ────────────────────────────────────────────────────────────────

function PitchLines() {
  const W = 800, H = 520;
  const s  = { stroke:"rgba(255,255,255,0.85)", strokeWidth:2,   fill:"none" } as const;
  const sl = { stroke:"rgba(255,255,255,0.6)",  strokeWidth:1.5, fill:"none" } as const;
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#267326" />
      {Array.from({length:10},(_,i)=>(
        <rect key={i} x={i*80} y={0} width={40} height={H} fill={i%2===0?"rgba(0,0,0,0.04)":"none"} />
      ))}
      <rect x={2} y={2} width={W-4} height={H-4} {...s} />
      <line x1={W/2} y1={2} x2={W/2} y2={H-2} {...s} />
      <circle cx={W/2} cy={H/2} r={70} {...s} />
      <circle cx={W/2} cy={H/2} r={4} fill="rgba(255,255,255,0.85)" />
      {/* penalty areas */}
      <rect x={2}     y={106} width={126} height={308} {...s} />
      <rect x={W-128} y={106} width={126} height={308} {...s} />
      {/* goal areas */}
      <rect x={2}     y={190} width={42} height={140} {...sl} />
      <rect x={W-44}  y={190} width={42} height={140} {...sl} />
      {/* penalty spots */}
      <circle cx={84}   cy={H/2} r={3} fill="rgba(255,255,255,0.85)" />
      <circle cx={W-84} cy={H/2} r={3} fill="rgba(255,255,255,0.85)" />
      {/* goals */}
      <rect x={-12} y={226} width={14} height={68} {...sl} />
      <rect x={W-2}  y={226} width={14} height={68} {...sl} />
    </>
  );
}

interface PlayerCircleProps {
  slot: Slot; player: JugadorAlineacion | null;
  color: string; onClick: ()=>void; isSelected: boolean;
}
function PlayerCircle({ slot, player, color, onClick, isSelected }: PlayerCircleProps) {
  const R = 18;
  const shortName = player ? apellido(player.nombre) : slot.lineLabel.slice(0,3).toUpperCase();
  const num = player?.numero_camiseta ?? null;
  return (
    <g transform={`translate(${slot.svgX},${slot.svgY})`} onClick={onClick} style={{cursor:"pointer"}}>
      {isSelected && <circle r={R+4} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="4 2" opacity={0.8}/>}
      <circle r={R} fill={color} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {num !== null && (
        <text y={-5} textAnchor="middle" fontSize={7.5} fontWeight={700}
          fill="rgba(255,255,255,0.75)" fontFamily="Inter,sans-serif">{num}</text>
      )}
      <text y={num!==null?5:4} textAnchor="middle" fontSize={8} fontWeight={800}
        fill="#fff" fontFamily="Inter,sans-serif">{shortName}</text>
      <text y={R+12} textAnchor="middle" fontSize={8.5} fontWeight={600}
        fill="rgba(255,255,255,0.9)" fontFamily="Inter,sans-serif"
        style={{filter:"drop-shadow(0 1px 1px rgba(0,0,0,0.7))"}}>
        {player ? apellido(player.nombre) : "—"}
      </text>
    </g>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function PlayerDrawer({
  title, jugadores, filterPosType, assigned, onSelect, onClose,
}: {
  title: string; jugadores: JugadorAlineacion[]; filterPosType: PosType;
  assigned: Set<number>; onSelect:(j:JugadorAlineacion)=>void; onClose:()=>void;
}) {
  const filtered = jugadores.filter((j) => posGroup(j.posicion) === filterPosType);
  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{title}</span>
          <button className={styles.drawerClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className={styles.drawerList}>
          {filtered.length === 0 ? (
            <p className={styles.drawerEmpty}>Sin jugadores para esta posición</p>
          ) : filtered.map((j) => {
            const taken = assigned.has(j.id);
            return (
              <div key={j.id}
                className={`${styles.drawerItem} ${taken?styles.drawerItemDisabled:""}`}
                onClick={() => !taken && onSelect(j)}
              >
                <div className={styles.drawerItemInfo}>
                  <div className={styles.drawerItemNombre}>{j.nombre}</div>
                  <div className={styles.drawerItemMeta}>
                    {j.posicion??"-"} · {j.club??"-"}{j.edad?` · ${j.edad}a`:""}
                  </div>
                </div>
                <span className={styles.drawerItemValue}>{formatValue(j.valor_mercado_eur)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AlineacionesPage() {
  const [matchId,         setMatchId]         = useState(PARTIDOS[0].id);
  const [formLocal,       setFormLocal]        = useState("4-3-3");
  const [formVisitante,   setFormVisitante]    = useState("4-3-3");
  const [jugadoresLocal,  setJugadoresLocal]   = useState<JugadorAlineacion[]>([]);
  const [jugadoresVis,    setJugadoresVis]     = useState<JugadorAlineacion[]>([]);
  const [assignLocal,     setAssignLocal]      = useState<Record<string, JugadorAlineacion>>({});
  const [assignVis,       setAssignVis]        = useState<Record<string, JugadorAlineacion>>({});
  const [drawer, setDrawer] = useState<{ side:"local"|"visitante"; slotId:string; posType:PosType; }|null>(null);
  const [loading, setLoading] = useState(false);

  const match = PARTIDOS.find((p) => p.id === matchId)!;

  useEffect(() => {
    setAssignLocal({}); setAssignVis({}); setDrawer(null); setLoading(true);
    Promise.all([
      getJugadoresAlineacion(match.local.codigo).catch(() => [] as JugadorAlineacion[]),
      getJugadoresAlineacion(match.visitante.codigo).catch(() => [] as JugadorAlineacion[]),
    ]).then(([jl, jv]) => {
      setJugadoresLocal(jl); setJugadoresVis(jv); setLoading(false);
    });
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setAssignLocal({}); },  [formLocal]);
  useEffect(() => { setAssignVis({}); },    [formVisitante]);

  const slotsLocal = makeSlots(formLocal,     "home");
  const slotsVis   = makeSlots(formVisitante, "away");

  const assignedLocalIds = new Set(Object.values(assignLocal).map((j) => j.id));
  const assignedVisIds   = new Set(Object.values(assignVis).map((j)   => j.id));

  const handleSlotClick = useCallback((side:"local"|"visitante", slot:Slot) => {
    setDrawer({ side, slotId:slot.id, posType:slot.posType });
  }, []);

  const handleSelectPlayer = useCallback((j:JugadorAlineacion) => {
    if (!drawer) return;
    if (drawer.side === "local") setAssignLocal((p) => ({...p, [drawer.slotId]:j}));
    else                          setAssignVis((p)   => ({...p, [drawer.slotId]:j}));
    setDrawer(null);
  }, [drawer]);

  const drawerJugadores = drawer?.side === "local" ? jugadoresLocal : jugadoresVis;
  const drawerAssigned  = drawer?.side === "local" ? assignedLocalIds : assignedVisIds;
  const drawerTeamName  = drawer?.side === "local" ? match.local.nombre : match.visitante.nombre;
  const posLabel = drawer
    ? ({GK:"Porteros",DEF:"Defensas",MID:"Mediocampistas",FWD:"Delanteros"} as const)[drawer.posType]
    : "";
  const drawerTitle = drawer ? `${drawerTeamName} · ${posLabel}` : "";

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Simulador de Alineaciones</h1>
          <div className={styles.matchSelectWrap}>
            <select className={styles.matchSelect} value={matchId}
              onChange={(e) => setMatchId(e.target.value)}>
              {PARTIDOS.map((p) => (
                <option key={p.id} value={p.id}>
                  Grupo {p.grupo} - {p.fecha} · {p.local.nombre} vs {p.visitante.nombre}
                </option>
              ))}
            </select>
            <span className={styles.matchSelectChevron}>▾</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.pitchContainer}>
          {/* Team / formation headers */}
          <div className={styles.teamHeaders}>
            <div className={styles.teamHeaderLocal}>
              <span className={`${styles.teamNameDot} ${styles.teamNameDotLocal}`} />
              <span className={styles.teamName}>{match.local.nombre}</span>
              <select className={styles.formationSelect} value={formLocal}
                onChange={(e) => setFormLocal(e.target.value)}>
                {FORMATION_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className={styles.teamHeaderVisitante}>
              <span className={`${styles.teamNameDot} ${styles.teamNameDotVisitante}`} />
              <span className={styles.teamName}>{match.visitante.nombre}</span>
              <select className={styles.formationSelect} value={formVisitante}
                onChange={(e) => setFormVisitante(e.target.value)}>
                {FORMATION_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Football pitch */}
          <div className={styles.pitchSvgWrap}>
            <svg viewBox="0 0 800 520" width="100%" xmlns="http://www.w3.org/2000/svg"
              aria-label="Cancha de fútbol">
              <PitchLines />

              {slotsLocal.map((slot) => (
                <PlayerCircle key={slot.id} slot={slot}
                  player={assignLocal[slot.id]??null} color="#0A1628"
                  onClick={() => handleSlotClick("local", slot)}
                  isSelected={drawer?.slotId === slot.id} />
              ))}

              {slotsVis.map((slot) => (
                <PlayerCircle key={slot.id} slot={slot}
                  player={assignVis[slot.id]??null} color="#D0021B"
                  onClick={() => handleSlotClick("visitante", slot)}
                  isSelected={drawer?.slotId === slot.id} />
              ))}

              {loading && (
                <rect x={0} y={0} width={800} height={520} fill="rgba(0,0,0,0.35)" />
              )}
            </svg>
          </div>

          {/* Simular partido */}
          <div className={styles.simularWrap}>
            <Link
              href={`/simulador/partidos?local=${match.local.codigo}&visitante=${match.visitante.codigo}`}
              className={styles.btnSimular}
            >
              Simular partido
            </Link>
          </div>
        </div>
      </div>

      {drawer && (
        <PlayerDrawer
          title={drawerTitle}
          jugadores={drawerJugadores}
          filterPosType={drawer.posType}
          assigned={drawerAssigned}
          onSelect={handleSelectPlayer}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
