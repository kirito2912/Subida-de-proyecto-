# CortinaSys — Backend API

Backend Python/FastAPI para el Sistema de Predicción de Ventas de Cortinas.

## Estructura

```
backend/
├── main.py           ← Entrada principal, CORS, routers
├── database.py       ← Conexión SQLite (local) / PostgreSQL (Render)
├── models.py         ← Tablas ORM (SQLAlchemy)
├── schemas.py        ← Validación de datos (Pydantic)
├── seed.py           ← Datos de ejemplo
├── api.ts            ← Cliente HTTP para el frontend (copiar a src/lib/)
├── routers/
│   ├── dashboard.py  ← KPIs del inicio
│   ├── clientes.py   ← CRUD clientes
│   ├── ventas.py     ← CRUD pedidos + resúmenes
│   ├── inventario.py ← CRUD materiales + stock
│   ├── produccion.py ← Estado de pedidos en fábrica
│   ├── prediccion.py ← Modelo de regresión lineal
│   ├── reportes.py   ← Reportes por período
│   └── quejas.py     ← CRUD quejas/reclamos
├── requirements.txt
├── Procfile          ← Para Render
└── .env.example
```

## Módulos del sistema

| Módulo       | Endpoints principales                                   |
|-------------|----------------------------------------------------------|
| Dashboard   | `GET /dashboard/kpis`                                    |
| Clientes    | `GET/POST /clientes`, `PUT/DELETE /clientes/{id}`        |
| Ventas      | `GET/POST /ventas`, `GET /ventas/resumen-mensual`        |
| Inventario  | `GET/POST /inventario`, `PATCH /inventario/{id}/stock`   |
| Producción  | `GET /produccion`, `PUT /produccion/{id}`                |
| Predicción  | `GET /prediccion?meses_adelante=3`, `GET /prediccion/historico` |
| Reportes    | `GET /reportes/ventas`, `/reportes/produccion`, `/reportes/quejas` |
| Quejas      | `GET/POST /quejas`, `PUT /quejas/{id}`                   |

---

## 🚀 Desarrollo local

```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env          # editar si quieres cambiar algo

# 4. Poblar con datos de ejemplo
python seed.py

# 5. Iniciar servidor
uvicorn main:app --reload --port 8000
```

Documentación interactiva: http://localhost:8000/docs

---

## 🌐 Despliegue en Render

### Backend (Web Service)

1. Sube la carpeta `backend/` a GitHub
2. En [render.com](https://render.com) → **New Web Service**
3. Conecta tu repositorio
   - Si usas este repositorio monorepo, Render aceptará la configuración de `render.yaml` en la raíz.
4. Configura:
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Variables de entorno:
   - `DATABASE_URL` → URL de tu PostgreSQL (Render lo provee si creas una DB)
   - `ALLOWED_ORIGINS` → `https://tu-app.vercel.app`
6. (Opcional) Agrega una **PostgreSQL** database en Render y conecta la URL

### Frontend (Vercel)

1. Sube la carpeta del frontend a GitHub
2. En [vercel.com](https://vercel.com) → **New Project**
3. Variables de entorno:
   - `VITE_API_URL` → URL de tu backend en Render (ej. `https://cortinasys.onrender.com`)
4. Deploy

---

## 🔌 Conectar frontend al backend

1. Copia `api.ts` → `src/lib/api.ts` en tu proyecto frontend
2. Crea `.env` en la raíz del frontend:
   ```
   VITE_API_URL=http://localhost:8000
   ```
3. En tus rutas, reemplaza los datos hardcodeados:

```tsx
// Antes (datos mock)
const clientes = [{ id: "C-001", nombre: "María González", ... }]

// Después (datos reales)
import { clientesApi } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

const { data: clientes } = useQuery({
  queryKey: ["clientes"],
  queryFn: () => clientesApi.listar(),
})
```

### Desconectar del backend (mock)

En `src/lib/api.ts` cambia:
```ts
const USE_MOCK = true  // ← activa datos locales sin backend
```

---

## 📊 Modelo de predicción

Usa **regresión lineal simple** sobre el historial de `ventas_mensuales`:
- Sin dependencias externas (numpy/sklearn) — pure Python
- Devuelve predicción + intervalo de confianza al 95%
- R² incluido para medir calidad del modelo
- Se alimenta automáticamente al crear/actualizar pedidos

---

## 🔄 Migraciones (Alembic)

```bash
# Inicializar (solo primera vez)
alembic init migrations

# Crear migración
alembic revision --autogenerate -m "descripcion"

# Aplicar
alembic upgrade head
```
