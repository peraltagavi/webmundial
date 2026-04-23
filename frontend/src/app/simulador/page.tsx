import Link from "next/link";

const secciones = [
  { href: "/simulador/comparador",    titulo: "Comparador histórico",     desc: "Goles, partidos y rendimiento por selección" },
  { href: "/simulador/partidos",      titulo: "Simulador de partidos",    desc: "Simula un partido y afecta la tabla de grupos" },
  { href: "/simulador/torneo",        titulo: "Torneo completo",          desc: "Simula el Mundial 2026 de principio a fin" },
  { href: "/simulador/contrafactual", titulo: "Histórico contrafactual",  desc: "¿Qué hubiera pasado si...?" },
  { href: "/simulador/alineaciones",  titulo: "Alineaciones",             desc: "Arma el once ideal de cada selección" },
];

export default function SimuladorPage() {
  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Simulador</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {secciones.map((s) => (
          <Link key={s.href} href={s.href} style={cardStyle}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>{s.titulo}</h2>
            <p style={{ fontSize: "0.875rem", color: "#999" }}>{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "block",
  padding: "1.5rem",
  border: "1px solid #333",
  borderRadius: "10px",
  textDecoration: "none",
  color: "inherit",
};
