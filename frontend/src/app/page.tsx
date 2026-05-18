import Link from "next/link";
import styles from "./page.module.css";

const STATS = [
  { value: "1,248", label: "Partidos históricos" },
  { value: "48",    label: "Selecciones" },
  { value: "22",    label: "Mundiales analizados" },
  { value: "1,275", label: "Jugadores del Mundial 2026" },
];

const SIM_FEATURES = [
  "Comparador histórico",
  "Simulador de partidos",
  "Torneo completo",
  "Alineaciones",
];

const QUI_FEATURES = [
  "Quiniela fase de grupos",
  "Tabla de líderes en vivo",
  "Trivia histórica",
];

const FLAGS = [
  "🇲🇽","🇧🇷","🇦🇷","🇫🇷","🇩🇪","🇪🇸","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇵🇹","🇳🇱","🇺🇾","🇭🇷","🇨🇴",
  "🇨🇭","🇸🇳","🇲🇦","🇺🇸","🇯🇵","🇦🇺","🇪🇨","🇧🇪","🇸🇪","🇨🇦","🇬🇭","🇹🇷",
  "🇸🇦","🇮🇷","🇵🇾","🇰🇷","🇵🇱","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇩🇰","🇪🇬","🇳🇬","🇹🇳","🇩🇿","🇨🇲",
  "🇨🇮","🇨🇷","🇵🇦","🇦🇹","🇧🇴","🇭🇳","🇯🇲","🇯🇴","🇺🇿","🇨🇼","🇨🇻","🇭🇹","🇧🇦","🇶🇦","🇮🇶","🇳🇿",
];

export default function HomePage() {
  return (
    <section className={styles.hero}>
      {/* Decorative 2026 background */}
      <div className={styles.bg2026} aria-hidden>2026</div>

      <div className={`container ${styles.inner}`}>

        {/* Badge */}
        <div className={styles.badgeWrap}>
          <span className={styles.badge}>
            COPA MUNDIAL FIFA · ESTADOS UNIDOS, CANADÁ Y MÉXICO · 2026
          </span>
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          <span className={styles.headlineWhite}>El Mundial</span>
          <span className={styles.headlineRed}>en tus manos.</span>
        </h1>

        {/* Subtitle */}
        <p className={styles.sub}>
          Simula partidos, arma tu quiniela y predice al campeón con datos reales de 22 mundiales.
        </p>

        {/* CTA Cards */}
        <div className={styles.cards}>

          {/* Card 1 — Simulador */}
          <Link href="/simulador" className={styles.cardSim}>
            <span className={styles.cardNum} aria-hidden>01</span>
            <svg className={styles.cardIcon} width="40" height="28" viewBox="0 0 40 28" fill="none" aria-hidden>
              <rect x="1.5" y="1.5" width="37" height="25" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="20" y1="1.5" x2="20" y2="26.5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="20" cy="14" r="4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <h2 className={styles.cardTitle}>Simulador</h2>
            <p className={styles.cardDesc}>
              Compara selecciones, predice partidos y simula el torneo completo con probabilidades reales.
            </p>
            <ul className={styles.featureList}>
              {SIM_FEATURES.map((f) => (
                <li key={f} className={styles.featureItem}>
                  <span className={styles.checkRed} aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className={styles.btnSim}>ENTRAR AL SIMULADOR →</div>
          </Link>

          {/* Card 2 — Quiniela */}
          <Link href="/quiniela" className={styles.cardQui}>
            <span className={styles.cardNumWhite} aria-hidden>02</span>
            <svg className={styles.cardIconWhite} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
              <path d="M12 6h16v14a8 8 0 01-16 0V6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 10H7a5 5 0 005 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M28 10h5a5 5 0 01-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="20" y1="28" x2="20" y2="33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="13" y1="33" x2="27" y2="33" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h2 className={styles.cardTitleWhite}>Quiniela</h2>
            <p className={styles.cardDescWhite}>
              Registra tus predicciones, compite contra todos y demuestra que sabes de fútbol.
            </p>
            <ul className={styles.featureListWhite}>
              {QUI_FEATURES.map((f) => (
                <li key={f} className={styles.featureItem}>
                  <span className={styles.checkWhite} aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className={styles.btnQui}>ENTRAR A LA QUINIELA →</div>
          </Link>

        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Flags ticker */}
      <div className={styles.ticker} aria-hidden>
        <div className={styles.tickerInner}>
          {[...FLAGS, ...FLAGS].map((f, i) => (
            <span key={i} className={styles.flag}>{f}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
