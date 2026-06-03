from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date
from database import get_db
from models import Pedido, Produccion, Queja

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/ventas")
def reporte_ventas(
    anio: int = Query(default=None),
    mes: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Genera un informe analítico sobre el desempeño de ventas para un período dado (año y mes opcional).
    Calcula:
    - Cantidad total de pedidos.
    - Monto total facturado (excluyendo pedidos cancelados).
    - Un desglose de volumen total por tipo de cortina.
    - Distribución de pedidos según la temporada.
    - Distribución por estado logístico del pedido.
    """
    anio = anio or date.today().year
    q = db.query(Pedido).filter(extract("year", Pedido.fecha_pedido) == anio)
    if mes:
        q = q.filter(extract("month", Pedido.fecha_pedido) == mes)
    pedidos = q.all()

    total_pedidos = len(pedidos)
    total_monto = sum(p.total for p in pedidos if p.estado != "Cancelado")

    por_tipo: dict = {}
    for p in pedidos:
        if p.estado != "Cancelado":
            por_tipo[p.tipo_cortina] = por_tipo.get(p.tipo_cortina, 0) + p.cantidad

    por_temporada: dict = {}
    for p in pedidos:
        if p.estado != "Cancelado":
            por_temporada[p.temporada] = por_temporada.get(p.temporada, 0) + 1

    por_estado: dict = {}
    for p in pedidos:
        por_estado[p.estado] = por_estado.get(p.estado, 0) + 1

    return {
        "periodo": f"{anio}" + (f"-{mes:02d}" if mes else ""),
        "total_pedidos": total_pedidos,
        "total_monto": round(total_monto, 2),
        "por_tipo": por_tipo,
        "por_temporada": por_temporada,
        "por_estado": por_estado,
    }


@router.get("/produccion")
def reporte_produccion(
    anio: int = Query(default=None),
    mes: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Genera estadísticas de productividad del taller de ensamble para un período dado.
    Calcula:
    - Cantidad de pedidos actualmente en proceso.
    - Cantidad de pedidos entregados/finalizados.
    - Tiempo promedio de producción expresado en días (basado en la diferencia entre fecha_inicio y fecha_fin).
    """
    anio = anio or date.today().year
    q = db.query(Produccion).filter(extract("year", Produccion.fecha_inicio) == anio)
    if mes:
        q = q.filter(extract("month", Produccion.fecha_inicio) == mes)
    prods = q.all()

    en_proceso = sum(1 for p in prods if p.estado == "En proceso")
    entregados = sum(1 for p in prods if p.estado == "Entregado")

    tiempos = []
    for p in prods:
        if p.estado == "Entregado" and p.fecha_fin and p.fecha_inicio:
            delta = (p.fecha_fin - p.fecha_inicio).days
            tiempos.append(delta)

    tiempo_promedio = round(sum(tiempos) / len(tiempos), 1) if tiempos else None

    return {
        "periodo": f"{anio}" + (f"-{mes:02d}" if mes else ""),
        "total_en_proceso": en_proceso,
        "total_entregados": entregados,
        "tiempo_promedio_dias": tiempo_promedio,
    }


@router.get("/quejas")
def reporte_quejas(db: Session = Depends(get_db)):
    """
    Obtiene las métricas de servicio de atención al cliente e incidencias de calidad.
    Calcula la distribución total de quejas según su estado (Abiertas, En revisión, Resuelta)
    y las agrupa por categoría o tipo (e.g. Calidad, Entrega, Atención, Otro).
    """
    quejas = db.query(Queja).all()
    por_tipo: dict = {}
    for q in quejas:
        por_tipo[q.tipo] = por_tipo.get(q.tipo, 0) + 1

    return {
        "total": len(quejas),
        "abiertas": sum(1 for q in quejas if q.estado == "Abierta"),
        "resueltas": sum(1 for q in quejas if q.estado == "Resuelta"),
        "en_revision": sum(1 for q in quejas if q.estado == "En revisión"),
        "por_tipo": por_tipo,
    }
