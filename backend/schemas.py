from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── CLIENTES ─────────────────────────────────────────────────────────────────

class ClienteBase(BaseModel):
    nombre: str
    tipo: str = "Particular"
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None


class ClienteOut(ClienteBase):
    id: int
    codigo: str
    created_at: datetime
    total_pedidos: Optional[int] = 0
    total_monto: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ─── PEDIDOS ──────────────────────────────────────────────────────────────────

class PedidoBase(BaseModel):
    cliente_id: int
    tipo_cortina: str
    cantidad: int = Field(gt=0)
    precio_unitario: float = Field(gt=0)
    temporada: str = "Verano"
    notas: Optional[str] = None


class PedidoCreate(PedidoBase):
    pass


class PedidoUpdate(BaseModel):
    tipo_cortina: Optional[str] = None
    cantidad: Optional[int] = None
    precio_unitario: Optional[float] = None
    temporada: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None
    fecha_entrega: Optional[datetime] = None


class PedidoOut(BaseModel):
    id: int
    codigo: str
    cliente_id: int
    cliente_nombre: Optional[str] = None
    tipo_cortina: str
    cantidad: int
    precio_unitario: float
    total: float
    temporada: str
    estado: str
    fecha_pedido: datetime
    fecha_entrega: Optional[datetime] = None
    notas: Optional[str] = None

    class Config:
        from_attributes = True


# ─── MATERIALES ───────────────────────────────────────────────────────────────

class MaterialBase(BaseModel):
    nombre: str
    stock_actual: float = 0
    stock_minimo: float = 0
    unidad: str = "metros"
    precio_unitario: float = 0
    proveedor: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    nombre: Optional[str] = None
    stock_actual: Optional[float] = None
    stock_minimo: Optional[float] = None
    unidad: Optional[str] = None
    precio_unitario: Optional[float] = None
    proveedor: Optional[str] = None


class MaterialOut(MaterialBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    stock_critico: Optional[bool] = False

    class Config:
        from_attributes = True


# ─── PRODUCCIÓN ───────────────────────────────────────────────────────────────

class ProduccionUpdate(BaseModel):
    estado: Optional[str] = None
    operario: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_fin: Optional[datetime] = None


class ProduccionOut(BaseModel):
    id: int
    pedido_id: int
    pedido_codigo: Optional[str] = None
    cliente_nombre: Optional[str] = None
    tipo_cortina: Optional[str] = None
    cantidad: Optional[int] = None
    estado: str
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    operario: Optional[str] = None
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


# ─── QUEJAS ───────────────────────────────────────────────────────────────────

class QuejaBase(BaseModel):
    cliente_id: Optional[int] = None
    descripcion: str
    tipo: str = "Otro"


class QuejaCreate(QuejaBase):
    pass


class QuejaUpdate(BaseModel):
    estado: Optional[str] = None
    resolucion: Optional[str] = None
    tipo: Optional[str] = None


class QuejaOut(QuejaBase):
    id: int
    estado: str
    resolucion: Optional[str] = None
    cliente_nombre: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── DASHBOARD ────────────────────────────────────────────────────────────────

class KPIDashboard(BaseModel):
    ventas_mes: int
    en_produccion: int
    stock_critico: int
    clientes_activos: int
    monto_mes: float


class PuntoVentaChart(BaseModel):
    mes: str
    ventas: int
    prediccion: Optional[int] = None


class PuntoProduccionChart(BaseModel):
    semana: str
    proceso: int
    entregado: int


class PuntoInventarioChart(BaseModel):
    material: str
    stock: float
    min: float


# ─── PREDICCIÓN ───────────────────────────────────────────────────────────────

class PrediccionOut(BaseModel):
    mes: str
    mes_numero: int
    anio: int
    prediccion: int
    limite_inferior: int
    limite_superior: int
    confianza: float


class PrediccionRequest(BaseModel):
    meses_adelante: int = Field(default=3, ge=1, le=12)


# ─── REPORTES ─────────────────────────────────────────────────────────────────

class ReporteVentas(BaseModel):
    periodo: str
    total_pedidos: int
    total_monto: float
    por_tipo: dict
    por_temporada: dict
    por_estado: dict


class ReporteProduccion(BaseModel):
    periodo: str
    total_en_proceso: int
    total_entregados: int
    tiempo_promedio_dias: Optional[float] = None


class ReporteQuejas(BaseModel):
    total: int
    abiertas: int
    resueltas: int
    en_revision: int
    por_tipo: dict
