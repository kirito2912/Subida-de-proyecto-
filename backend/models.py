from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class TipoCliente(str, enum.Enum):
    """
    Enumeración para clasificar los tipos de cliente.
    Determina los privilegios y comportamiento comercial (Particular, Mayorista o Corporativo).
    """
    PARTICULAR = "Particular"
    MAYORISTA = "Mayorista"
    CORPORATIVO = "Corporativo"


class EstadoPedido(str, enum.Enum):
    """
    Enumeración para el flujo de estados de un pedido.
    Ayuda a rastrear la orden desde su creación hasta la entrega o cancelación.
    """
    PENDIENTE = "Pendiente"
    CONFIRMADO = "Confirmado"
    EN_PROCESO = "En proceso"
    ENTREGADO = "Entregado"
    CANCELADO = "Cancelado"


class TipoCortina(str, enum.Enum):
    """
    Enumeración para los distintos tipos de cortina que produce la empresa.
    Usado para clasificar los pedidos y calcular los requerimientos de materiales.
    """
    BLACKOUT = "Blackout"
    ROLLER = "Roller"
    ROMANA = "Romana"
    PANEL = "Panel"
    VENECIANA = "Veneciana"


class Temporada(str, enum.Enum):
    """
    Enumeración de las estaciones del año.
    Utilizada para el análisis estacional de las ventas y las predicciones de demanda.
    """
    VERANO = "Verano"
    OTONO = "Otoño"
    INVIERNO = "Invierno"
    PRIMAVERA = "Primavera"


class Cliente(Base):
    """
    Modelo de Base de Datos para representar a los Clientes.
    Almacena información básica de contacto y el historial de pedidos asociados.
    """
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)  # Código único autogenerado (ej. C-001)
    nombre = Column(String, nullable=False)
    tipo = Column(String, default=TipoCliente.PARTICULAR)
    telefono = Column(String)
    email = Column(String)
    direccion = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación de uno a muchos con la tabla Pedido
    pedidos = relationship("Pedido", back_populates="cliente")


class Pedido(Base):
    """
    Modelo de Base de Datos para los Pedidos.
    Registra el volumen, costos, tipo de cortina, estado logístico y temporada
    asociados a una orden realizada por un cliente.
    """
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)  # Código único autogenerado (ej. PED-1001)
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

    # Relaciones de la base de datos
    cliente = relationship("Cliente", back_populates="pedidos")
    produccion = relationship("Produccion", back_populates="pedido", uselist=False)


class Material(Base):
    """
    Modelo de Base de Datos para el Inventario de Materiales/Insumos.
    Permite controlar el stock actual, establecer alertas de stock mínimo
    y estimar costos de producción según los precios unitarios.
    """
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
    """
    Modelo de Base de Datos para el Seguimiento de Producción.
    Asocia un pedido con un operario y registra la fecha de inicio,
    finalización y cualquier observación relevante durante el ensamble.
    """
    __tablename__ = "produccion"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    estado = Column(String, default="En proceso")  # "En proceso" o "Entregado"
    fecha_inicio = Column(DateTime(timezone=True), server_default=func.now())
    fecha_fin = Column(DateTime(timezone=True), nullable=True)
    operario = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)

    # Relación inversa de uno a uno con Pedido
    pedido = relationship("Pedido", back_populates="produccion")


class VentaMensual(Base):
    """
    Modelo de Base de Datos para registrar Resúmenes Mensuales de Ventas.
    Es utilizado directamente por los algoritmos de predicción de demanda
    para analizar la tendencia histórica y estacional de las ventas.
    """
    __tablename__ = "ventas_mensuales"

    id = Column(Integer, primary_key=True, index=True)
    anio = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)          # Número de mes del 1 al 12
    total_pedidos = Column(Integer, default=0)
    total_monto = Column(Float, default=0)
    temporada = Column(String)


class Queja(Base):
    """
    Modelo de Base de Datos para Quejas y Reclamaciones de Clientes.
    Permite registrar la incidencia, clasificar el tipo de queja,
    asignar un estado de resolución y almacenar la respuesta brindada.
    """
    __tablename__ = "quejas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    descripcion = Column(Text, nullable=False)
    tipo = Column(String)   # Tipos: "Calidad", "Entrega", "Atención", "Otro"
    estado = Column(String, default="Abierta")   # Estados: "Abierta", "En revisión", "Resuelta"
    resolucion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación de uno a uno/muchos con el Cliente afectado
    cliente = relationship("Cliente")

