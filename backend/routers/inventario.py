from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Material
from schemas import MaterialCreate, MaterialUpdate, MaterialOut

router = APIRouter(prefix="/inventario", tags=["Inventario"])


def _material_to_out(m: Material) -> MaterialOut:
    """
    Función auxiliar para convertir un modelo Material a su esquema de salida MaterialOut,
    calculando en tiempo real si se encuentra en stock crítico.
    """
    out = MaterialOut.model_validate(m)
    out.stock_critico = m.stock_actual <= m.stock_minimo
    return out


@router.get("/", response_model=List[MaterialOut])
def listar_materiales(
    solo_criticos: bool = Query(False, description="Solo materiales con stock crítico"),
    db: Session = Depends(get_db),
):
    """
    Retorna la lista de todos los insumos/materiales registrados.
    Permite filtrar opcionalmente para retornar únicamente aquellos que tienen stock crítico.
    """
    q = db.query(Material)
    materiales = q.all()
    result = [_material_to_out(m) for m in materiales]
    if solo_criticos:
        result = [m for m in result if m.stock_critico]
    return result


@router.get("/resumen")
def resumen_inventario(db: Session = Depends(get_db)):
    """
    Obtiene un resumen cuantitativo del inventario actual, incluyendo el total
    de insumos registrados y el listado de insumos que requieren reabastecimiento urgente.
    """
    materiales = db.query(Material).all()
    criticos = [m for m in materiales if m.stock_actual <= m.stock_minimo]
    return {
        "total_materiales": len(materiales),
        "stock_critico": len(criticos),
        "materiales_criticos": [{"id": m.id, "nombre": m.nombre, "stock_actual": m.stock_actual, "stock_minimo": m.stock_minimo} for m in criticos],
    }


@router.get("/{material_id}", response_model=MaterialOut)
def obtener_material(material_id: int, db: Session = Depends(get_db)):
    """
    Recupera la información detallada de un material específico utilizando su ID.
    """
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return _material_to_out(m)


@router.post("/", response_model=MaterialOut, status_code=201)
def crear_material(data: MaterialCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo material o materia prima en el inventario.
    """
    m = Material(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return _material_to_out(m)


@router.put("/{material_id}", response_model=MaterialOut)
def actualizar_material(material_id: int, data: MaterialUpdate, db: Session = Depends(get_db)):
    """
    Actualiza parcialmente las propiedades de un material (como precio, proveedor o stock mínimo).
    """
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return _material_to_out(m)


@router.patch("/{material_id}/stock")
def ajustar_stock(material_id: int, cantidad: float, db: Session = Depends(get_db)):
    """
    Incrementa o reduce el stock físico de un insumo de forma directa.
    El parámetro 'cantidad' puede ser positivo (entrada al almacén) o negativo (salida/consumo).
    El stock final está topado a un mínimo de 0.
    """
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    m.stock_actual = max(0, m.stock_actual + cantidad)
    db.commit()
    db.refresh(m)
    return _material_to_out(m)


@router.delete("/{material_id}", status_code=204)
def eliminar_material(material_id: int, db: Session = Depends(get_db)):
    """
    Elimina permanentemente un material del inventario de la base de datos.
    """
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    db.delete(m)
    db.commit()
