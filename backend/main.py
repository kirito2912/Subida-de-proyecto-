"""
CortinaSys Backend — FastAPI
Deployable en Render (backend) + Vercel (frontend)

Para desconectar del frontend: cambia VITE_API_URL en el .env del front
a http://localhost:8000 para desarrollo local.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import clientes, ventas, inventario, produccion, prediccion, reportes, quejas, dashboard

# ─── Crear tablas ──────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CortinaSys API",
    description="Backend del Sistema de Predicción de Ventas de Cortinas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Agrega aquí el dominio de Vercel una vez que lo tengas
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:4173,http://localhost:8080,http://127.0.0.1:8080",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todos los orígenes para facilitar el despliegue inicial
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(dashboard.router)
app.include_router(clientes.router)
app.include_router(ventas.router)
app.include_router(inventario.router)
app.include_router(produccion.router)
app.include_router(prediccion.router)
app.include_router(reportes.router)
app.include_router(quejas.router)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    """
    Ruta raíz de la API.
    Retorna un JSON con el estado básico y el nombre/versión del sistema.
    """
    return {"status": "ok", "app": "CortinaSys API v1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    """
    Endpoint para verificación de salud de la aplicación (Health Check).
    Es utilizado por servicios de hosting como Render para verificar si el contenedor responde.
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    # Inicializa el servidor web ASGI uvicorn apuntando a la instancia app en main.py
    # Se ejecuta en el host 0.0.0.0 y puerto 8000 con recarga automática para desarrollo.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
