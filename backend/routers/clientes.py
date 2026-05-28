from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import Cliente, Pedido
from schemas import ClienteCreate, ClienteUpdate, ClienteOut

router = APIRouter(prefix="/clientes", tags=["Clientes"])


def _generar_codigo(db: Session) -> str:
    ultimo = db.query(Cliente).order_by(Cliente.id.desc()).first()
    num = (ultimo.id + 1) if ultimo else 1
    return f"C-{num:03d}"


@router.get("/", response_model=List[ClienteOut])
def listar_clientes(
    q: Optional[str] = Query(None, description="Buscar por nombre"),
    tipo: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Cliente)
    if q:
        query = query.filter(Cliente.nombre.ilike(f"%{q}%"))
    if tipo:
        query = query.filter(Cliente.tipo == tipo)
    clientes = query.offset(skip).limit(limit).all()

    result = []
    for c in clientes:
        total_pedidos = db.query(func.count(Pedido.id)).filter(Pedido.cliente_id == c.id).scalar() or 0
        total_monto = db.query(func.sum(Pedido.total)).filter(Pedido.cliente_id == c.id).scalar() or 0.0
        out = ClienteOut.model_validate(c)
        out.total_pedidos = total_pedidos
        out.total_monto = total_monto
        result.append(out)
    return result


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    total_pedidos = db.query(func.count(Pedido.id)).filter(Pedido.cliente_id == c.id).scalar() or 0
    total_monto = db.query(func.sum(Pedido.total)).filter(Pedido.cliente_id == c.id).scalar() or 0.0
    out = ClienteOut.model_validate(c)
    out.total_pedidos = total_pedidos
    out.total_monto = total_monto
    return out


@router.post("/", response_model=ClienteOut, status_code=201)
def crear_cliente(data: ClienteCreate, db: Session = Depends(get_db)):
    c = Cliente(**data.model_dump())
    db.add(c)
    db.flush()
    c.codigo = _generar_codigo(db)
    db.commit()
    db.refresh(c)
    out = ClienteOut.model_validate(c)
    out.total_pedidos = 0
    out.total_monto = 0.0
    return out


@router.put("/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(cliente_id: int, data: ClienteUpdate, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return ClienteOut.model_validate(c)


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(c)
    db.commit()
