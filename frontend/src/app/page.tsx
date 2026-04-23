import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import styles from "./page.module.css";

const stats = [
  { value: "1,248", label: "Partidos históricos" },
  { value: "32",    label: "Ediciones del Mundial" },
  { value: "48",    label: "Selecciones WC 2026" },
  { value: "1,275", label: "Jugadores en plantilla" },
];

const simuladorFeatures = [
  "Comparador histórico entre selecciones",
  "Simulador de partidos con tabla de grupos",
  "Simulador del torneo completo",
  "Histórico contrafactual — ¿y si...?",
  "Simulador de alineaciones",
];

const quinielaFeatures = [
  "Crea tu quiniela y compártela",
  "Modo duelo contra otro usuario",
  "Trivia histórica del Mundial",
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className={styles.hero} aria-label="Introducción">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>
            <Badge variant="accent" size="md">Mundial 2026</Badge>
          </div>

          <h1 className={styles.heroHeadline}>
            El simulador<br />
            del <span className={styles.heroAccent}>Mundial</span><br />
            <span className={styles.heroAccent}>2026</span>
          </h1>

          <p className={styles.heroSub}>
            Analiza el historial de cada selección, simula partidos y fases
            completas, y compite en tu quiniela con amigos.
          </p>

          <div className={styles.heroCta}>
            <Button href="/simulador" variant="white" size="lg">
              Abrir simulador
            </Button>
            <Button href="/quiniela" variant="whiteOutline" size="lg">
              Jugar quiniela
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div className={styles.statsStrip} aria-label="Datos del proyecto">
        <div className={`container ${styles.statsInner}`}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Secciones principales ───────────────────────────────── */}
      <section className={styles.sections} aria-label="Secciones">
        <div className="container">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Explora</p>
            <h2 className={styles.sectionTitle}>
              Dos herramientas,<br />una Copa del Mundo
            </h2>
          </div>

          <div className={styles.grid}>
            {/* Simulador */}
            <Link href="/simulador" className={styles.featureCard}>
              <div className={`${styles.cardHeader} ${styles.cardHeaderSimulador}`}>
                <div>
                  <div className={styles.cardIcon} aria-hidden>⚽</div>
                  <h3 className={styles.cardTitle}>Simulador</h3>
                  <p className={styles.cardSub}>
                    Estadísticas, predicciones y simulaciones
                  </p>
                </div>
                <span className={styles.cardNumber} aria-hidden>01</span>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.featureList} role="list">
                  {simuladorFeatures.map((f) => (
                    <li key={f} className={styles.featureItem}>
                      <span className={styles.featureDot} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <span className={styles.cardCta}>
                  Explorar simulador <span aria-hidden>→</span>
                </span>
              </div>
            </Link>

            {/* Quiniela */}
            <Link href="/quiniela" className={styles.featureCard}>
              <div className={`${styles.cardHeader} ${styles.cardHeaderQuiniela}`}>
                <div>
                  <div className={styles.cardIcon} aria-hidden>🏆</div>
                  <h3 className={styles.cardTitle}>Quiniela</h3>
                  <p className={styles.cardSub}>
                    Compite con amigos y demuestra tu conocimiento
                  </p>
                </div>
                <span className={styles.cardNumber} aria-hidden>02</span>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.featureList} role="list">
                  {quinielaFeatures.map((f) => (
                    <li key={f} className={styles.featureItem}>
                      <span className={`${styles.featureDot} ${styles.featureDotNavy}`} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <span className={`${styles.cardCta} ${styles.cardCtaQuiniela}`}>
                  Jugar quiniela <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
