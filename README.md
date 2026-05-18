# Mundial 2026

Aplicación web para explorar, simular y predecir el Mundial FIFA 2026 (Estados Unidos, Canadá y México). Incluye simulador de partidos con datos históricos de 22 mundiales, comparador de selecciones, simulador de torneo completo y quiniela interactiva.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Backend | FastAPI + SQLAlchemy async |
| Base de datos | PostgreSQL 16 |
| ORM / migraciones | SQLAlchemy + Alembic |

---

## Requisitos previos

Instala lo siguiente antes de continuar:

- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **Python** ≥ 3.11 — [python.org](https://python.org)
- **PostgreSQL** 16 — con Homebrew: `brew install postgresql@16`

Verifica las versiones:

```bash
node --version   # ≥ 18
python3 --version  # ≥ 3.11
psql --version   # ≥ 16
```

---

## Archivos de datos necesarios

El repositorio **no incluye** los archivos de datos por su tamaño. Debes colocarlos manualmente en `database/` antes de importar:

```
database/
├── matches.csv                  # Partidos históricos de Mundiales 1930–2022
├── jugadores.csv                # Plantillas de jugadores del Mundial 2026
└── ranking_fifa_abril2026.xlsx  # Ranking FIFA oficial (abril 2026)
```

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd mundial-2026
```

### 2. Configurar variables de entorno del backend

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` y ajusta las credenciales de PostgreSQL:

```env
DATABASE_URL=postgresql+asyncpg://usuario:password@localhost:5432/mundial2026
SECRET_KEY=tu-clave-secreta
CORS_ORIGINS=["http://localhost:3000"]
```

### 3. Crear la base de datos

```bash
# Iniciar PostgreSQL si no está corriendo
brew services start postgresql@16

# Crear usuario y base de datos
psql postgres -c "CREATE USER mundial WITH PASSWORD 'mundial2026';"
psql postgres -c "CREATE DATABASE mundial2026 OWNER mundial;"

# Aplicar el esquema
psql postgresql://mundial:mundial2026@localhost:5432/mundial2026 \
  -f database/schema.sql
```

### 4. Importar los datos

Asegúrate de tener los tres archivos en `database/` (ver sección anterior).

```bash
cd database
python3 import_data.py \
  --db-url postgresql://mundial:mundial2026@localhost:5432/mundial2026
cd ..
```

El script carga en orden: ranking FIFA → partidos históricos → jugadores.
La primera ejecución puede tardar 1–2 minutos.

### 5. Instalar dependencias del backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 6. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

---

## Levantar el proyecto

Abre dos terminales:

**Terminal 1 — Backend:**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

---

## URLs

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Documentación API (Swagger) | http://localhost:8000/docs |
| Documentación API (ReDoc) | http://localhost:8000/redoc |

---

## Opción alternativa: Docker Compose

Si prefieres no instalar PostgreSQL localmente, puedes levantar la base de datos con Docker:

```bash
# Solo la base de datos
docker compose up db -d

# O todo el stack (db + backend)
docker compose up -d
```

El frontend siempre se levanta con `npm run dev` fuera de Docker para aprovechar el hot reload.

---

## Estructura del proyecto

```
mundial-2026/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Endpoints FastAPI
│   │   ├── data/            # Constantes (48 selecciones del Mundial 2026)
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── schemas/         # Schemas Pydantic
│   │   └── services/        # Lógica de negocio
│   ├── alembic/             # Migraciones de base de datos
│   ├── scripts/             # Scripts de inicialización (quiniela, trivia)
│   ├── .env.example
│   └── requirements.txt
├── database/
│   ├── schema.sql           # Esquema completo de la DB
│   ├── import_data.py       # Script de importación de datos
│   └── seeds/               # Datos de semilla opcionales
├── frontend/
│   └── src/
│       └── app/             # App Router de Next.js
│           ├── simulador/   # Simulador de partidos y torneo
│           └── quiniela/    # Sistema de quiniela
├── docker-compose.yml
└── README.md
```

---

## Notas

- El backend usa **SQLAlchemy async** con `asyncpg`. La URL de conexión debe usar `postgresql+asyncpg://`, no `postgresql://`.
- El script `import_data.py` usa `psycopg2` (síncrono) para la carga inicial — usa `postgresql://` sin el prefijo `asyncpg`.
- Los 48 equipos del Mundial 2026 están definidos en `backend/app/data/equipos.py`. Si FIFA actualiza el ranking, edita ese archivo y vuelve a importar `ranking_fifa_abril2026.xlsx`.
