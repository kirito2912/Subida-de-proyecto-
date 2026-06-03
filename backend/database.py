import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos.
# Usa DATABASE_URL del entorno (PostgreSQL en Render) o SQLite local
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cortinasys.db")

# Render devuelve postgres:// pero SQLAlchemy necesita postgresql://
# Esto corrige el esquema de la URL de conexión si es necesario
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Argumentos de conexión específicos. Para SQLite, deshabilitamos la verificación de subprocesos
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Crear el motor de la base de datos con la URL configurada
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Crear una fábrica de sesiones local. Las transacciones no se confirman automáticamente (autocommit=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base declarativa para que los modelos hereden de ella
Base = declarative_base()


def get_db():
    """
    Función generadora (Dependency Injection) para obtener la sesión de la base de datos.
    Asegura que cada solicitud web tenga su propia sesión y que esta se cierre
    correctamente al finalizar la operación o si ocurre una excepción.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

