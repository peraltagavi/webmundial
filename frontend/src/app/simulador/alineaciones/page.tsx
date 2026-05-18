"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getJugadoresAlineacion } from "@/lib/api";
import type { JugadorAlineacion } from "@/lib/types";
import styles from "./page.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type PosType  = "GK" | "DEF" | "MID" | "FWD";
type Side     = "local" | "visitante";

interface Slot       { id: string; posType: PosType; svgX: number; svgY: number; lineLabel: string; }
interface ZoneRating { defensa: number; mediocampo: number; ataque: number; overall: number; }
interface PulseMap   { defensa?: "up"|"down"; mediocampo?: "up"|"down"; ataque?: "up"|"down"; }

interface DrawerState {
  side: Side;
  slotId: string;
  posType: PosType;
  currentPlayer: JugadorAlineacion | null;
}
interface TooltipState {
  player: JugadorAlineacion;
  x: number;
  y: number;
}

// ─── Match fixtures ───────────────────────────────────────────────────────────

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
  { id:"K1", grupo:"K", fecha:"17 jun", local:{nombre:"Portugal",             codigo:"PRT"}, visitante:{nombre:"RD de Congo",           codigo:"COD"} },
  { id:"K2", grupo:"K", fecha:"17 jun", local:{nombre:"Uzbekistán",           codigo:"UZB"}, visitante:{nombre:"Colombia",              codigo:"COL"} },
  { id:"K3", grupo:"K", fecha:"23 jun", local:{nombre:"Portugal",             codigo:"PRT"}, visitante:{nombre:"Uzbekistán",            codigo:"UZB"} },
  { id:"K4", grupo:"K", fecha:"23 jun", local:{nombre:"Colombia",             codigo:"COL"}, visitante:{nombre:"RD de Congo",           codigo:"COD"} },
  { id:"K5", grupo:"K", fecha:"27 jun", local:{nombre:"Colombia",             codigo:"COL"}, visitante:{nombre:"Portugal",              codigo:"PRT"} },
  { id:"K6", grupo:"K", fecha:"27 jun", local:{nombre:"RD de Congo",          codigo:"COD"}, visitante:{nombre:"Uzbekistán",            codigo:"UZB"} },
  // Grupo L
  { id:"L1", grupo:"L", fecha:"17 jun", local:{nombre:"Inglaterra",           codigo:"ENG"}, visitante:{nombre:"Croacia",               codigo:"HRV"} },
  { id:"L2", grupo:"L", fecha:"17 jun", local:{nombre:"Ghana",                codigo:"GHA"}, visitante:{nombre:"Panamá",                codigo:"PAN"} },
  { id:"L3", grupo:"L", fecha:"23 jun", local:{nombre:"Inglaterra",           codigo:"ENG"}, visitante:{nombre:"Ghana",                 codigo:"GHA"} },
  { id:"L4", grupo:"L", fecha:"23 jun", local:{nombre:"Panamá",               codigo:"PAN"}, visitante:{nombre:"Croacia",               codigo:"HRV"} },
  { id:"L5", grupo:"L", fecha:"27 jun", local:{nombre:"Panamá",               codigo:"PAN"}, visitante:{nombre:"Inglaterra",            codigo:"ENG"} },
  { id:"L6", grupo:"L", fecha:"27 jun", local:{nombre:"Croacia",              codigo:"HRV"}, visitante:{nombre:"Ghana",                 codigo:"GHA"} },
];

// ─── Formation constants ──────────────────────────────────────────────────────

const FORMATIONS: Record<string, number[]> = {
  "4-3-3":   [4, 3, 3],
  "4-4-2":   [4, 4, 2],
  "4-2-3-1": [4, 2, 3, 1],
  "3-5-2":   [3, 5, 2],
  "5-3-2":   [5, 3, 2],
  "3-4-3":   [3, 4, 3],
};
const FORMATION_OPTIONS = Object.keys(FORMATIONS);
const CY = 260;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function distributeY(n: number): number[] {
  const spacing = n <= 4 ? 90 : 72;
  return Array.from({ length: n }, (_, i) => CY + (i - (n - 1) / 2) * spacing);
}

function makeSlots(formation: string, side: Side): Slot[] {
  const lines = FORMATIONS[formation] ?? [4, 3, 3];
  const homeX = lines.length <= 3 ? [165, 305, 408] : [155, 245, 338, 408];
  const xArr  = side === "local" ? homeX : homeX.map((x) => 800 - x);
  const slots: Slot[] = [];

  slots.push({ id:`${side}_GK_0`, posType:"GK", svgX: side==="local"?54:746, svgY:CY, lineLabel:"GK" });

  lines.forEach((count, lineIdx) => {
    const posType: PosType = lineIdx === 0 ? "DEF" : lineIdx === lines.length - 1 ? "FWD" : "MID";
    const x = xArr[lineIdx];
    const lineLabel = posType === "DEF" ? "DEF" : posType === "MID" ? "MID" : "FWD";
    distributeY(count).forEach((y, slotIdx) => {
      slots.push({ id:`${side}_${posType}_${lineIdx}_${slotIdx}`, posType, svgX:x, svgY:y, lineLabel });
    });
  });
  return slots;
}

const POS_GROUP: Record<string, PosType> = {
  "Portero":"GK","Defensa central":"DEF","Lateral izquierdo":"DEF","Lateral derecho":"DEF",
  "Carrilero izquierdo":"DEF","Carrilero derecho":"DEF","Líbero":"DEF",
  "Pivote":"MID","Mediocentro":"MID","Mediocentro ofensivo":"MID",
  "Interior izquierdo":"MID","Interior derecho":"MID","Mediapunta":"MID",
  "Centrocampista":"MID","Volante":"MID",
  "Extremo izquierdo":"FWD","Extremo derecho":"FWD","Delantero centro":"FWD","Ariete":"FWD",
};
function posGroup(p: string | null): PosType { return (p && POS_GROUP[p]) || "MID"; }

function getZona(posicion: string | null): "defensa" | "mediocampo" | "ataque" | "unknown" {
  if (!posicion) return "unknown";
  const p = posicion.toLowerCase();
  if (["portero","defensa","lateral","líbero","libero","carrilero"].some(k => p.includes(k))) return "defensa";
  if (["medio","centrocampista","volante","interior","pivote"].some(k => p.includes(k))) return "mediocampo";
  if (["delantero","extremo","ariete","punta","mediapunta"].some(k => p.includes(k))) return "ataque";
  return "unknown";
}

function computeZoneRatings(xi: Record<string, JugadorAlineacion>): ZoneRating {
  const zones: Record<string, number[]> = { defensa: [], mediocampo: [], ataque: [] };
  Object.values(xi).forEach((j) => {
    const z = getZona(j.posicion);
    if (z !== "unknown") zones[z].push(j.score);
  });
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const d = avg(zones.defensa);
  const m = avg(zones.mediocampo);
  const a = avg(zones.ataque);
  const nonZero = [d, m, a].filter(x => x > 0);
  const o = nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;
  return { defensa: d, mediocampo: m, ataque: a, overall: o };
}

function autoFillXI(squad: JugadorAlineacion[], slots: Slot[]): Record<string, JugadorAlineacion> {
  const assigned: Record<string, JugadorAlineacion> = {};
  const usedIds = new Set<number>();

  const fillByType = (type: PosType) => {
    const matching = slots.filter(s => s.posType === type);
    const candidates = [...squad]
      .filter(j => posGroup(j.posicion) === type && !usedIds.has(j.id))
      .sort((a, b) => b.score - a.score);
    matching.forEach((slot, i) => {
      if (candidates[i]) {
        assigned[slot.id] = candidates[i];
        usedIds.add(candidates[i].id);
      }
    });
  };

  fillByType("GK");
  fillByType("DEF");
  fillByType("MID");
  fillByType("FWD");

  // fallback: fill empty slots with best remaining players
  slots.forEach(slot => {
    if (!assigned[slot.id]) {
      const remaining = squad.filter(j => !usedIds.has(j.id)).sort((a, b) => b.score - a.score);
      if (remaining[0]) {
        assigned[slot.id] = remaining[0];
        usedIds.add(remaining[0].id);
      }
    }
  });

  return assigned;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function surname(nombre: string, max = 9): string {
  const parts = nombre.trim().split(" ");
  const last = parts[parts.length - 1];
  return last.length > max ? last.slice(0, max - 1) + "." : last;
}

function formatValor(v: number | null): string {
  if (!v) return "–";
  if (v >= 1_000_000) return `€${Math.round(v / 1_000_000)}M`;
  if (v >= 1_000)     return `€${Math.round(v / 1_000)}K`;
  return `€${v}`;
}

// ─── SVG Components ───────────────────────────────────────────────────────────

function PitchLines() {
  const W = 800, H = 520;
  const s  = { stroke: "rgba(255,255,255,0.75)", strokeWidth: 2,   fill: "none" } as const;
  const sl = { stroke: "rgba(255,255,255,0.5)",  strokeWidth: 1.5, fill: "none" } as const;
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#2D5A1B" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 80} y={0} width={40} height={H}
          fill={i % 2 === 0 ? "rgba(0,0,0,0.06)" : "none"} />
      ))}
      <rect x={2} y={2} width={W - 4} height={H - 4} {...s} />
      <line x1={W / 2} y1={2} x2={W / 2} y2={H - 2} {...s} />
      <circle cx={W / 2} cy={H / 2} r={70} {...s} />
      <circle cx={W / 2} cy={H / 2} r={4} fill="rgba(255,255,255,0.8)" />
      <rect x={2}     y={106} width={126} height={308} {...s} />
      <rect x={W-128} y={106} width={126} height={308} {...s} />
      <rect x={2}     y={190} width={42}  height={140} {...sl} />
      <rect x={W-44}  y={190} width={42}  height={140} {...sl} />
      <circle cx={84}   cy={H / 2} r={3} fill="rgba(255,255,255,0.8)" />
      <circle cx={W-84} cy={H / 2} r={3} fill="rgba(255,255,255,0.8)" />
      <rect x={-12} y={226} width={14} height={68} {...sl} />
      <rect x={W-2}  y={226} width={14} height={68} {...sl} />
    </>
  );
}

interface PlayerCircleProps {
  slot: Slot;
  player: JugadorAlineacion | null;
  isHome: boolean;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent, p: JugadorAlineacion) => void;
  onMouseLeave: () => void;
}
function PlayerCircle({ slot, player, isHome, isSelected, onClick, onMouseEnter, onMouseLeave }: PlayerCircleProps) {
  const R = 22;
  const baseColor = isHome ? "#0A1628" : "#D0021B";
  const border = player ? scoreColor(player.score) : "rgba(255,255,255,0.4)";
  const shortName = player ? surname(player.nombre) : slot.lineLabel;
  const num = player?.numero_camiseta ?? null;

  return (
    <g
      transform={`translate(${slot.svgX},${slot.svgY})`}
      onClick={onClick}
      onMouseEnter={player ? (e) => onMouseEnter(e, player) : undefined}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "pointer" }}
    >
      {isSelected && (
        <circle r={R + 5} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="4 3" opacity={0.9} />
      )}
      <circle r={R} fill={baseColor} stroke={border} strokeWidth={2.5} />
      {num !== null && (
        <text y={-6} textAnchor="middle" fontSize={8} fontWeight={700}
          fill="rgba(255,255,255,0.7)" fontFamily="Inter,sans-serif">{num}</text>
      )}
      <text y={num !== null ? 5 : 4} textAnchor="middle" fontSize={8.5} fontWeight={800}
        fill="#fff" fontFamily="Inter,sans-serif">{shortName}</text>
      {!player && (
        <text y={R + 13} textAnchor="middle" fontSize={9} fontWeight={600}
          fill="rgba(255,255,255,0.55)" fontFamily="Inter,sans-serif">
          {slot.lineLabel}
        </text>
      )}
    </g>
  );
}

// ─── RatingPanel ──────────────────────────────────────────────────────────────

interface RatingPanelProps {
  teamName: string;
  rating: ZoneRating;
  pulse: PulseMap;
  isVisitante?: boolean;
}
function RatingPanel({ teamName, rating, pulse, isVisitante }: RatingPanelProps) {
  const fillClass = isVisitante ? styles.ratingBarFillVisitante : styles.ratingBarFillLocal;
  const bars = [
    { key: "ataque",      label: "ATQ", val: rating.ataque },
    { key: "mediocampo",  label: "MED", val: rating.mediocampo },
    { key: "defensa",     label: "DEF", val: rating.defensa },
  ] as const;

  return (
    <div className={styles.ratingPanel}>
      <div className={styles.ratingTeam}>{teamName}</div>
      <div className={styles.ratingBars}>
        {bars.map(({ key, label, val }) => {
          const p = pulse[key];
          const cls = p === "up" ? styles.barPulseUp : p === "down" ? styles.barPulseDown : "";
          return (
            <div key={key} className={styles.ratingBarRow}>
              <span className={styles.ratingBarLabel}>{label}</span>
              <div className={styles.ratingBarTrack}>
                <div
                  className={`${fillClass} ${styles.ratingBarFill} ${cls}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className={styles.ratingBarVal}>{val || "–"}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.ratingOverall}>
        <span className={styles.ratingOverallLabel}>OVR</span>
        <span className={styles.ratingOverallVal}>{rating.overall || "–"}</span>
      </div>
    </div>
  );
}

// ─── PlayerDrawer ─────────────────────────────────────────────────────────────

interface PlayerDrawerProps {
  drawer: DrawerState;
  jugadores: JugadorAlineacion[];
  assigned: Set<number>;
  xi: Record<string, JugadorAlineacion>;
  onSelect: (j: JugadorAlineacion) => void;
  onMejorXI: () => void;
  onClose: () => void;
}
function PlayerDrawer({ drawer, jugadores, assigned, xi, onSelect, onMejorXI, onClose }: PlayerDrawerProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const filtered = jugadores
    .filter(j => posGroup(j.posicion) === drawer.posType)
    .sort((a, b) => b.score - a.score);

  const posLabel = ({ GK: "Porteros", DEF: "Defensas", MID: "Mediocampistas", FWD: "Delanteros" } as const)[drawer.posType];
  const title = `${posLabel}`;

  function previewText(candidate: JugadorAlineacion): { text: string; dir: "up" | "down" | null } {
    if (!drawer.currentPlayer) return { text: "", dir: null };
    const before = computeZoneRatings(xi);
    const simulatedXI = { ...xi, [drawer.slotId]: candidate };
    const after = computeZoneRatings(simulatedXI);
    const delta = after.overall - before.overall;
    if (Math.abs(delta) < 1) return { text: "", dir: null };
    return {
      text: `OVR ${delta > 0 ? "+" : ""}${delta}`,
      dir: delta > 0 ? "up" : "down",
    };
  }

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{title}</span>
          <button className={styles.btnMejorXI} onClick={onMejorXI}>Mejor XI</button>
          <button className={styles.drawerClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {drawer.currentPlayer && (
          <div className={styles.drawerCurrent}>
            <div className={styles.drawerCurrentLabel}>Jugador actual</div>
            <div className={styles.drawerCurrentPlayer}>
              <div className={styles.drawerCurrentInfo}>
                <div className={styles.drawerCurrentNombre}>{drawer.currentPlayer.nombre}</div>
                <div className={styles.drawerCurrentMeta}>
                  {drawer.currentPlayer.posicion ?? "–"} · {drawer.currentPlayer.club ?? "–"}
                </div>
              </div>
              <span className={styles.scoreTag}>{Math.round(drawer.currentPlayer.score)}</span>
            </div>
          </div>
        )}

        <div className={styles.drawerListLabel}>Selecciona jugador</div>

        <div className={styles.drawerList}>
          {filtered.length === 0 ? (
            <p className={styles.drawerEmpty}>Sin jugadores para esta posición</p>
          ) : (
            filtered.map((j) => {
              const taken = assigned.has(j.id) && j.id !== drawer.currentPlayer?.id;
              const preview = hovered === j.id ? previewText(j) : { text: "", dir: null };
              return (
                <div key={j.id}>
                  <div
                    className={`${styles.drawerItem} ${taken ? styles.drawerItemDisabled : ""}`}
                    onClick={() => !taken && onSelect(j)}
                    onMouseEnter={() => setHovered(j.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className={styles.drawerItemInfo}>
                      <div className={styles.drawerItemNombre}>{j.nombre}</div>
                      <div className={styles.drawerItemMeta}>
                        {j.posicion ?? "–"} · {j.club ?? "–"}{j.edad ? ` · ${j.edad}a` : ""}
                      </div>
                    </div>
                    <div className={styles.drawerItemRight}>
                      <div className={styles.drawerMiniBar}>
                        <div
                          className={styles.drawerMiniBarFill}
                          style={{ width: `${j.score}%`, background: scoreColor(j.score) }}
                        />
                      </div>
                      <span className={styles.drawerItemScore}>{Math.round(j.score)}</span>
                    </div>
                  </div>
                  {preview.text && (
                    <div className={`${styles.drawerPreview} ${preview.dir === "up" ? styles.drawerPreviewUp : styles.drawerPreviewDown}`}>
                      {preview.text}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ZERO_RATING: ZoneRating = { defensa: 0, mediocampo: 0, ataque: 0, overall: 0 };
const ZERO_PULSE:  PulseMap   = {};

export default function AlineacionesPage() {
  const [matchIdx,       setMatchIdx]       = useState(0);
  const [formLocal,      setFormLocal]      = useState("4-3-3");
  const [formVisitante,  setFormVisitante]  = useState("4-3-3");
  const [jugadoresLocal, setJugadoresLocal] = useState<JugadorAlineacion[]>([]);
  const [jugadoresVis,   setJugadoresVis]   = useState<JugadorAlineacion[]>([]);
  const [assignLocal,    setAssignLocal]    = useState<Record<string, JugadorAlineacion>>({});
  const [assignVis,      setAssignVis]      = useState<Record<string, JugadorAlineacion>>({});
  const [ratingLocal,    setRatingLocal]    = useState<ZoneRating>(ZERO_RATING);
  const [ratingVis,      setRatingVis]      = useState<ZoneRating>(ZERO_RATING);
  const [pulseLocal,     setPulseLocal]     = useState<PulseMap>(ZERO_PULSE);
  const [pulseVis,       setPulseVis]       = useState<PulseMap>(ZERO_PULSE);
  const [drawer,         setDrawer]         = useState<DrawerState | null>(null);
  const [tooltip,        setTooltip]        = useState<TooltipState | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [noDataLocal,    setNoDataLocal]    = useState(false);
  const [noDataVis,      setNoDataVis]      = useState(false);

  const prevRatingLocal = useRef<ZoneRating>(ZERO_RATING);
  const prevRatingVis   = useRef<ZoneRating>(ZERO_RATING);
  const pitchRef        = useRef<HTMLDivElement>(null);

  const match = PARTIDOS[matchIdx];

  const slotsLocal = makeSlots(formLocal,    "local");
  const slotsVis   = makeSlots(formVisitante,"visitante");

  function applyRatingUpdate(
    xi: Record<string, JugadorAlineacion>,
    prev: React.MutableRefObject<ZoneRating>,
    setRating: (r: ZoneRating) => void,
    setPulse: (p: PulseMap) => void,
  ) {
    const next = computeZoneRatings(xi);
    const pulse: PulseMap = {};
    (["defensa", "mediocampo", "ataque"] as const).forEach(z => {
      const d = next[z] - prev.current[z];
      if (Math.abs(d) >= 1) pulse[z] = d > 0 ? "up" : "down";
    });
    prev.current = next;
    setRating(next);
    if (Object.keys(pulse).length > 0) {
      setPulse(pulse);
      setTimeout(() => setPulse({}), 700);
    }
  }

  // load squads and auto-fill on match change
  useEffect(() => {
    setDrawer(null);
    setTooltip(null);
    setLoading(true);
    Promise.all([
      getJugadoresAlineacion(match.local.codigo).catch(() => [] as JugadorAlineacion[]),
      getJugadoresAlineacion(match.visitante.codigo).catch(() => [] as JugadorAlineacion[]),
    ]).then(([jl, jv]) => {
      setJugadoresLocal(jl);
      setJugadoresVis(jv);
      setNoDataLocal(jl.length === 0);
      setNoDataVis(jv.length === 0);
      const xlSlots = makeSlots(formLocal,     "local");
      const xvSlots = makeSlots(formVisitante, "visitante");
      const xl = autoFillXI(jl, xlSlots);
      const xv = autoFillXI(jv, xvSlots);
      setAssignLocal(xl);
      setAssignVis(xv);
      prevRatingLocal.current = ZERO_RATING;
      prevRatingVis.current   = ZERO_RATING;
      applyRatingUpdate(xl, prevRatingLocal, setRatingLocal, setPulseLocal);
      applyRatingUpdate(xv, prevRatingVis,   setRatingVis,   setPulseVis);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchIdx]);

  // re-auto-fill when formation changes
  useEffect(() => {
    if (!jugadoresLocal.length) return;
    const slots = makeSlots(formLocal, "local");
    const xl = autoFillXI(jugadoresLocal, slots);
    setAssignLocal(xl);
    applyRatingUpdate(xl, prevRatingLocal, setRatingLocal, setPulseLocal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formLocal]);

  useEffect(() => {
    if (!jugadoresVis.length) return;
    const slots = makeSlots(formVisitante, "visitante");
    const xv = autoFillXI(jugadoresVis, slots);
    setAssignVis(xv);
    applyRatingUpdate(xv, prevRatingVis, setRatingVis, setPulseVis);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formVisitante]);

  const handleSlotClick = useCallback((side: Side, slot: Slot) => {
    const currentPlayer = side === "local" ? assignLocal[slot.id] ?? null : assignVis[slot.id] ?? null;
    setDrawer({ side, slotId: slot.id, posType: slot.posType, currentPlayer });
    setTooltip(null);
  }, [assignLocal, assignVis]);

  const handleSelectPlayer = useCallback((j: JugadorAlineacion) => {
    if (!drawer) return;
    if (drawer.side === "local") {
      const next = { ...assignLocal, [drawer.slotId]: j };
      setAssignLocal(next);
      applyRatingUpdate(next, prevRatingLocal, setRatingLocal, setPulseLocal);
    } else {
      const next = { ...assignVis, [drawer.slotId]: j };
      setAssignVis(next);
      applyRatingUpdate(next, prevRatingVis, setRatingVis, setPulseVis);
    }
    setDrawer(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer, assignLocal, assignVis]);

  const handleMejorXI = useCallback(() => {
    if (!drawer) return;
    if (drawer.side === "local") {
      const slots = makeSlots(formLocal, "local");
      const xl = autoFillXI(jugadoresLocal, slots);
      setAssignLocal(xl);
      applyRatingUpdate(xl, prevRatingLocal, setRatingLocal, setPulseLocal);
    } else {
      const slots = makeSlots(formVisitante, "visitante");
      const xv = autoFillXI(jugadoresVis, slots);
      setAssignVis(xv);
      applyRatingUpdate(xv, prevRatingVis, setRatingVis, setPulseVis);
    }
    setDrawer(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer, formLocal, formVisitante, jugadoresLocal, jugadoresVis]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pitchRef.current || tooltip) return;
    const rect = pitchRef.current.getBoundingClientRect();
    setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  }, [tooltip]);

  const showTooltip = useCallback((e: React.MouseEvent, player: JugadorAlineacion) => {
    if (!pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    setTooltip({ player, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  const assignedLocalIds = new Set(Object.values(assignLocal).map(j => j.id));
  const assignedVisIds   = new Set(Object.values(assignVis).map(j => j.id));

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Simulador de Alineaciones</h1>
          <div className={styles.controlsRow}>
            <div className={styles.matchSelectWrap}>
              <select
                className={styles.matchSelect}
                value={matchIdx}
                onChange={(e) => setMatchIdx(Number(e.target.value))}
              >
                {PARTIDOS.map((p, i) => (
                  <option key={p.id} value={i}>
                    Grupo {p.grupo} - {p.fecha} · {p.local.nombre} vs {p.visitante.nombre}
                  </option>
                ))}
              </select>
              <span className={styles.matchSelectChevron}>▾</span>
            </div>

            <div className={styles.formationsGroup}>
              <div className={styles.formationRow}>
                <span className={`${styles.formationDot} ${styles.dotLocal}`} />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", minWidth: 80 }}>
                  {match.local.nombre}
                </span>
                <select className={styles.formationSelect} value={formLocal}
                  onChange={(e) => setFormLocal(e.target.value)}>
                  {FORMATION_OPTIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className={styles.formationRow}>
                <span className={`${styles.formationDot} ${styles.dotVisitante}`} />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", minWidth: 80 }}>
                  {match.visitante.nombre}
                </span>
                <select className={styles.formationSelect} value={formVisitante}
                  onChange={(e) => setFormVisitante(e.target.value)}>
                  {FORMATION_OPTIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="container">
        <div className={styles.pitchLayout}>
          {/* Left rating panel */}
          <RatingPanel
            teamName={match.local.nombre}
            rating={ratingLocal}
            pulse={pulseLocal}
          />

          {/* Pitch */}
          <div
            ref={pitchRef}
            className={styles.pitchWrapper}
            onMouseMove={handleMouseMove}
          >
            <svg
              viewBox="0 0 800 520"
              className={styles.pitchSvg}
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Cancha de fútbol"
            >
              <PitchLines />

              {slotsLocal.map(slot => (
                <PlayerCircle
                  key={slot.id}
                  slot={slot}
                  player={assignLocal[slot.id] ?? null}
                  isHome={true}
                  isSelected={drawer?.slotId === slot.id}
                  onClick={() => handleSlotClick("local", slot)}
                  onMouseEnter={showTooltip}
                  onMouseLeave={hideTooltip}
                />
              ))}

              {slotsVis.map(slot => (
                <PlayerCircle
                  key={slot.id}
                  slot={slot}
                  player={assignVis[slot.id] ?? null}
                  isHome={false}
                  isSelected={drawer?.slotId === slot.id}
                  onClick={() => handleSlotClick("visitante", slot)}
                  onMouseEnter={showTooltip}
                  onMouseLeave={hideTooltip}
                />
              ))}

              {loading && (
                <rect x={0} y={0} width={800} height={520} fill="rgba(0,0,0,0.4)" />
              )}
            </svg>

            {tooltip && (
              <div
                className={styles.tooltip}
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <div className={styles.tooltipName}>{tooltip.player.nombre}</div>
                <div className={styles.tooltipMeta}>
                  {tooltip.player.posicion ?? "–"} · {tooltip.player.club ?? "–"}
                </div>
                {tooltip.player.edad && (
                  <div className={styles.tooltipMeta}>{tooltip.player.edad} años · {formatValor(tooltip.player.valor_mercado_eur)}</div>
                )}
                <div className={styles.tooltipScoreRow}>
                  <div className={styles.tooltipScoreTrack}>
                    <div
                      className={styles.tooltipScoreFill}
                      style={{ width: `${tooltip.player.score}%`, background: scoreColor(tooltip.player.score) }}
                    />
                  </div>
                  <span className={styles.tooltipScoreNum}>{Math.round(tooltip.player.score)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right rating panel */}
          <RatingPanel
            teamName={match.visitante.nombre}
            rating={ratingVis}
            pulse={pulseVis}
            isVisitante
          />
        </div>

        {/* Mobile ratings */}
        <div className={styles.mobileRatings}>
          <RatingPanel teamName={match.local.nombre}     rating={ratingLocal} pulse={pulseLocal} />
          <RatingPanel teamName={match.visitante.nombre} rating={ratingVis}   pulse={pulseVis}   isVisitante />
        </div>

        {/* No-data notices */}
        {!loading && (noDataLocal || noDataVis) && (
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            {noDataLocal && (
              <div style={{
                flex: 1, minWidth: 220, background: "rgba(10,22,40,0.06)",
                border: "1px solid rgba(10,22,40,0.12)", borderRadius: 8,
                padding: "10px 14px", fontSize: "0.8rem", color: "#4B5563",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: "1rem" }}>ℹ️</span>
                <span><strong>{match.local.nombre}:</strong> No hay datos de jugadores disponibles para esta selección</span>
              </div>
            )}
            {noDataVis && (
              <div style={{
                flex: 1, minWidth: 220, background: "rgba(10,22,40,0.06)",
                border: "1px solid rgba(10,22,40,0.12)", borderRadius: 8,
                padding: "10px 14px", fontSize: "0.8rem", color: "#4B5563",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: "1rem" }}>ℹ️</span>
                <span><strong>{match.visitante.nombre}:</strong> No hay datos de jugadores disponibles para esta selección</span>
              </div>
            )}
          </div>
        )}

        {/* Simular button */}
        <div className={styles.simularWrap}>
          <Link
            href={`/simulador/partidos?local=${match.local.codigo}&visitante=${match.visitante.codigo}`}
            className={styles.btnSimular}
          >
            Simular partido
          </Link>
        </div>
      </div>

      {/* ── Drawer ── */}
      {drawer && (
        <PlayerDrawer
          drawer={drawer}
          jugadores={drawer.side === "local" ? jugadoresLocal : jugadoresVis}
          assigned={drawer.side === "local" ? assignedLocalIds : assignedVisIds}
          xi={drawer.side === "local" ? assignLocal : assignVis}
          onSelect={handleSelectPlayer}
          onMejorXI={handleMejorXI}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
