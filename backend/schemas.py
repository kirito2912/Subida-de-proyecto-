from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── CLIENTES ─────────────────────────────────────────────────────────────────

class ClienteBase(BaseModel):
    """
    Esquema base para Clientes.
    Contiene la estructura de datos común compartida para operaciones de lectura y escritura.
    """
    nombre: str
    tipo: str = "Particular"
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None


class ClienteCreate(ClienteBase):
    """
    Esquema para la creación de un nuevo Cliente.
    Hereda de ClienteBase sin propiedades adicionales, usado para validación en POST.
    """
    pass


class ClienteUpdate(BaseModel):
    """
    Esquema para la actualización parcial de un Cliente.
    Todos los campos son opcionales, permitiendo modificaciones selectivas (PATCH/PUT).
    """
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None


class ClienteOut(ClienteBase):
    """
    Esquema de salida para Clientes.
    Incluye los metadatos autogenerados por la base de datos y estadísticas calculadas.
    """
    id: int
    codigo: str
    created_at: datetime
    total_pedidos: Optional[int] = 0
    total_monto: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ─── PEDIDOS ──────────────────────────────────────────────────────────────────

class PedidoBase(BaseModel):
    """
    Esquema base para Pedidos.
    Define las propiedades iniciales necesarias para procesar una compra de cortinas.
    """
    cliente_id: int
    tipo_cortina: str
    cantidad: int = Field(gt=0)
    precio_unitario: float = Field(gt=0)
    temporada: str = "Verano"
    notas: Optional[str] = None


class PedidoCreate(PedidoBase):
    """
    Esquema para la creación de un Pedido.
    Valida los datos de entrada cuando un cliente realiza una compra.
    """
    pass


class PedidoUpdate(BaseModel):
    """
    Esquema para actualizar campos de un Pedido existente.
    Permite modificar datos como el tipo de cortina, cantidad, estado o notas.
    """
    tipo_cortina: Optional[str] = None
    cantidad: Optional[int] = None
    precio_unitario: Optional[float] = None
    temporada: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None
    fecha_entrega: Optional[datetime] = None


class PedidoOut(BaseModel):
    """
    Esquema de salida para Pedidos.
    Proporciona los detalles finales de la orden, incluyendo el cálculo del monto total.
    """
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
    """
    Esquema base para los Insumos/Materiales del inventario.
    Conserva la estructura base de control de existencias.
    """
    nombre: str
    stock_actual: float = 0
    stock_minimo: float = 0
    unidad: str = "metros"
    precio_unitario: float = 0
    proveedor: Optional[str] = None


class MaterialCreate(MaterialBase):
    """
    Esquema para dar de alta un nuevo Insumo en el almacén.
    """
    pass


class MaterialUpdate(BaseModel):
    """
    Esquema para actualizar las existencias o propiedades de un material.
    """
    nombre: Optional[str] = None
    stock_actual: Optional[float] = None
    stock_minimo: Optional[float] = None
    unidad: Optional[str] = None
    precio_unitario: Optional[float] = None
    proveedor: Optional[str] = None


class MaterialOut(MaterialBase):
    """
    Esquema de salida que representa un Material.
    Incluye un flag dinámico 'stock_critico' si las existencias caen por debajo del mínimo.
    """
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    stock_critico: Optional[bool] = False

    class Config:
        from_attributes = True


# ─── PRODUCCIÓN ───────────────────────────────────────────────────────────────

class ProduccionUpdate(BaseModel):
    """
    Esquema de entrada para actualizar el progreso o asignación de un pedido en taller.
    """
    estado: Optional[str] = None
    operario: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_fin: Optional[datetime] = None


class ProduccionOut(BaseModel):
    """
    Esquema de salida que detalla el estado actual de ensamble de un Pedido.
    Asocia información del operario, tiempos y detalles del cliente.
    """
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
    """
    Esquema base para la radicación de quejas de clientes.
    """
    cliente_id: Optional[int] = None
    descripcion: str
    tipo: str = "Otro"


class QuejaCreate(QuejaBase):
    """
    Esquema para crear un reporte de incidencia o queja.
    """
    pass


class QuejaUpdate(BaseModel):
    """
    Esquema para registrar el progreso, clasificación o resolución final de una queja.
    """
    estado: Optional[str] = None
    resolucion: Optional[str] = None
    tipo: Optional[str] = None


class QuejaOut(QuejaBase):
    """
    Esquema de salida que detalla una queja con su estado e información del cliente afectado.
    """
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
    """
    Esquema de respuesta para las métricas clave (KPIs) de la pantalla principal.
    Contiene sumatorias de ventas mensuales, estados de inventario y producción.
    """
    ventas_mes: int
    en_produccion: int
    stock_critico: int
    clientes_activos: int
    monto_mes: float


class PuntoVentaChart(BaseModel):
    """
    Representa un punto de datos en un gráfico de ventas temporales.
    Puede incluir predicciones futuras calculadas por el algoritmo.
    """
    mes: str
    ventas: int
    prediccion: Optional[int] = None


class PuntoProduccionChart(BaseModel):
    """
    Representa el volumen de órdenes en producción en una semana específica,
    dividido por estado.
    """
    semana: str
    proceso: int
    entregado: int


class PuntoInventarioChart(BaseModel):
    """
    Representa el estado de stock comparativo para visualización gráfica en inventarios.
    """
    material: str
    stock: float
    min: float


# ─── PREDICCIÓN ───────────────────────────────────────────────────────────────

class PrediccionOut(BaseModel):
    """
    Estructura de respuesta con las estimaciones estadísticas de demanda
    para un mes específico, incluyendo intervalos de confianza.
    """
    mes: str
    mes_numero: int
    anio: int
    prediccion: int
    limite_inferior: int
    limite_superior: int
    confianza: float


class PrediccionRequest(BaseModel):
    """
    Esquema de entrada para solicitar proyecciones de ventas en meses venideros.
    """
    meses_adelante: int = Field(default=3, ge=1, le=12)


# ─── REPORTES ─────────────────────────────────────────────────────────────────

class ReporteVentas(BaseModel):
    """
    Estructura resumida para informes ejecutivos de ventas sobre un periodo definido.
    """
    periodo: str
    total_pedidos: int
    total_monto: float
    por_tipo: dict
    por_temporada: dict
    por_estado: dict


class ReporteProduccion(BaseModel):
    """
    Estructura analítica sobre el rendimiento y capacidad del taller de cortinas.
    """
    periodo: str
    total_en_proceso: int
    total_entregados: int
    tiempo_promedio_dias: Optional[float] = None


class ReporteQuejas(BaseModel):
    """
    Métricas de incidencias y satisfacción para control de calidad.
    """
    total: int
    abiertas: int
    resueltas: int
    en_revision: int
    por_tipo: dict

