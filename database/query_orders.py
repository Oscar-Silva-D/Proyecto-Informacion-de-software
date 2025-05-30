import sqlite3
import datetime

# Conectar a la base de datos
conn = sqlite3.connect('database/restaurant.db')
cursor = conn.cursor()

# Consultar los pedidos y sus items
cursor.execute("""
    SELECT 
        o.id,
        o.timestamp,
        o.status,
        o.total,
        o.payment_method,
        o.estimated_time,
        o.start_time,
        o.progress,
        GROUP_CONCAT(
            oi.quantity || 'x ' || m.name
        ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN menu_items m ON oi.menu_item_id = m.id
    GROUP BY o.id
    ORDER BY o.timestamp DESC
""")

orders = cursor.fetchall()

print("\n=== PEDIDOS ===")
print("-" * 100)

for order in orders:
    order_id, timestamp, status, total, payment_method, estimated_time, start_time, progress, items = order
    
    # Formatear la fecha
    try:
        timestamp = datetime.datetime.fromisoformat(timestamp).strftime('%Y-%m-%d %H:%M:%S')
    except:
        timestamp = "N/A"
    
    try:
        start_time = datetime.datetime.fromisoformat(start_time).strftime('%Y-%m-%d %H:%M:%S') if start_time else "No iniciado"
    except:
        start_time = "N/A"
    
    print(f"ID del Pedido: {order_id}")
    print(f"Fecha: {timestamp}")
    print(f"Estado: {status}")
    print(f"Total: ${total:.2f}")
    print(f"Método de Pago: {payment_method}")
    print(f"Tiempo Estimado: {estimated_time} minutos")
    print(f"Hora de Inicio: {start_time}")
    print(f"Progreso: {progress}%")
    print(f"Items: {items if items else 'Sin items'}")
    print("-" * 100)

conn.close() 