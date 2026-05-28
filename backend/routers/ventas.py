from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import Pedido, Cliente, Produccion, VentaMensual
from schemas import PedidoCreate, PedidoUpdate, PedidoOut

router = APIRouter(prefix="/ventas", tags=["Ventas"])

MESES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


def _generar_codigo(db: Session) -> str:
    ultimo = db.query(Pedido).order_by(Pedido.id.desc()).first()
    num = (ultimo.id + 1000 + 1) if ultimo else 1001
    return f"PED-{num}"


def _pedido_to_out(p: Pedido) -> PedidoOut:
    return PedidoOut(
        id=p.id,
        codigo=p.codigo,
        cliente_id=p.cliente_id,
        cliente_nombre=p.cliente.nombre if p.cliente else None,
        tipo_cortina=p.tipo_cortina,
        cantidad=p.cantidad,
        precio_unitario=p.precio_unitario,
        total=p.total,
        temporada=p.temporada,
        estado=p.estado,
        fecha_pedido=p.fecha_pedido,
        fecha_entrega=p.fecha_entrega,
        notas=p.notas,
    )


def _actualizar_resumen_mensual(db: Session, fecha: datetime):
    """Recalcula el resumen del mes/año de una fecha dada."""
    anio = fecha.year
    mes = fecha.month
    total_pedidos = (
        db.query(func.count(Pedido.id))
        .filter(
            extract("year", Pedido.fecha_pedido) == anio,
            extract("month", Pedido.fecha_pedido) == mes,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 0
    )
    total_monto = (
        db.query(func.sum(Pedido.total))
        .filter(
            extract("year", Pedido.fecha_pedido) == anio,
            extract("month", Pedido.fecha_pedido) == mes,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 0.0
    )
    vm = db.query(VentaMensual).filter(VentaMensual.anio == anio, VentaMensual.mes == mes).first()
    if vm:
        vm.total_pedidos = total_pedidos
        vm.total_monto = total_monto
    else:
        vm = VentaMensual(anio=anio, mes=mes, total_pedidos=total_pedidos, total_monto=total_monto)
        db.add(vm)
    db.commit()


@router.get("/", response_model=List[PedidoOut])
def listar_pedidos(
    estado: Optional[str] = None,
    tipo_cortina: Optional[str] = None,
    cliente_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Pedido)
    if estado:
        q = q.filter(Pedido.estado == estado)
    if tipo_cortina:
        q = q.filter(Pedido.tipo_cortina == tipo_cortina)
    if cliente_id:
        q = q.filter(Pedido.cliente_id == cliente_id)
    pedidos = q.order_by(Pedido.fecha_pedido.desc()).offset(skip).limit(limit).all()
    return [_pedido_to_out(p) for p in pedidos]


@router.get("/resumen-mensual")
def resumen_mensual(db: Session = Depends(get_db)):
    """Devuelve ventas agrupadas por mes para los gráficos."""
    rows = db.query(VentaMensual).order_by(VentaMensual.anio, VentaMensual.mes).all()
    return [
        {
            "mes": MESES_ES[r.mes - 1],
            "anio": r.anio,
            "mes_numero": r.mes,
            "ventas": r.total_pedidos,
            "monto": r.total_monto,
        }
        for r in rows
    ]


@router.get("/cantidad-por-tipo")
def cantidad_por_tipo(db: Session = Depends(get_db)):
    """Ventas por mes y tipo de cortina."""
    rows = (
        db.query(
            extract("year", Pedido.fecha_pedido).label("anio"),
            extract("month", Pedido.fecha_pedido).label("mes"),
            Pedido.tipo_cortina,
            func.sum(Pedido.cantidad).label("cantidad"),
        )
        .filter(Pedido.estado != "Cancelado")
        .group_by("anio", "mes", Pedido.tipo_cortina)
        .order_by("anio", "mes")
        .all()
    )

    # Pivotear en diccionarios por mes
    por_mes: dict = {}
    tipos = ["Blackout", "Roller", "Romana", "Panel", "Veneciana"]
    for r in rows:
        key = f"{int(r.anio)}-{int(r.mes):02d}"
        if key not in por_mes:
            por_mes[key] = {
                "mes": MESES_ES[int(r.mes) - 1],
                **{t.lower(): 0 for t in tipos},
            }
        por_mes[key][r.tipo_cortina.lower()] = int(r.cantidad or 0)

    return list(por_mes.values())


@router.get("/{pedido_id}", response_model=PedidoOut)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    p = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return _pedido_to_out(p)


@router.post("/", response_model=PedidoOut, status_code=201)
def crear_pedido(data: PedidoCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    total = data.cantidad * data.precio_unitario
    pedido = Pedido(
        **data.model_dump(),
        total=total,
        estado="Pendiente",
    )
    db.add(pedido)
    db.flush()
    pedido.codigo = _generar_codigo(db)

    # Crear registro de producción automáticamente
    produccion = Produccion(pedido_id=pedido.id, estado="En proceso")
    db.add(produccion)

    db.commit()
    db.refresh(pedido)

    _actualizar_resumen_mensual(db, pedido.fecha_pedido)
    return _pedido_to_out(pedido)


@router.put("/{pedido_id}", response_model=PedidoOut)
def actualizar_pedido(pedido_id: int, data: PedidoUpdate, db: Session = Depends(get_db)):
    p = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    if data.cantidad or data.precio_unitario:
        p.total = p.cantidad * p.precio_unitario
    db.commit()
    db.refresh(p)
    _actualizar_resumen_mensual(db, p.fecha_pedido)
    return _pedido_to_out(p)


@router.delete("/{pedido_id}", status_code=204)
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    p = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db.delete(p)
    db.commit()
