from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import Produccion, Pedido
from schemas import ProduccionUpdate, ProduccionOut

router = APIRouter(prefix="/produccion", tags=["Producción"])


def _prod_to_out(p: Produccion) -> ProduccionOut:
    return ProduccionOut(
        id=p.id,
        pedido_id=p.pedido_id,
        pedido_codigo=p.pedido.codigo if p.pedido else None,
        cliente_nombre=p.pedido.cliente.nombre if p.pedido and p.pedido.cliente else None,
        tipo_cortina=p.pedido.tipo_cortina if p.pedido else None,
        cantidad=p.pedido.cantidad if p.pedido else None,
        estado=p.estado,
        fecha_inicio=p.fecha_inicio,
        fecha_fin=p.fecha_fin,
        operario=p.operario,
        observaciones=p.observaciones,
    )


@router.get("/", response_model=List[ProduccionOut])
def listar_produccion(
    estado: Optional[str] = Query(None, description="En proceso | Entregado"),
    db: Session = Depends(get_db),
):
    q = db.query(Produccion)
    if estado:
        q = q.filter(Produccion.estado == estado)
    prods = q.order_by(Produccion.fecha_inicio.desc()).all()
    return [_prod_to_out(p) for p in prods]


@router.get("/resumen-semanal")
def resumen_semanal(db: Session = Depends(get_db)):
    """Agrupa producción por semana del mes actual para el gráfico."""
    from sqlalchemy import extract, func
    from datetime import date

    hoy = date.today()
    rows = (
        db.query(
            extract("week", Produccion.fecha_inicio).label("semana"),
            Produccion.estado,
            func.count(Produccion.id).label("cantidad"),
        )
        .filter(extract("month", Produccion.fecha_inicio) == hoy.month)
        .filter(extract("year", Produccion.fecha_inicio) == hoy.year)
        .group_by("semana", Produccion.estado)
        .all()
    )

    semanas: dict = {}
    for r in rows:
        s = f"S{int(r.semana) % 4 + 1}"
        if s not in semanas:
            semanas[s] = {"semana": s, "proceso": 0, "entregado": 0}
        if r.estado == "En proceso":
            semanas[s]["proceso"] += r.cantidad
        else:
            semanas[s]["entregado"] += r.cantidad

    return list(semanas.values()) or [
        {"semana": f"S{i}", "proceso": 0, "entregado": 0} for i in range(1, 5)
    ]


@router.get("/{produccion_id}", response_model=ProduccionOut)
def obtener_produccion(produccion_id: int, db: Session = Depends(get_db)):
    p = db.query(Produccion).filter(Produccion.id == produccion_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Registro de producción no encontrado")
    return _prod_to_out(p)


@router.put("/{produccion_id}", response_model=ProduccionOut)
def actualizar_produccion(produccion_id: int, data: ProduccionUpdate, db: Session = Depends(get_db)):
    p = db.query(Produccion).filter(Produccion.id == produccion_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Registro de producción no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    # Si se marca como entregado y no tiene fecha_fin, asignarla
    if data.estado == "Entregado" and not p.fecha_fin:
        p.fecha_fin = datetime.utcnow()
        # También actualizar el pedido
        if p.pedido:
            p.pedido.estado = "Entregado"
            p.pedido.fecha_entrega = p.fecha_fin
    db.commit()
    db.refresh(p)
    return _prod_to_out(p)
