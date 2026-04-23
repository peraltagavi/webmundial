-- Mundial 2026 — esquema principal
-- Actualizado para coincidir con los archivos de datos reales

-- ─── Selecciones (ranking FIFA abril 2026) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS selecciones (
    id                  SERIAL          PRIMARY KEY,
    nombre              VARCHAR(100)    NOT NULL,
    codigo_fifa         VARCHAR(3)      UNIQUE NOT NULL,  -- código FIFA (no siempre ISO-3166)
    confederacion       VARCHAR(20),
    ranking_fifa        INTEGER,
    puntos_fifa         NUMERIC(8, 2),
    puntos_fifa_ant     NUMERIC(8, 2),                   -- puntos en ranking anterior
    posicion_anterior   INTEGER                          -- posición en ranking anterior
);

-- ─── Partidos históricos (matches.csv — Mundiales masc. y fem. 1930-2022) ────
-- No lleva FK a selecciones: incluye equipos históricos (Yugoslavia, URSS, etc.)
-- que ya no existen en el ranking FIFA actual.
CREATE TABLE IF NOT EXISTS partidos_historicos (
    id                          SERIAL          PRIMARY KEY,
    key_id                      INTEGER         UNIQUE NOT NULL,   -- clave original del CSV
    tournament_id               VARCHAR(20),
    tournament_name             VARCHAR(100),
    genero                      VARCHAR(10)     NOT NULL,          -- 'masculino' | 'femenino'
    match_id                    VARCHAR(20),
    match_name                  VARCHAR(200),
    stage_name                  VARCHAR(50),
    group_name                  VARCHAR(20),
    group_stage                 BOOLEAN,
    knockout_stage              BOOLEAN,
    replayed                    BOOLEAN,
    replay                      BOOLEAN,
    match_date                  DATE,
    match_time                  TIME,
    stadium_name                VARCHAR(150),
    city_name                   VARCHAR(100),
    country_name                VARCHAR(100),
    home_team_code              VARCHAR(3)      NOT NULL,
    home_team_name              VARCHAR(100),
    away_team_code              VARCHAR(3)      NOT NULL,
    away_team_name              VARCHAR(100),
    home_team_score             SMALLINT,
    away_team_score             SMALLINT,
    home_team_score_margin      SMALLINT,
    away_team_score_margin      SMALLINT,
    extra_time                  BOOLEAN,
    penalty_shootout            BOOLEAN,
    home_team_score_penalties   SMALLINT,
    away_team_score_penalties   SMALLINT,
    result                      VARCHAR(30),
    home_team_win               BOOLEAN,
    away_team_win               BOOLEAN,
    draw                        BOOLEAN
);

-- ─── Jugadores (jugadores.csv — plantillas actuales 48 selecciones WC 2026) ──
CREATE TABLE IF NOT EXISTS jugadores (
    id                  SERIAL          PRIMARY KEY,
    seleccion_codigo    VARCHAR(3)      REFERENCES selecciones(codigo_fifa),
    seleccion_nombre    VARCHAR(100),
    numero_camiseta     SMALLINT,
    posicion            VARCHAR(50),
    nombre              VARCHAR(150)    NOT NULL,
    fecha_nacimiento    DATE,
    estatura_cm         SMALLINT,
    pie_dominante       VARCHAR(15),
    club                VARCHAR(100),
    liga                VARCHAR(100),
    internacionalidades INTEGER,
    goles_seleccion     INTEGER,
    valor_mercado_eur   NUMERIC(14, 2)
);

-- ─── Partidos simulados (generados por el simulador de la app) ───────────────
CREATE TABLE IF NOT EXISTS partidos_simulados (
    id                      SERIAL          PRIMARY KEY,
    fase                    VARCHAR(50),
    grupo                   VARCHAR(5),
    fecha_simulacion        TIMESTAMPTZ     DEFAULT NOW(),
    equipo_local_codigo     VARCHAR(3)      REFERENCES selecciones(codigo_fifa),
    equipo_visitante_codigo VARCHAR(3)      REFERENCES selecciones(codigo_fifa),
    goles_local             SMALLINT,
    goles_visitante         SMALLINT,
    penales_local           SMALLINT,
    penales_visitante       SMALLINT,
    prob_local              NUMERIC(5, 3),
    prob_empate             NUMERIC(5, 3),
    prob_visitante          NUMERIC(5, 3)
);

-- ─── Quinielas y duelos ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quinielas (
    id              SERIAL          PRIMARY KEY,
    codigo_publico  VARCHAR(12)     UNIQUE NOT NULL,
    nombre_usuario  VARCHAR(100),
    predicciones    JSONB           DEFAULT '{}',
    puntos          INTEGER         DEFAULT 0,
    es_publica      BOOLEAN         DEFAULT TRUE,
    creado_en       TIMESTAMPTZ     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS duelos (
    id                      SERIAL          PRIMARY KEY,
    codigo_sala             VARCHAR(8)      UNIQUE NOT NULL,
    quiniela_retador_id     INTEGER         REFERENCES quinielas(id),
    quiniela_rival_id       INTEGER         REFERENCES quinielas(id),
    activo                  BOOLEAN         DEFAULT TRUE
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hist_tournament      ON partidos_historicos(tournament_id);
CREATE INDEX IF NOT EXISTS idx_hist_home_code       ON partidos_historicos(home_team_code);
CREATE INDEX IF NOT EXISTS idx_hist_away_code       ON partidos_historicos(away_team_code);
CREATE INDEX IF NOT EXISTS idx_hist_date            ON partidos_historicos(match_date);
CREATE INDEX IF NOT EXISTS idx_hist_genero          ON partidos_historicos(genero);
CREATE INDEX IF NOT EXISTS idx_jugadores_seleccion  ON jugadores(seleccion_codigo);
CREATE INDEX IF NOT EXISTS idx_quinielas_codigo     ON quinielas(codigo_publico);
