from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import VentaMensual
from schemas import PrediccionOut

router = APIRouter(prefix="/prediccion", tags=["Predicción"])

MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def _regresion_lineal(x: list, y: list):
    """Regresión lineal simple sin dependencia de sklearn."""
    n = len(x)
    if n < 2:
        media_y = sum(y) / n if n else 0
        return 0, media_y, 0

    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
    sum_x2 = sum(xi ** 2 for xi in x)

    denom = n * sum_x2 - sum_x ** 2
    if denom == 0:
        return 0, sum_y / n, 0

    m = (n * sum_xy - sum_x * sum_y) / denom
    b = (sum_y - m * sum_x) / n

    # Calcular R²
    y_mean = sum_y / n
    ss_res = sum((yi - (m * xi + b)) ** 2 for xi, yi in zip(x, y))
    ss_tot = sum((yi - y_mean) ** 2 for yi in y)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 1.0

    return m, b, r2


def _calcular_error_std(x: list, y: list, m: float, b: float) -> float:
    if len(y) < 2:
        return max(y) * 0.1 if y else 10
    residuos = [(yi - (m * xi + b)) ** 2 for xi, yi in zip(x, y)]
    return (sum(residuos) / (len(residuos) - 1)) ** 0.5


@router.get("/", response_model=List[PrediccionOut])
def predecir_ventas(
    meses_adelante: int = Query(default=3, ge=1, le=12, description="Meses a predecir"),
    db: Session = Depends(get_db),
):
    """
    Predice la cantidad de pedidos usando regresión lineal simple sobre
    el historial de ventas mensuales almacenado en la tabla ventas_mensuales.
    """
    historial = db.query(VentaMensual).order_by(VentaMensual.anio, VentaMensual.mes).all()

    if len(historial) < 2:
        # Sin datos suficientes, devolver estimados base
        from datetime import date
        hoy = date.today()
        resultado = []
        for i in range(1, meses_adelante + 1):
            mes_n = (hoy.month + i - 1) % 12 + 1
            anio_n = hoy.year + (hoy.month + i - 1) // 12
            resultado.append(PrediccionOut(
                mes=MESES_ES[mes_n - 1],
                mes_numero=mes_n,
                anio=anio_n,
                prediccion=150,
                limite_inferior=120,
                limite_superior=180,
                confianza=0.0,
            ))
        return resultado

    # Índices secuenciales para el modelo
    x = list(range(len(historial)))
    y = [h.total_pedidos for h in historial]

    m, b, r2 = _regresion_lineal(x, y)
    error_std = _calcular_error_std(x, y, m, b)

    # Determinar el mes/año de inicio de predicción
    ultimo = historial[-1]
    resultado = []

    for i in range(1, meses_adelante + 1):
        x_pred = len(historial) - 1 + i
        valor = m * x_pred + b

        # Calcular mes y año destino
        mes_offset = ultimo.mes + i
        anio_pred = ultimo.anio + (mes_offset - 1) // 12
        mes_pred = (mes_offset - 1) % 12 + 1

        intervalo = 1.96 * error_std  # 95% de confianza
        resultado.append(PrediccionOut(
            mes=MESES_ES[mes_pred - 1],
            mes_numero=mes_pred,
            anio=anio_pred,
            prediccion=max(0, round(valor)),
            limite_inferior=max(0, round(valor - intervalo)),
            limite_superior=max(0, round(valor + intervalo)),
            confianza=round(min(r2, 1.0), 3),
        ))

    return resultado


@router.get("/historico")
def historico_con_prediccion(db: Session = Depends(get_db)):
    """
    Devuelve el histórico real + la línea de tendencia ajustada,
    útil para el gráfico 'Ventas vs Predicción' del dashboard.
    """
    historial = db.query(VentaMensual).order_by(VentaMensual.anio, VentaMensual.mes).all()
    if not historial:
        return []

    x = list(range(len(historial)))
    y = [h.total_pedidos for h in historial]

    if len(x) >= 2:
        m, b, _ = _regresion_lineal(x, y)
        tendencia = [max(0, round(m * xi + b)) for xi in x]
    else:
        tendencia = y[:]

    return [
        {
            "mes": MESES_ES[h.mes - 1][:3],
            "anio": h.anio,
            "ventas": h.total_pedidos,
            "prediccion": tendencia[i],
        }
        for i, h in enumerate(historial)
    ]
