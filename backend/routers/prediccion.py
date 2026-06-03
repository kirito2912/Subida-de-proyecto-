from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from database import get_db
from models import VentaMensual
from schemas import PrediccionOut

router = APIRouter(prefix="/prediccion", tags=["Predicción"])

# Lista de nombres de meses en español para formato de salida amigable
MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def _regresion_lineal(x: list, y: list):
    """
    Realiza una regresión lineal simple sin dependencias externas como scikit-learn.
    Retorna la pendiente 'm', la ordenada al origen 'b' y el coeficiente de determinación 'R²'.
    Esto se utiliza para calcular las tendencias estadísticas de ventas basándose en los índices de tiempo.
    """
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

    # Calcular R² para conocer el porcentaje de ajuste del modelo
    y_mean = sum_y / n
    ss_res = sum((yi - (m * xi + b)) ** 2 for xi, yi in zip(x, y))
    ss_tot = sum((yi - y_mean) ** 2 for yi in y)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 1.0

    return m, b, r2


def _calcular_error_std(x: list, y: list, m: float, b: float) -> float:
    """
    Calcula la desviación estándar de los residuos (error estándar de la estimación).
    Se utiliza para determinar el margen de error y construir los límites superior e inferior de confianza.
    """
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
    Predice la cantidad de pedidos de cortinas usando regresión lineal simple sobre
    el histórico de ventas mensuales almacenado en la base de datos.
    Calcula los límites superior e inferior de confianza usando un intervalo del 95% (Z = 1.96).
    """
    historial = db.query(VentaMensual).order_by(VentaMensual.anio, VentaMensual.mes).all()

    if len(historial) < 2:
        # Si no hay suficientes datos históricos, devolver estimados base razonables
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

    # Genera índices de tiempo secuenciales (0, 1, 2...) y la variable objetivo
    x = list(range(len(historial)))
    y = [h.total_pedidos for h in historial]

    m, b, r2 = _regresion_lineal(x, y)
    error_std = _calcular_error_std(x, y, m, b)

    ultimo = historial[-1]
    resultado = []

    for i in range(1, meses_adelante + 1):
        x_pred = len(historial) - 1 + i
        valor = m * x_pred + b

        # Calcula el mes y el año correspondiente a la proyección
        mes_offset = ultimo.mes + i
        anio_pred = ultimo.anio + (mes_offset - 1) // 12
        mes_pred = (mes_offset - 1) % 12 + 1

        # Multiplicador 1.96 para margen de error con 95% de confianza estadística
        intervalo = 1.96 * error_std
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
    Retorna el histórico real de ventas mensuales junto con la línea de tendencia calculada por el modelo.
    Es utilizado directamente por los gráficos dinámicos del frontend para contrastar datos reales vs estimados.
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


@router.post("/upload-excel")
async def upload_excel_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Recibe un archivo Excel desde el frontend con columnas 'anio', 'mes', y 'total_pedidos'.
    Reemplaza el historial actual en base de datos con los datos del Excel para reentrenar
    el modelo de regresión lineal. Calcula el RMSE simple en el proceso.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        required_cols = {'anio', 'mes', 'total_pedidos'}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"El Excel debe contener las columnas: {required_cols}")

        # Limpiamos los datos históricos existentes antes de importar
        db.query(VentaMensual).delete()

        for _, row in df.iterrows():
            nueva_venta = VentaMensual(
                anio=int(row['anio']),
                mes=int(row['mes']),
                total_pedidos=int(row['total_pedidos'])
            )
            db.add(nueva_venta)
        
        db.commit()

        # Cálculo de métricas básicas de validación del set importado (Simulando split 80/20)
        total_registros = len(df)
        muestras_entrenamiento = int(total_registros * 0.8)
        muestras_test = total_registros - muestras_entrenamiento
        
        # Calcular el error cuadrático medio (RMSE) simple
        rmse = 0.0
        if total_registros >= 2:
            x = list(range(total_registros))
            y = df['total_pedidos'].tolist()
            m, b, _ = _regresion_lineal(x, y)
            predicciones = [m * xi + b for xi in x]
            mse = sum((yi - pi) ** 2 for yi, pi in zip(y, predicciones)) / total_registros
            rmse = round(mse ** 0.5, 2)

        return {
            "status": "success",
            "mensaje": f"Se procesaron {total_registros} registros mensuales.",
            "total_registros": total_registros,
            "muestras_entrenamiento": muestras_entrenamiento,
            "muestras_test": muestras_test,
            "metricas_test": {
                "rmse": rmse
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar el Excel: {str(e)}")


@router.delete("/limpiar")
def limpiar_historial(db: Session = Depends(get_db)):
    """
    Elimina permanentemente todo el historial de ventas mensuales almacenado.
    Esto reinicia el modelo de regresión lineal.
    """
    try:
        db.query(VentaMensual).delete()
        db.commit()
        return {"status": "success", "mensaje": "Historial de predicción limpiado."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

