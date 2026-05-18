"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import ComparadorSection from "./components/ComparadorSection";
import SimuladorPartidosSection from "./components/SimuladorPartidosSection";
import TorneoSection from "./components/TorneoSection";
import AlineacionesSection from "./components/AlineacionesSection";

const SECTIONS = [
  { id: "comparador",         label: "Comparador" },
  { id: "simulador-partidos", label: "Simulador" },
  { id: "torneo",             label: "Torneo" },
  { id: "alineaciones",       label: "Alineaciones" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function SimuladorPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("comparador");
  const [presetA, setPresetA] = useState<string | undefined>();
  const [presetB, setPresetB] = useState<string | undefined>();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id as SectionId);
        }
      }
    };
    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0,
    });
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }
    return () => observerRef.current?.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSimularPartido(codigoA: string, codigoB: string) {
    setPresetA(codigoA);
    setPresetB(codigoB);
    setTimeout(() => {
      document.getElementById("simulador-partidos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <>
      {/* Sticky mini-navbar */}
      <nav className={styles.miniNav} aria-label="Secciones del simulador">
        <div className={`container ${styles.miniNavInner}`}>
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.miniNavLink} ${activeSection === id ? styles.miniNavLinkActive : ""}`}
              onClick={() => scrollTo(id)}
              aria-current={activeSection === id ? "true" : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Section 1 — Comparador */}
      <section id="comparador" className={styles.sectionWrap}>
        <div className="container">
          <ComparadorSection onSimularPartido={handleSimularPartido} />
        </div>
      </section>

      {/* Divider */}
      <div className={styles.sectionDivider} aria-hidden>
        <span className={styles.sectionDividerTitle}>Simulador de Partidos</span>
      </div>

      {/* Section 2 — Simulador de Partidos */}
      <section id="simulador-partidos">
        <SimuladorPartidosSection presetEquipoA={presetA} presetEquipoB={presetB} />
      </section>

      {/* Divider */}
      <div className={styles.sectionDivider} aria-hidden>
        <span className={styles.sectionDividerTitle}>Simulador del Torneo</span>
      </div>

      {/* Section 3 — Torneo */}
      <section id="torneo">
        <TorneoSection />
      </section>

      {/* Divider */}
      <div className={styles.sectionDivider} aria-hidden>
        <span className={styles.sectionDividerTitle}>Alineaciones</span>
      </div>

      {/* Section 4 — Alineaciones */}
      <section id="alineaciones">
        <AlineacionesSection />
      </section>
    </>
  );
}
