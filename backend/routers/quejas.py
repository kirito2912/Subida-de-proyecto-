from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Queja, Cliente
from schemas import QuejaCreate, QuejaUpdate, QuejaOut

router = APIRouter(prefix="/quejas", tags=["Quejas"])


def _queja_to_out(q: Queja) -> QuejaOut:
    return QuejaOut(
        id=q.id,
        cliente_id=q.cliente_id,
        cliente_nombre=q.cliente.nombre if q.cliente else None,
        descripcion=q.descripcion,
        tipo=q.tipo,
        estado=q.estado,
        resolucion=q.resolucion,
        created_at=q.created_at,
        updated_at=q.updated_at,
    )


@router.get("/", response_model=List[QuejaOut])
def listar_quejas(
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Queja)
    if estado:
        q = q.filter(Queja.estado == estado)
    if tipo:
        q = q.filter(Queja.tipo == tipo)
    return [_queja_to_out(x) for x in q.order_by(Queja.created_at.desc()).all()]


@router.get("/{queja_id}", response_model=QuejaOut)
def obtener_queja(queja_id: int, db: Session = Depends(get_db)):
    q = db.query(Queja).filter(Queja.id == queja_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Queja no encontrada")
    return _queja_to_out(q)


@router.post("/", response_model=QuejaOut, status_code=201)
def crear_queja(data: QuejaCreate, db: Session = Depends(get_db)):
    if data.cliente_id:
        c = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    q = Queja(**data.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return _queja_to_out(q)


@router.put("/{queja_id}", response_model=QuejaOut)
def actualizar_queja(queja_id: int, data: QuejaUpdate, db: Session = Depends(get_db)):
    q = db.query(Queja).filter(Queja.id == queja_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Queja no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return _queja_to_out(q)


@router.delete("/{queja_id}", status_code=204)
def eliminar_queja(queja_id: int, db: Session = Depends(get_db)):
    q = db.query(Queja).filter(Queja.id == queja_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Queja no encontrada")
    db.delete(q)
    db.commit()
