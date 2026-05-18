import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/simulador/comparador", destination: "/simulador#comparador", permanent: false },
      { source: "/simulador/partidos",   destination: "/simulador#simulador-partidos", permanent: false },
      { source: "/simulador/torneo",     destination: "/simulador#torneo", permanent: false },
      { source: "/simulador/alineaciones", destination: "/simulador#alineaciones", permanent: false },
      { source: "/quiniela/trivia",      destination: "/quiniela#trivia", permanent: false },
    ];
  },
};

export default nextConfig;
