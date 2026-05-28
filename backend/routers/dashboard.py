from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from database import get_db
from models import Pedido, Produccion, Material, Cliente

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def kpis(db: Session = Depends(get_db)):
    hoy = date.today()

    ventas_mes = (
        db.query(func.count(Pedido.id))
        .filter(
            extract("year", Pedido.fecha_pedido) == hoy.year,
            extract("month", Pedido.fecha_pedido) == hoy.month,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 0
    )

    monto_mes = (
        db.query(func.sum(Pedido.total))
        .filter(
            extract("year", Pedido.fecha_pedido) == hoy.year,
            extract("month", Pedido.fecha_pedido) == hoy.month,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 0.0
    )

    en_produccion = (
        db.query(func.count(Produccion.id))
        .filter(Produccion.estado == "En proceso")
        .scalar() or 0
    )

    materiales = db.query(Material).all()
    stock_critico = sum(1 for m in materiales if m.stock_actual <= m.stock_minimo)

    clientes_activos = (
        db.query(func.count(func.distinct(Pedido.cliente_id)))
        .filter(
            extract("year", Pedido.fecha_pedido) == hoy.year,
            extract("month", Pedido.fecha_pedido) == hoy.month,
        )
        .scalar() or 0
    )

    # Variación vs mes anterior
    mes_anterior = hoy.month - 1 or 12
    anio_anterior = hoy.year if hoy.month > 1 else hoy.year - 1
    ventas_anterior = (
        db.query(func.count(Pedido.id))
        .filter(
            extract("year", Pedido.fecha_pedido) == anio_anterior,
            extract("month", Pedido.fecha_pedido) == mes_anterior,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 1  # evitar /0
    )
    variacion_ventas = round((ventas_mes - ventas_anterior) / ventas_anterior * 100, 1)

    return {
        "ventas_mes": ventas_mes,
        "monto_mes": round(monto_mes, 2),
        "en_produccion": en_produccion,
        "stock_critico": stock_critico,
        "clientes_activos": clientes_activos,
        "variacion_ventas_pct": variacion_ventas,
    }
