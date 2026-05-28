from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class TipoCliente(str, enum.Enum):
    PARTICULAR = "Particular"
    MAYORISTA = "Mayorista"
    CORPORATIVO = "Corporativo"


class EstadoPedido(str, enum.Enum):
    PENDIENTE = "Pendiente"
    CONFIRMADO = "Confirmado"
    EN_PROCESO = "En proceso"
    ENTREGADO = "Entregado"
    CANCELADO = "Cancelado"


class TipoCortina(str, enum.Enum):
    BLACKOUT = "Blackout"
    ROLLER = "Roller"
    ROMANA = "Romana"
    PANEL = "Panel"
    VENECIANA = "Veneciana"


class Temporada(str, enum.Enum):
    VERANO = "Verano"
    OTONO = "Otoño"
    INVIERNO = "Invierno"
    PRIMAVERA = "Primavera"


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)  # C-001
    nombre = Column(String, nullable=False)
    tipo = Column(String, default=TipoCliente.PARTICULAR)
    telefono = Column(String)
    email = Column(String)
    direccion = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pedidos = relationship("Pedido", back_populates="cliente")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)  # PED-1001
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    tipo_cortina = Column(String, nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    temporada = Column(String, default=Temporada.VERANO)
    estado = Column(String, default=EstadoPedido.PENDIENTE)
    fecha_pedido = Column(DateTime(timezone=True), server_default=func.now())
    fecha_entrega = Column(DateTime(timezone=True), nullable=True)
    notas = Column(Text, nullable=True)

    cliente = relationship("Cliente", back_populates="pedidos")
    produccion = relationship("Produccion", back_populates="pedido", uselist=False)


class Material(Base):
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    stock_actual = Column(Float, default=0)
    stock_minimo = Column(Float, default=0)
    unidad = Column(String, default="metros")
    precio_unitario = Column(Float, default=0)
    proveedor = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Produccion(Base):
    __tablename__ = "produccion"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    estado = Column(String, default="En proceso")  # En proceso | Entregado
    fecha_inicio = Column(DateTime(timezone=True), server_default=func.now())
    fecha_fin = Column(DateTime(timezone=True), nullable=True)
    operario = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)

    pedido = relationship("Pedido", back_populates="produccion")


class VentaMensual(Base):
    """Resumen mensual de ventas para el modelo de predicción."""
    __tablename__ = "ventas_mensuales"

    id = Column(Integer, primary_key=True, index=True)
    anio = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)          # 1-12
    total_pedidos = Column(Integer, default=0)
    total_monto = Column(Float, default=0)
    temporada = Column(String)


class Queja(Base):
    __tablename__ = "quejas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    descripcion = Column(Text, nullable=False)
    tipo = Column(String)   # Calidad | Entrega | Atención | Otro
    estado = Column(String, default="Abierta")   # Abierta | En revisión | Resuelta
    resolucion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cliente = relationship("Cliente")
