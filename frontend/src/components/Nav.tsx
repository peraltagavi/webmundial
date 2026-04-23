"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";

const links = [
  { href: "/simulador",            label: "Simulador",   exact: true },
  { href: "/simulador/comparador", label: "Comparador" },
  { href: "/simulador/partidos",   label: "Partidos" },
  { href: "/simulador/torneo",        label: "Torneo" },
  { href: "/simulador/alineaciones",  label: "Alineaciones" },
  { href: "/quiniela",             label: "Quiniela" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      <div className={styles.topBar} aria-hidden />
      <header className={styles.nav}>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.logo} aria-label="ElSimulador — inicio">
            <span className={styles.logoEl}>El</span>
            <span className={styles.logoSim}>Simulador</span>
            <span className={styles.logoDot} aria-hidden />
          </Link>

          <nav aria-label="Navegación principal">
            <ul className={styles.links} role="list">
              {links.map((l) => {
                const isActive = l.exact
                  ? pathname === l.href
                  : pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
