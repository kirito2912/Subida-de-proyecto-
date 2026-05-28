"""
seed.py — Pobla la base de datos con datos de ejemplo.
Ejecutar: python seed.py
"""
from datetime import datetime, timedelta
import random
from database import SessionLocal, engine, Base
from models import Cliente, Pedido, Material, Produccion, VentaMensual, Queja

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Limpiando base de datos...")
db.query(Queja).delete()
db.query(Produccion).delete()
db.query(Pedido).delete()
db.query(Cliente).delete()
db.query(Material).delete()
db.query(VentaMensual).delete()
db.commit()

# ─── CLIENTES ─────────────────────────────────────────────────────────────────
print("Creando clientes...")
clientes_data = [
    ("María González",    "Mayorista",    "+591 7012-3456", "maria@hogar.bo"),
    ("Hotel Andino S.A.", "Corporativo",  "+591 7098-7654", "compras@andino.bo"),
    ("Carlos Mendoza",    "Particular",   "+591 7755-4321", "cmendoza@gmail.com"),
    ("Constructora Lima", "Corporativo",  "+591 7666-8899", "obras@lima.bo"),
    ("Ana Rojas",         "Particular",   "+591 7321-9876", "anarojas@hotmail.com"),
    ("Decoraciones Cruz", "Mayorista",    "+591 7088-2233", "ventas@cruz.bo"),
    ("Roberto Vargas",    "Particular",   "+591 7444-5566", "rvargas@outlook.com"),
    ("Hotel Camino Real", "Corporativo",  "+591 7200-1100", "compras@caminoreal.bo"),
]

clientes = []
for i, (nombre, tipo, tel, email) in enumerate(clientes_data, 1):
    c = Cliente(codigo=f"C-{i:03d}", nombre=nombre, tipo=tipo, telefono=tel, email=email)
    db.add(c)
    clientes.append(c)
db.commit()
print(f"  - {len(clientes)} clientes creados")

# ─── MATERIALES ───────────────────────────────────────────────────────────────
print("Creando materiales...")
materiales_data = [
    ("Tela Blackout",      420, 150, "metros",  45.0, "TextilPro S.A."),
    ("Tela Voile",         280, 100, "metros",  32.0, "TextilPro S.A."),
    ("Mecanismo Roller",    95,  80, "unidades",120.0, "MecanSur"),
    ("Tubo Aluminio",      340, 120, "metros",  18.5, "AlumBolivia"),
    ("Cordón",              68,  90, "metros",   5.0, "TextilPro S.A."),  # crítico
    ("Tela Romana",        195,  60, "metros",  55.0, "TextilPro S.A."),
    ("Lámina Veneciana",   240,  80, "metros",  28.0, "AlumBolivia"),
    ("Herrajes",           310, 100, "unidades", 12.0, "FerreMax"),
]

for nombre, stock, minimo, unidad, precio, prov in materiales_data:
    m = Material(nombre=nombre, stock_actual=stock, stock_minimo=minimo,
                 unidad=unidad, precio_unitario=precio, proveedor=prov)
    db.add(m)
db.commit()
print(f"  - {len(materiales_data)} materiales creados")

# ─── PEDIDOS (últimos 8 meses) ────────────────────────────────────────────────
print("Creando pedidos históricos...")
tipos = ["Blackout", "Roller", "Romana", "Panel", "Veneciana"]
temporadas = ["Verano", "Otoño", "Invierno", "Primavera"]
precios = {"Blackout": 1200, "Roller": 800, "Romana": 1250, "Panel": 1800, "Veneciana": 600}

# Cantidades mensuales que coinciden con el frontend (ene-ago 2026)
ventas_por_mes = [145, 168, 192, 175, 210, 245, 268, 290]
hoy = datetime.now()

pedido_counter = 1001
pedidos_creados = []

for mes_offset in range(7, -1, -1):  # 8 meses atrás
    fecha_mes = hoy - timedelta(days=mes_offset * 30)
    cantidad_mes = ventas_por_mes[7 - mes_offset]
    num_pedidos = cantidad_mes // 8  # aprox pedidos individuales

    for _ in range(num_pedidos):
        cliente = random.choice(clientes)
        tipo = random.choices(tipos, weights=[35, 28, 18, 12, 7])[0]
        cantidad = random.randint(1, 15)
        precio = precios[tipo]
        dias_random = random.randint(0, 28)
        fecha = fecha_mes.replace(day=1) + timedelta(days=dias_random)
        temporada = random.choice(temporadas)
        estado = random.choices(
            ["Confirmado", "Entregado", "Pendiente", "Cancelado"],
            weights=[20, 60, 10, 10]
        )[0]

        p = Pedido(
            codigo=f"PED-{pedido_counter}",
            cliente_id=cliente.id,
            tipo_cortina=tipo,
            cantidad=cantidad,
            precio_unitario=precio,
            total=cantidad * precio,
            temporada=temporada,
            estado=estado,
            fecha_pedido=fecha,
            fecha_entrega=fecha + timedelta(days=random.randint(5, 20)) if estado == "Entregado" else None,
        )
        db.add(p)
        pedidos_creados.append(p)
        pedido_counter += 1

db.commit()
print(f"  - {len(pedidos_creados)} pedidos creados")

# ─── PRODUCCIÓN ───────────────────────────────────────────────────────────────
print("Creando registros de producción...")
operarios = ["Juan Quispe", "Pedro Mamani", "Rosa Flores", "Luis Condori"]
for p in pedidos_creados:
    estado_prod = "Entregado" if p.estado == "Entregado" else "En proceso"
    prod = Produccion(
        pedido_id=p.id,
        estado=estado_prod,
        fecha_inicio=p.fecha_pedido + timedelta(days=1),
        fecha_fin=p.fecha_entrega if estado_prod == "Entregado" else None,
        operario=random.choice(operarios),
    )
    db.add(prod)
db.commit()
print(f"  - {len(pedidos_creados)} registros de producción")

# ─── VENTAS MENSUALES (resumen) ────────────────────────────────────────────────
print("Calculando resumen mensual...")
from sqlalchemy import func, extract

for mes_offset in range(7, -1, -1):
    fecha_mes = hoy - timedelta(days=mes_offset * 30)
    anio = fecha_mes.year
    mes = fecha_mes.month

    total_p = (
        db.query(func.count(Pedido.id))
        .filter(
            extract("year", Pedido.fecha_pedido) == anio,
            extract("month", Pedido.fecha_pedido) == mes,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 0
    )
    total_m = (
        db.query(func.sum(Pedido.total))
        .filter(
            extract("year", Pedido.fecha_pedido) == anio,
            extract("month", Pedido.fecha_pedido) == mes,
            Pedido.estado != "Cancelado",
        )
        .scalar() or 0.0
    )

    vm = VentaMensual(anio=anio, mes=mes, total_pedidos=total_p, total_monto=total_m)
    db.add(vm)
db.commit()
print("  - Resumen mensual calculado")

# ─── QUEJAS ───────────────────────────────────────────────────────────────────
print("Creando quejas de ejemplo...")
quejas_data = [
    (clientes[1].id, "Demora en la entrega del pedido PED-1020", "Entrega", "Resuelta"),
    (clientes[2].id, "Cortina llegó con defecto de costura", "Calidad", "En revisión"),
    (None,            "Atención al cliente fue poco amable", "Atención", "Abierta"),
    (clientes[0].id, "Color no coincide con la muestra", "Calidad", "Resuelta"),
    (clientes[4].id, "Mecanismo roller con falla al bajar", "Calidad", "Abierta"),
]
for cid, desc, tipo, estado in quejas_data:
    q = Queja(cliente_id=cid, descripcion=desc, tipo=tipo, estado=estado)
    db.add(q)
db.commit()
print(f"  - {len(quejas_data)} quejas creadas")

db.close()
print("\nSeed completado exitosamente!")
print("   Puedes iniciar el servidor con: uvicorn main:app --reload")
